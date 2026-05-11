const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  conn.exec('mkdir -p koda/tmp && touch koda/tmp/restart.txt', (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end());
  });
}).connect({
  host: '145.79.20.74', port: 65002, username: 'u733420802', password: '20052910Oo_'
});
