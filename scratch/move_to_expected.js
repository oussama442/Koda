const { Client } = require('ssh2');
const conn = new Client();
const targetDir = 'Koda-test/backend';

const commands = [
  `mkdir -p ${targetDir}`,
  `rm -rf ${targetDir}/*`,
  `cp -rp koda/. ${targetDir}/`,
  `ls -la ${targetDir}/dist/frontend/server/server.mjs`
];

conn.on('ready', () => {
  let currentCommand = 0;
  function runNext() {
    if (currentCommand >= commands.length) { conn.end(); return; }
    conn.exec(commands[currentCommand], (err, stream) => {
      if (err) throw err;
      stream.on('close', () => { currentCommand++; runNext(); });
      stream.on('data', (data) => console.log('STDOUT: ' + data));
    });
  }
  runNext();
}).connect({
  host: '145.79.20.74', port: 65002, username: 'u733420802', password: '20052910Oo_'
});
