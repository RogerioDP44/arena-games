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
                    startDualTunnelHost(ws, command.lobbyId, command.gamePort, command.relayUrl || DEFAULT_RELAY_URL);
                } else if (command.action === 'join') {
                    stopActiveTunnel();
                    startDualTunnelGuest(ws, command.lobbyId, command.gamePort, command.clientId, command.relayUrl || DEFAULT_RELAY_URL);
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

// --- DUAL TUNNEL HOST (HOSPEDADOR DA SALA: SUPORTA TCP E UDP SIMULTANEAMENTE) ---
function startDualTunnelHost(siteWs, lobbyId, gamePort, relayUrl) {
    console.log(`[Companion/Host] Iniciando túnel DUAL (TCP/UDP) para lobby ${lobbyId} na porta ${gamePort}`);

    const relayWs = new WebSocket(relayUrl);
    const udpGuests = new Map(); // clientId => { socket }
    const tcpGuests = new Map(); // clientId => { socket }

    const cleanup = () => {
        try { relayWs.close(); } catch (e) {}
        
        // Limpar sockets UDP
        for (const [clientId, info] of udpGuests.entries()) {
            try { info.socket.close(); } catch (e) {}
        }
        udpGuests.clear();

        // Limpar sockets TCP
        for (const [clientId, info] of tcpGuests.entries()) {
            try { info.socket.destroy(); } catch (e) {}
        }
        tcpGuests.clear();
        
        console.log('[Companion/Host] Recursos do Host liberados.');
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
                
                if (data.type === 'tcp_connect') {
                    // Um Guest abriu uma conexão TCP. Conectamos no jogo local.
                    console.log(`[Companion/Host] Guest ${data.clientId} solicitou conexão TCP com o jogo...`);
                    
                    const tcpSocket = new net.Socket();
                    tcpSocket.connect(gamePort, '127.0.0.1', () => {
                        console.log(`[Companion/Host] Conexão TCP estabelecida com o jogo local na porta ${gamePort} para ${data.clientId}`);
                    });

                    tcpSocket.on('data', (msg) => {
                        if (relayWs.readyState === WebSocket.OPEN) {
                            const idBuffer = Buffer.from(data.clientId);
                            // Formato: [idLength (1B)] + [clientId] + [protocol (1B: 1=TCP)] + [payload]
                            const combined = Buffer.alloc(1 + idBuffer.length + 1 + msg.length);
                            combined.writeUInt8(idBuffer.length, 0);
                            idBuffer.copy(combined, 1);
                            combined.writeUInt8(1, 1 + idBuffer.length); // 1 = TCP
                            msg.copy(combined, 1 + idBuffer.length + 1);
                            
                            relayWs.send(combined, { binary: true });
                        }
                    });

                    tcpSocket.on('close', () => {
                        console.log(`[Companion/Host] Conexão TCP com o jogo fechada pelo Guest ${data.clientId}`);
                        relayWs.send(JSON.stringify({ type: 'tcp_close', clientId: data.clientId }));
                        tcpGuests.delete(data.clientId);
                    });

                    tcpSocket.on('error', (err) => {
                        console.error(`[Companion/Host] Erro no socket TCP do Guest ${data.clientId}:`, err.message);
                    });

                    tcpGuests.set(data.clientId, { socket: tcpSocket });
                } else if (data.type === 'tcp_close') {
                    const guestInfo = tcpGuests.get(data.clientId);
                    if (guestInfo) {
                        guestInfo.socket.destroy();
                        tcpGuests.delete(data.clientId);
                    }
                } else if (data.type === 'guest_left') {
                    // Cleanup UDP
                    const udpInfo = udpGuests.get(data.clientId);
                    if (udpInfo) {
                        udpInfo.socket.close();
                        udpGuests.delete(data.clientId);
                    }
                    // Cleanup TCP
                    const tcpInfo = tcpGuests.get(data.clientId);
                    if (tcpInfo) {
                        tcpInfo.socket.destroy();
                        tcpGuests.delete(data.clientId);
                    }
                    console.log(`[Companion/Host] Guest ${data.clientId} saiu. Conexões limpas.`);
                }
            } catch (e) {
                console.error('[Companion/Host] Erro ao processar mensagem de controle:', e);
            }
            return;
        }

        // Dados binários recebidos do Relay
        // Formato esperado de entrada do Relay (já concatenado com o ID pelo servidor):
        // [idLength (1B)] + [clientId] + [protocol (1B: 0=UDP, 1=TCP)] + [payload]
        if (message.length < 3) return;
        const idLength = message.readUInt8(0);
        if (message.length < 1 + idLength + 1) return;

        const clientId = message.toString('utf8', 1, 1 + idLength);
        const protocol = message.readUInt8(1 + idLength);
        const payload = message.subarray(1 + idLength + 1);

        if (protocol === 0) {
            // --- PROXY UDP ---
            let guestInfo = udpGuests.get(clientId);
            if (!guestInfo) {
                const udpSocket = dgram.createSocket('udp4');
                
                udpSocket.on('message', (msg) => {
                    if (relayWs.readyState === WebSocket.OPEN) {
                        const idBuffer = Buffer.from(clientId);
                        const combined = Buffer.alloc(1 + idBuffer.length + 1 + msg.length);
                        combined.writeUInt8(idBuffer.length, 0);
                        idBuffer.copy(combined, 1);
                        combined.writeUInt8(0, 1 + idBuffer.length); // 0 = UDP
                        msg.copy(combined, 1 + idBuffer.length + 1);
                        
                        relayWs.send(combined, { binary: true });
                    }
                });

                udpSocket.on('error', (err) => {
                    console.error(`[Companion/Host] Erro no socket UDP do Guest ${clientId}:`, err);
                });

                guestInfo = { socket: udpSocket };
                udpGuests.set(clientId, guestInfo);
                console.log(`[Companion/Host] Novo socket UDP criado para o Guest ${clientId}`);
            }

            guestInfo.socket.send(payload, gamePort, '127.0.0.1', (err) => {
                if (err) console.error(`[Companion/Host] Erro ao enviar pacote UDP para o jogo local:`, err);
            });
        } else if (protocol === 1) {
            // --- PROXY TCP ---
            const guestInfo = tcpGuests.get(clientId);
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

// --- DUAL TUNNEL GUEST (CONVIDADO DA SALA: SUPORTA TCP E UDP SIMULTANEAMENTE) ---
function startDualTunnelGuest(siteWs, lobbyId, gamePort, clientId, relayUrl) {
    console.log(`[Companion/Guest] Iniciando túnel DUAL (TCP/UDP) para lobby ${lobbyId} na porta ${gamePort}. ID: ${clientId}`);

    const relayWs = new WebSocket(relayUrl);
    let localUdpServer = null;
    let localTcpServer = null;
    let lastUdpClientAddr = null;
    let activeTcpSocket = null;

    const cleanup = () => {
        try { relayWs.close(); } catch (e) {}
        try { if (localUdpServer) localUdpServer.close(); } catch (e) {}
        try { if (localTcpServer) localTcpServer.close(); } catch (e) {}
        try { if (activeTcpSocket) activeTcpSocket.destroy(); } catch (e) {}
        console.log('[Companion/Guest] Recursos do Guest liberados.');
    };

    activeTunnel = { cleanup };

    // 1. Iniciar Servidor UDP Local
    localUdpServer = dgram.createSocket('udp4');
    try {
        localUdpServer.bind(gamePort, '127.0.0.1', () => {
            console.log(`[Companion/Guest] Ouvindo pacotes locais na porta UDP ${gamePort}`);
        });
    } catch (err) {
        console.error(`[Companion/Guest] Falha ao abrir porta UDP ${gamePort}:`, err.message);
        siteWs.send(JSON.stringify({ type: 'error', message: `Porta UDP ${gamePort} em uso!` }));
        cleanup();
        return;
    }

    localUdpServer.on('message', (msg, rinfo) => {
        lastUdpClientAddr = rinfo;
        if (relayWs.readyState === WebSocket.OPEN) {
            // Formato enviado para o Relay (Guest->Host):
            // [protocol (1B: 0=UDP)] + [payload]
            const combined = Buffer.alloc(1 + msg.length);
            combined.writeUInt8(0, 0); // 0 = UDP
            msg.copy(combined, 1);
            relayWs.send(combined, { binary: true });
        }
    });

    localUdpServer.on('error', (err) => {
        console.error('[Companion/Guest] Erro no socket local UDP:', err.message);
    });

    // 2. Iniciar Servidor TCP Local
    localTcpServer = net.createServer((socket) => {
        console.log('[Companion/Guest] Jogo local abriu conexão TCP no túnel.');
        activeTcpSocket = socket;

        if (relayWs.readyState === WebSocket.OPEN) {
            relayWs.send(JSON.stringify({ type: 'tcp_connect' }));
        }

        socket.on('data', (data) => {
            if (relayWs.readyState === WebSocket.OPEN) {
                // Formato enviado para o Relay (Guest->Host):
                // [protocol (1B: 1=TCP)] + [payload]
                const combined = Buffer.alloc(1 + data.length);
                combined.writeUInt8(1, 0); // 1 = TCP
                data.copy(combined, 1);
                relayWs.send(combined, { binary: true });
            }
        });

        socket.on('close', () => {
            console.log('[Companion/Guest] Conexão TCP com o jogo fechada localmente.');
            if (relayWs.readyState === WebSocket.OPEN) {
                relayWs.send(JSON.stringify({ type: 'tcp_close' }));
            }
            activeTcpSocket = null;
        });

        socket.on('error', (err) => {
            console.error('[Companion/Guest] Erro na conexão TCP local:', err.message);
        });
    });

    localTcpServer.listen(gamePort, '127.0.0.1', () => {
        console.log(`[Companion/Guest] Ouvindo conexões locais na porta TCP ${gamePort}`);
    });

    localTcpServer.on('error', (err) => {
        console.error(`[Companion/Guest] Falha ao abrir servidor TCP local na porta ${gamePort}:`, err.message);
        siteWs.send(JSON.stringify({ type: 'error', message: `Porta TCP ${gamePort} em uso!` }));
        cleanup();
    });

    // 3. Conexão com o Relay
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
                    if (activeTcpSocket) {
                        activeTcpSocket.destroy();
                        activeTcpSocket = null;
                    }
                }
            } catch (e) {}
            return;
        }

        // Dados binários recebidos do Host -> repassa para o jogo local
        // Formato recebido do Relay (Host->Guest):
        // [protocol (1B: 0=UDP, 1=TCP)] + [payload]
        if (message.length < 2) return;
        const protocol = message.readUInt8(0);
        const payload = message.subarray(1);

        if (protocol === 0) {
            // Repassar via UDP
            if (lastUdpClientAddr) {
                localUdpServer.send(payload, lastUdpClientAddr.port, lastUdpClientAddr.address, (err) => {
                    if (err) console.error('[Companion/Guest] Erro ao enviar resposta UDP para o jogo local:', err);
                });
            }
        } else if (protocol === 1) {
            // Repassar via TCP
            if (activeTcpSocket) {
                activeTcpSocket.write(payload);
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
