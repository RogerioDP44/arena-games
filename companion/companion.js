const { WebSocketServer, WebSocket } = require('ws');
const dgram = require('dgram');
const net = require('net');

// Porta padrão para o site se comunicar com o companion
const LOCAL_WS_PORT = 18888;

// URL padrão do servidor relay
const DEFAULT_RELAY_URL = 'wss://arena-relay-43d6.onrender.com';

let localWss = null;
let activeTunnel = null; // Guardará o estado do túnel ativo

// Inicia o servidor WS local para ouvir comandos do site
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
                    startHostTunnel(ws, command.lobbyId, command.gamePort, command.protocol || 'udp', command.relayUrl || DEFAULT_RELAY_URL);
                } else if (command.action === 'join') {
                    stopActiveTunnel();
                    startGuestTunnel(ws, command.lobbyId, command.gamePort, command.clientId, command.protocol || 'udp', command.relayUrl || DEFAULT_RELAY_URL);
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

function stopActiveTunnel() {
    if (activeTunnel) {
        console.log('[Companion] Fechando túnel ativo...');
        activeTunnel.cleanup();
        activeTunnel = null;
    }
}

// --- MODO HOST (HOSPEDADOR DA SALA) ---
function startHostTunnel(siteWs, lobbyId, gamePort, protocol, relayUrl) {
    console.log(`[Companion] Iniciando túnel Host para lobby ${lobbyId} na porta ${gamePort} [Protocolo: ${protocol.toUpperCase()}]`);

    const relayWs = new WebSocket(relayUrl);
    const guests = new Map(); // clientId => { socket } (UDP ou TCP)

    const cleanup = () => {
        try { relayWs.close(); } catch (e) {}
        for (const [clientId, info] of guests.entries()) {
            try { info.socket.destroy ? info.socket.destroy() : info.socket.close(); } catch (e) {}
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
                
                // Tratar eventos de controle TCP
                if (protocol === 'tcp') {
                    if (data.type === 'tcp_connect') {
                        // O Guest iniciou uma conexão TCP. Nós criamos uma conexão local correspondente com o jogo do host.
                        console.log(`[Companion/Host] Guest ${data.clientId} abrindo conexão TCP com o jogo...`);
                        
                        const tcpSocket = new net.Socket();
                        
                        tcpSocket.connect(gamePort, '127.0.0.1', () => {
                            console.log(`[Companion/Host] Conexão TCP estabelecida com o jogo local na porta ${gamePort} para ${data.clientId}`);
                        });

                        tcpSocket.on('data', (msg) => {
                            // Resposta TCP do jogo -> envia ao Relay com o prefixo do clientId
                            if (relayWs.readyState === WebSocket.OPEN) {
                                const idBuffer = Buffer.from(data.clientId);
                                const combined = Buffer.alloc(1 + idBuffer.length + msg.length);
                                combined.writeUInt8(idBuffer.length, 0);
                                idBuffer.copy(combined, 1);
                                msg.copy(combined, 1 + idBuffer.length);
                                
                                relayWs.send(combined, { binary: true });
                            }
                        });

                        tcpSocket.on('close', () => {
                            console.log(`[Companion/Host] Conexão TCP com o jogo fechada pelo Guest ${data.clientId}`);
                            relayWs.send(JSON.stringify({ type: 'tcp_close', clientId: data.clientId }));
                            guests.delete(data.clientId);
                        });

                        tcpSocket.on('error', (err) => {
                            console.error(`[Companion/Host] Erro no socket TCP do Guest ${data.clientId}:`, err.message);
                        });

                        guests.set(data.clientId, { socket: tcpSocket });
                    } else if (data.type === 'tcp_close') {
                        const guestInfo = guests.get(data.clientId);
                        if (guestInfo) {
                            guestInfo.socket.destroy();
                            guests.delete(data.clientId);
                        }
                    }
                }

                if (data.type === 'guest_left') {
                    const guestInfo = guests.get(data.clientId);
                    if (guestInfo) {
                        if (protocol === 'udp') {
                            guestInfo.socket.close();
                        } else {
                            guestInfo.socket.destroy();
                        }
                        guests.delete(data.clientId);
                        console.log(`[Companion/Host] Guest ${data.clientId} saiu. Conexão fechada.`);
                    }
                }
            } catch (e) {
                console.error('[Companion/Host] Erro ao tratar mensagem de controle:', e);
            }
            return;
        }

        // Dados binários recebidos do Relay
        if (message.length < 2) return;
        const idLength = message.readUInt8(0);
        if (message.length < 1 + idLength) return;

        const clientId = message.toString('utf8', 1, 1 + idLength);
        const payload = message.subarray(1 + idLength);

        let guestInfo = guests.get(clientId);

        if (protocol === 'udp') {
            // --- PROXY UDP ---
            if (!guestInfo) {
                const udpSocket = dgram.createSocket('udp4');
                
                udpSocket.on('message', (msg) => {
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
                    console.error(`[Companion/Host] Erro no socket UDP do Guest ${clientId}:`, err);
                });

                guestInfo = { socket: udpSocket };
                guests.set(clientId, guestInfo);
                console.log(`[Companion/Host] Novo socket UDP criado para o Guest ${clientId}`);
            }

            guestInfo.socket.send(payload, gamePort, '127.0.0.1', (err) => {
                if (err) console.error(`[Companion/Host] Erro ao enviar pacote para o jogo local:`, err);
            });
        } else {
            // --- PROXY TCP ---
            if (guestInfo) {
                guestInfo.socket.write(payload);
            }
        }
    });

    relayWs.on('close', () => {
        console.log('[Companion/Host] Conexão com o Relay fechada.');
        siteWs.send(JSON.stringify({ type: 'tunnel_status', status: 'disconnected', role: 'host' }));
        stopActiveTunnel();
    });

    relayWs.on('error', (err) => {
        console.error('[Companion/Host] Erro no Relay:', err);
        siteWs.send(JSON.stringify({ type: 'tunnel_status', status: 'error', error: err.message }));
    });
}

// --- MODO GUEST (CONVIDADO DA SALA) ---
function startGuestTunnel(siteWs, lobbyId, gamePort, clientId, protocol, relayUrl) {
    console.log(`[Companion] Iniciando túnel Guest para lobby ${lobbyId} na porta ${gamePort}. ID: ${clientId} [Protocolo: ${protocol.toUpperCase()}]`);

    const relayWs = new WebSocket(relayUrl);
    let localServer = null; // Servidor UDP ou TCP local
    let lastClientAddr = null; // Apenas UDP (guarda endereço de retorno)
    let tcpGuestSocket = null; // Apenas TCP (guarda conexão do jogo do guest)

    const cleanup = () => {
        try { relayWs.close(); } catch (e) {}
        try { 
            if (localServer) {
                localServer.close ? localServer.close() : localServer.close(); 
            }
        } catch (e) {}
        try { if (tcpGuestSocket) tcpGuestSocket.destroy(); } catch (e) {}
        console.log('[Companion] Recursos do Guest liberados.');
    };

    activeTunnel = { cleanup };

    if (protocol === 'udp') {
        // --- PROXY UDP ---
        localServer = dgram.createSocket('udp4');
        try {
            localServer.bind(gamePort, '127.0.0.1', () => {
                console.log(`[Companion/Guest] Ouvindo pacotes locais na porta UDP ${gamePort}`);
            });
        } catch (err) {
            console.error(`[Companion/Guest] Não foi possível abrir a porta local UDP ${gamePort}:`, err);
            siteWs.send(JSON.stringify({ type: 'error', message: `Porta UDP ${gamePort} já está em uso!` }));
            cleanup();
            return;
        }

        localServer.on('message', (msg, rinfo) => {
            lastClientAddr = rinfo;
            if (relayWs.readyState === WebSocket.OPEN) {
                relayWs.send(msg, { binary: true });
            }
        });

        localServer.on('error', (err) => {
            console.error('[Companion/Guest] Erro no socket local UDP:', err);
            siteWs.send(JSON.stringify({ type: 'tunnel_status', status: 'error', error: err.message }));
        });
    } else {
        // --- PROXY TCP ---
        // Cria um servidor TCP local na porta do jogo. Quando o jogo do Guest conectar nele, 
        // nós abrimos o canal através do Relay.
        localServer = net.createServer((socket) => {
            console.log('[Companion/Guest] Jogo local abriu conexão TCP no túnel.');
            tcpGuestSocket = socket;

            // Avisa o host para ele abrir a conexão TCP correspondente com o jogo dele
            if (relayWs.readyState === WebSocket.OPEN) {
                relayWs.send(JSON.stringify({ type: 'tcp_connect' }));
            }

            socket.on('data', (data) => {
                // Envia dados do jogo local para o Relay
                if (relayWs.readyState === WebSocket.OPEN) {
                    relayWs.send(data, { binary: true });
                }
            });

            socket.on('close', () => {
                console.log('[Companion/Guest] Conexão TCP com o jogo fechada localmente.');
                if (relayWs.readyState === WebSocket.OPEN) {
                    relayWs.send(JSON.stringify({ type: 'tcp_close' }));
                }
                tcpGuestSocket = null;
            });

            socket.on('error', (err) => {
                console.error('[Companion/Guest] Erro na conexão TCP local:', err.message);
            });
        });

        localServer.listen(gamePort, '127.0.0.1', () => {
            console.log(`[Companion/Guest] Ouvindo conexões locais na porta TCP ${gamePort}`);
        });

        localServer.on('error', (err) => {
            console.error(`[Companion/Guest] Erro ao abrir servidor TCP local na porta ${gamePort}:`, err.message);
            siteWs.send(JSON.stringify({ type: 'error', message: `Porta TCP ${gamePort} já está em uso!` }));
            cleanup();
        });
    }

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
                } else if (data.type === 'tcp_close') {
                    if (tcpGuestSocket) {
                        tcpGuestSocket.destroy();
                        tcpGuestSocket = null;
                    }
                }
            } catch (e) {}
            return;
        }

        // Dados binários recebidos do Host -> repassa para o jogo local
        if (protocol === 'udp') {
            if (lastClientAddr) {
                localServer.send(message, lastClientAddr.port, lastClientAddr.address, (err) => {
                    if (err) console.error('[Companion/Guest] Erro ao enviar resposta para o jogo local:', err);
                });
            }
        } else {
            if (tcpGuestSocket) {
                tcpGuestSocket.write(message);
            }
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

startLocalWss();
