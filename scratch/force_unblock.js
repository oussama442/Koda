const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  // Kill anything that might be blocking port 80/443 interception
  conn.exec('pkill -u u733420802 node; pkill -u u733420802 passenger', (err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
        // Restart our processes
        conn.exec('cd koda && nohup node backend/server.js > backend.log 2>&1 & cd koda && nohup node dist/frontend/server/server.mjs > frontend.log 2>&1 &', (err2, stream2) => {
            if (err2) throw err2;
            stream2.on('close', () => conn.end());
        });
    });
  });
}).connect({
  host: '145.79.20.74', port: 65002, username: 'u733420802', password: '20052910Oo_'
});
