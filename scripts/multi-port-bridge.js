/**
 * Multi-Port Bridge Script
 * 
 * Allows the application to be accessible on Port 80 by piping traffic 
 * to the specified target port (e.g., 5173 for dev, 4173 for preview).
 */

import net from 'net';

const sourcePort = parseInt(process.argv[2]) || 80;
const targetPort = parseInt(process.argv[3]) || 5173;

const server = net.createServer((socket) => {
    const target = net.connect(targetPort, '127.0.0.1');

    // Handle connection errors
    socket.on('error', (err) => {
        // console.error(`[Bridge] Web Socket/HTTP connection error on port ${sourcePort}:`, err.message);
        target.destroy();
    });

    target.on('error', (err) => {
        // console.error(`[Bridge] Target port ${targetPort} connection error:`, err.message);
        socket.destroy();
    });

    // Pipe data in both directions
    socket.pipe(target);
    target.pipe(socket);
});

server.on('error', (err) => {
    if (err.code === 'EACCES') {
        console.error(`\x1b[31m[Bridge] HATA: Port ${sourcePort} dinlenemedi. Yönetici (Admin) haklarıyla çalıştırmanız gerekebilir.\x1b[0m`);
    } else if (err.code === 'EADDRINUSE') {
        console.error(`\x1b[31m[Bridge] HATA: Port ${sourcePort} şu an başka bir uygulama tarafından kullanılıyor.\x1b[0m`);
    } else {
        console.error(`\x1b[31m[Bridge] Beklenmedik hata:\x1b[0m`, err);
    }
    process.exit(1);
});

server.listen(sourcePort, '0.0.0.0', () => {
    console.log(`\x1b[32m[Bridge] Aktif: http://localhost:${sourcePort} -> http://localhost:${targetPort}\x1b[0m`);
});
