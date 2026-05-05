const userSocketMap = {};

function getAllConnectedClients(io, roomId) {
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
        (socketId) => {
            return {
                socketId,
                username: userSocketMap[socketId],
            };
        }
    );
}

const socketHandler = (io) => {
    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        socket.on('JOIN', ({ roomId, username }) => {
            userSocketMap[socket.id] = username;
            socket.join(roomId);

            const clients = getAllConnectedClients(io, roomId);
            clients.forEach(({ socketId }) => {
                io.to(socketId).emit('JOINED', {
                    clients,
                    username,
                    socketId: socket.id,
                });
            });
        });

        socket.on('CODE_CHANGE', ({ roomId, code }) => {
            socket.in(roomId).emit('CODE_CHANGE', { code });
        });

        socket.on('LANGUAGE_CHANGE', ({ roomId, language }) => {
            socket.in(roomId).emit('LANGUAGE_CHANGE', { language });
        });

        socket.on('ACQUIRE_LOCK', ({ roomId, username }) => {
            socket.in(roomId).emit('LOCK_ACQUIRED', { username });
        });

        socket.on('RELEASE_LOCK', ({ roomId }) => {
            socket.in(roomId).emit('LOCK_RELEASED');
        });

        socket.on('SYNC_STATE', ({ socketId, code, language }) => {
            io.to(socketId).emit('SYNC_STATE', { code, language });
        });

        socket.on('SEND_MESSAGE', (messageData) => {
            socket.in(messageData.roomId).emit('RECEIVE_MESSAGE', {
                ...messageData,
                self: false,
            });
        });

        socket.on('EXECUTE_CODE', async ({ roomId, language, code, username, stdin }) => {
            console.log(`Execution requested for ${language} in room ${roomId} by ${username}`);
            
            // Notify everyone that code is running
            io.in(roomId).emit('CODE_RUNNING', { username });

            const languageMap = {
                javascript: 63, // Node.js 12.14.0
                python: 71,     // Python 3.8.1
                cpp: 54,        // C++ GCC 9.2.0
                java: 62,       // Java OpenJDK 13.0.1
            };

            const languageId = languageMap[language] || 63;

            try {
                const response = await fetch('https://ce.judge0.com/submissions?base64_encoded=false&wait=true', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        source_code: code,
                        language_id: languageId,
                        stdin: stdin || '',
                    }),
                });

                const data = await response.json();
                console.log(`Execution finished: ${data.status?.description}`);
                
                // Combine outputs for better visibility (NZEC usually has stderr)
                const finalOutput = data.stdout || data.stderr || data.compile_output || data.message || 'No output';
                
                io.in(roomId).emit('CODE_RESULT', {
                    output: finalOutput,
                    success: data.status?.id === 3,
                    status: data.status?.description,
                    time: data.time,
                    memory: data.memory,
                    username,
                });
            } catch (err) {
                console.error('Execution Error:', err);
                io.in(roomId).emit('CODE_RESULT', {
                    output: 'Server Error: API connection failed.',
                    success: false,
                    username,
                });
            }
        });

        socket.on('disconnecting', () => {
            const rooms = [...socket.rooms];
            rooms.forEach((roomId) => {
                socket.in(roomId).emit('DISCONNECTED', {
                    socketId: socket.id,
                    username: userSocketMap[socket.id],
                });
            });
            delete userSocketMap[socket.id];
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });
};

module.exports = socketHandler;
