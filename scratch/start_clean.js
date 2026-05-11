const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  conn.exec('> koda/backend.log && export PATH=/opt/alt/alt-nodejs22/root/usr/bin:$PATH && cd koda/backend && nohup node server.js > ../backend.log 2>&1 &', (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end());
  });
}).connect({
  host: '145.79.20.74', port: 65002, username: 'u733420802', password: '20052910Oo_'
});
