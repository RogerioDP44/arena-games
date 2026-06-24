const { WebSocketServer, WebSocket } = require('ws');
const dgram = require('dgram');

// Porta padrão para o site se comunicar com o companion
const LOCAL_WS_PORT = 18888;

// URL padrão do servidor relay (pode ser substituído pelo site)
const DEFAULT_RELAY_URL = 'ws://localhost:8080'; // Alterar para o domínio de produção

let localWss = null;
let activeTunnel = null; // Guardará o estado do túnel ativo

// Inicia o servidor WS local para ouvir comandos do frontend (Arena Games)
function startLocalWss() {
    localWss = new WebSocketServer({ port: LOCAL_WS_PORT });

    localWss.on('connection', (ws) => {
        console.log('[Companion] Site se conectou ao Companion App.');
        ws.send(JSON.stringify({ type: 'status', status: 'ready', tunnelActive: !!activeTunnel }));

        ws.on('message', async (message) => {
            try {
                const command = JSON.parse(message.toString());
                console.log('[Companion] Comando recebido do site:', command);

                if (command.action === 'host') {
                    stopActiveTunnel();
                    startHostTunnel(ws, command.lobbyId, command.gamePort, command.relayUrl || DEFAULT_RELAY_URL);
                } else if (command.action === 'join') {
                    stopActiveTunnel();
                    startGuestTunnel(ws, command.lobbyId, command.gamePort, command.clientId, command.relayUrl || DEFAULT_RELAY_URL);
                } else if (command.action === 'stop') {
                    stopActiveTunnel();
                    ws.send(JSON.stringify({ type: 'status', status: 'ready', tunnelActive: false }));
                }
            } catch (err) {
                console.error('[Companion] Erro ao processar comando do site:', err);
                ws.send(JSON.stringify({ type: 'error', message: err.message }));
            }
        });

        ws.on('close', () => {
            console.log('[Companion] Conexão com o site encerrada.');
        });
    });

    console.log(`[Companion App] Rodando localmente na porta WS ${LOCAL_WS_PORT}`);
}

// Para qualquer túnel ativo e limpa recursos (sockets, conexões)
function stopActiveTunnel() {
    if (activeTunnel) {
        console.log('[Companion] Fechando túnel ativo...');
        activeTunnel.cleanup();
        activeTunnel = null;
    }
}

// --- MODO HOST (HOSPEDADOR DA SALA) ---
function startHostTunnel(siteWs, lobbyId, gamePort, relayUrl) {
    console.log(`[Companion] Iniciando túnel Host para lobby ${lobbyId} na porta de jogo ${gamePort}`);

    const relayWs = new WebSocket(relayUrl);
    const guests = new Map(); // clientId => { udpSocket, remotePort }

    const cleanup = () => {
        try { relayWs.close(); } catch (e) {}
        for (const [clientId, info] of guests.entries()) {
            try { info.udpSocket.close(); } catch (e) {}
        }
        guests.clear();
        console.log('[Companion] Recursos do Host liberados.');
    };

    activeTunnel = { cleanup };

    relayWs.on('open', () => {
        console.log('[Companion/Host] Conectado ao servidor Relay.');
        relayWs.send(JSON.stringify({ type: 'init', role: 'host', lobbyId }));
        siteWs.send(JSON.stringify({ type: 'tunnel_status', status: 'connected', role: 'host' }));
    });

    relayWs.on('message', (message, isBinary) => {
        if (!isBinary) {
            // Mensagens de controle do Relay
            try {
                const data = JSON.parse(message.toString());
                if (data.type === 'guest_left') {
                    const guestInfo = guests.get(data.clientId);
                    if (guestInfo) {
                        guestInfo.udpSocket.close();
                        guests.delete(data.clientId);
                        console.log(`[Companion/Host] Guest ${data.clientId} saiu. Socket fechado.`);
                    }
                }
            } catch (e) {}
            return;
        }

        // Dados binários do Guest recebidos do Relay
        // Formato: [idLength (1B)] + [clientId] + [payload]
        if (message.length < 2) return;
        const idLength = message.readUInt8(0);
        if (message.length < 1 + idLength) return;

        const clientId = message.toString('utf8', 1, 1 + idLength);
        const payload = message.subarray(1 + idLength);

        let guestInfo = guests.get(clientId);
        if (!guestInfo) {
            // Cria um socket UDP dedicado para representar este convidado perante o servidor local do jogo
            const udpSocket = dgram.createSocket('udp4');
            
            udpSocket.on('message', (msg) => {
                // Resposta do servidor do jogo local -> envia de volta ao Relay
                if (relayWs.readyState === WebSocket.OPEN) {
                    const idBuffer = Buffer.from(clientId);
                    const combined = Buffer.alloc(1 + idBuffer.length + msg.length);
                    combined.writeUInt8(idBuffer.length, 0);
                    idBuffer.copy(combined, 1);
                    msg.copy(combined, 1 + idBuffer.length);
                    
                    relayWs.send(combined, { binary: true });
                }
            });

            udpSocket.on('error', (err) => {
                console.error(`[Companion/Host] Erro no socket UDP do convidado ${clientId}:`, err);
            });

            guestInfo = { udpSocket };
            guests.set(clientId, guestInfo);
            console.log(`[Companion/Host] Novo socket UDP criado para o Guest ${clientId}`);
        }

        // Encaminha os dados recebidos do guest para o servidor do jogo rodando no próprio PC (127.0.0.1:gamePort)
        guestInfo.udpSocket.send(payload, gamePort, '127.0.0.1', (err) => {
            if (err) console.error(`[Companion/Host] Erro ao enviar pacote para o jogo local:`, err);
        });
    });

    relayWs.on('close', () => {
        console.log('[Companion/Host] Conexão com o Relay fechada.');
        siteWs.send(JSON.stringify({ type: 'tunnel_status', status: 'disconnected', role: 'host' }));
        stopActiveTunnel();
    });

    relayWs.on('error', (err) => {
        console.error('[Companion/Host] Erro na conexão com o Relay:', err);
        siteWs.send(JSON.stringify({ type: 'tunnel_status', status: 'error', error: err.message }));
    });
}

// --- MODO GUEST (CONVIDADO DA SALA) ---
function startGuestTunnel(siteWs, lobbyId, gamePort, clientId, relayUrl) {
    console.log(`[Companion] Iniciando túnel Guest para lobby ${lobbyId} na porta ${gamePort}. ID: ${clientId}`);

    const relayWs = new WebSocket(relayUrl);
    const localUdpServer = dgram.createSocket('udp4');
    let lastClientAddr = null; // Endereço do cliente de jogo local (ex: porta do CS do jogador)

    const cleanup = () => {
        try { relayWs.close(); } catch (e) {}
        try { localUdpServer.close(); } catch (e) {}
        console.log('[Companion] Recursos do Guest liberados.');
    };

    activeTunnel = { cleanup };

    // Tenta abrir o servidor UDP local na porta do jogo (Ex: 27015)
    // Isso simula o servidor de CS local para o jogo do Guest se conectar
    try {
        localUdpServer.bind(gamePort, '127.0.0.1', () => {
            console.log(`[Companion/Guest] Ouvindo pacotes locais na porta UDP ${gamePort}`);
        });
    } catch (err) {
        console.error(`[Companion/Guest] Não foi possível abrir a porta local ${gamePort}:`, err);
        siteWs.send(JSON.stringify({ type: 'error', message: `Porta ${gamePort} já está em uso no seu PC!` }));
        cleanup();
        return;
    }

    localUdpServer.on('message', (msg, rinfo) => {
        // Guarda a porta de saída do jogo local para saber para onde devolver as respostas do host
        lastClientAddr = rinfo;
        
        // Envia o pacote de jogo do cliente local para o Relay
        if (relayWs.readyState === WebSocket.OPEN) {
            relayWs.send(msg, { binary: true });
        }
    });

    localUdpServer.on('error', (err) => {
        console.error('[Companion/Guest] Erro no socket local UDP:', err);
        siteWs.send(JSON.stringify({ type: 'tunnel_status', status: 'error', error: err.message }));
    });

    relayWs.on('open', () => {
        console.log('[Companion/Guest] Conectado ao servidor Relay.');
        relayWs.send(JSON.stringify({ type: 'init', role: 'guest', lobbyId, clientId }));
        siteWs.send(JSON.stringify({ type: 'tunnel_status', status: 'connected', role: 'guest' }));
    });

    relayWs.on('message', (message, isBinary) => {
        if (!isBinary) {
            // Controle
            try {
                const data = JSON.parse(message.toString());
                if (data.type === 'host_disconnected') {
                    console.log('[Companion/Guest] O host desconectou.');
                    siteWs.send(JSON.stringify({ type: 'tunnel_status', status: 'disconnected', reason: 'host_left' }));
                    stopActiveTunnel();
                }
            } catch (e) {}
            return;
        }

        // Resposta de rede vinda do Host via Relay -> Repassa de volta para o cliente de jogo local
        if (lastClientAddr) {
            localUdpServer.send(message, lastClientAddr.port, lastClientAddr.address, (err) => {
                if (err) console.error('[Companion/Guest] Erro ao enviar resposta para o jogo local:', err);
            });
        }
    });

    relayWs.on('close', () => {
        console.log('[Companion/Guest] Conexão com o Relay fechada.');
        siteWs.send(JSON.stringify({ type: 'tunnel_status', status: 'disconnected', role: 'guest' }));
        stopActiveTunnel();
    });

    relayWs.on('error', (err) => {
        console.error('[Companion/Guest] Erro na conexão com o Relay:', err);
        siteWs.send(JSON.stringify({ type: 'tunnel_status', status: 'error', error: err.message }));
    });
}

// Inicia o app
startLocalWss();
