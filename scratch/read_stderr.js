const { Client } = require('ssh2');
const conn = new Client();
const targetDir = 'domains/peachpuff-barracuda-735995.hostingersite.com/nodejs';

conn.on('ready', () => {
  conn.exec(`cat ${targetDir}/stderr.log`, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end())
          .on('data', (data) => console.log('STDOUT: ' + data))
          .stderr.on('data', (data) => console.log('STDERR: ' + data));
  });
}).connect({
  host: '145.79.20.74', port: 65002, username: 'u733420802', password: '20052910Oo_'
});
