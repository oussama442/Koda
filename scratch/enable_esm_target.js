const { Client } = require('ssh2');
const conn = new Client();
const targetDir = 'Koda-test/backend';

conn.on('ready', () => {
  conn.exec(`sed -i 's/"private": true,/"type": "module", "private": true,/' ${targetDir}/package.json`, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end());
  });
}).connect({
  host: '145.79.20.74', port: 65002, username: 'u733420802', password: '20052910Oo_'
});
