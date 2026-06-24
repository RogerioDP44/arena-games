const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 8080;
const wss = new WebSocketServer({ port: PORT });

// Estrutura das salas:
// rooms = {
//   [lobbyId]: {
//     hostSocket: WebSocket,
//     guests: Map(clientId => WebSocket)
//   }
// }
const rooms = new Map();

wss.on('connection', (ws) => {
    let clientInfo = null; // { role, lobbyId, clientId }

    ws.on('message', (message, isBinary) => {
        if (!isBinary) {
            // Mensagens de texto são para sinalização/inicialização
            try {
                const data = JSON.parse(message.toString());
                
                if (data.type === 'init') {
                    const { role, lobbyId, clientId } = data;
                    clientInfo = { role, lobbyId, clientId };

                    if (!rooms.has(lobbyId)) {
                        rooms.set(lobbyId, { hostSocket: null, guests: new Map() });
                    }
                    const room = rooms.get(lobbyId);

                    if (role === 'host') {
                        room.hostSocket = ws;
                        console.log(`[Relay] Host registrado no lobby ${lobbyId}`);
                    } else if (role === 'guest') {
                        room.guests.set(clientId, ws);
                        console.log(`[Relay] Guest ${clientId} registrado no lobby ${lobbyId}`);
                        
                        // Notificar o Host sobre o novo convidado
                        if (room.hostSocket && room.hostSocket.readyState === ws.OPEN) {
                            room.hostSocket.send(JSON.stringify({ type: 'guest_joined', clientId }));
                        }
                    }
                } else {
                    // Encaminhar mensagens de controle (ex: tcp_connect, tcp_close)
                    if (!clientInfo) return;
                    const { role, lobbyId, clientId } = clientInfo;
                    const room = rooms.get(lobbyId);
                    if (!room) return;

                    if (role === 'guest') {
                        // Repassa para o Host contendo o ID do Guest de origem
                        if (room.hostSocket && room.hostSocket.readyState === ws.OPEN) {
                            const forwardData = { ...data, clientId };
                            room.hostSocket.send(JSON.stringify(forwardData));
                        }
                    } else if (role === 'host') {
                        // Repassa para o Guest específico
                        const targetClientId = data.clientId;
                        if (targetClientId) {
                            const guestWs = room.guests.get(targetClientId);
                            if (guestWs && guestWs.readyState === ws.OPEN) {
                                guestWs.send(JSON.stringify(data));
                            }
                        }
                    }
                }
            } catch (err) {
                console.error('[Relay] Erro ao processar mensagem de texto:', err);
            }
            return;
        }

        // Mensagens binárias são dados de jogo (UDP encapsulado)
        if (!clientInfo) return;

        const { role, lobbyId, clientId } = clientInfo;
        const room = rooms.get(lobbyId);
        if (!room) return;

        if (role === 'guest') {
            // Encaminhar dados do Guest para o Host, incluindo o ID do Guest
            if (room.hostSocket && room.hostSocket.readyState === ws.OPEN) {
                const idBuffer = Buffer.from(clientId);
                const combined = Buffer.alloc(1 + idBuffer.length + message.length);
                combined.writeUInt8(idBuffer.length, 0);
                idBuffer.copy(combined, 1);
                message.copy(combined, 1 + idBuffer.length);
                
                room.hostSocket.send(combined, { binary: true });
            }
        } else if (role === 'host') {
            // Encaminhar dados do Host para o Guest específico
            // O Host envia no formato: [idLength (1B)] + [clientId] + [payload]
            if (message.length < 2) return;
            const idLength = message.readUInt8(0);
            if (message.length < 1 + idLength) return;

            const targetClientId = message.toString('utf8', 1, 1 + idLength);
            const payload = message.subarray(1 + idLength);

            const guestWs = room.guests.get(targetClientId);
            if (guestWs && guestWs.readyState === ws.OPEN) {
                guestWs.send(payload, { binary: true });
            }
        }
    });

    ws.on('close', () => {
        if (!clientInfo) return;
        const { role, lobbyId, clientId } = clientInfo;
        const room = rooms.get(lobbyId);
        if (!room) return;

        if (role === 'host') {
            console.log(`[Relay] Host desconectou do lobby ${lobbyId}. Fechando sala.`);
            // Notifica todos os guests e remove a sala
            for (const [gId, gWs] of room.guests.entries()) {
                if (gWs.readyState === ws.OPEN) {
                    gWs.send(JSON.stringify({ type: 'host_disconnected' }));
                }
            }
            rooms.delete(lobbyId);
        } else if (role === 'guest') {
            console.log(`[Relay] Guest ${clientId} desconectou do lobby ${lobbyId}.`);
            room.guests.delete(clientId);
            // Notifica o host
            if (room.hostSocket && room.hostSocket.readyState === ws.OPEN) {
                room.hostSocket.send(JSON.stringify({ type: 'guest_left', clientId }));
            }
        }
    });

    ws.on('error', (err) => {
        console.error('[Relay] Erro no socket:', err);
    });
});

console.log(`[Relay Server] Rodando na porta ${PORT}`);
