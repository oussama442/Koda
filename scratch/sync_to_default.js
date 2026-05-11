const { Client } = require('ssh2');
const conn = new Client();
const targetDir = 'domains/peachpuff-barracuda-735995.hostingersite.com/nodejs';

const commands = [
  `rm -rf ${targetDir}/*`,
  `cp -r koda/* ${targetDir}/`,
  `cd ${targetDir} && npm install --production` // Just in case
];

conn.on('ready', () => {
  let currentCommand = 0;
  function runNext() {
    if (currentCommand >= commands.length) { conn.end(); return; }
    conn.exec(commands[currentCommand], (err, stream) => {
      if (err) throw err;
      stream.on('close', () => { currentCommand++; runNext(); });
    });
  }
  runNext();
}).connect({
  host: '145.79.20.74', port: 65002, username: 'u733420802', password: '20052910Oo_'
});
