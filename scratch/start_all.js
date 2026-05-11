const { Client } = require('ssh2');
const conn = new Client();
const EXPORT_PATH = 'export PATH=/opt/alt/alt-nodejs22/root/usr/bin:$PATH';

const commands = [
  'pkill -u u733420802 node || true',
  `${EXPORT_PATH} && cd koda/backend && nohup node server.js > ../backend.log 2>&1 &`,
  `${EXPORT_PATH} && cd koda && nohup node dist/frontend/server/server.mjs > ../frontend.log 2>&1 &`
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
