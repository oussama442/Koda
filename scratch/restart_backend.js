const { Client } = require('ssh2');
const conn = new Client();

const commands = [
  'pkill -u u733420802 node || true', // Kill existing node processes to be safe
  'export PATH=/opt/alt/alt-nodejs22/root/usr/bin:$PATH && cd koda/backend && nohup node server.js > ../backend.log 2>&1 &'
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
