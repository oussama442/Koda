const { Client } = require('ssh2');
const conn = new Client();

const commands = [
  'ls -la /usr/local/bin/node',
  'ls -la /usr/bin/node',
  'ls -la ~/.nvm',
  'find ~ -maxdepth 3 -name node'
];

conn.on('ready', () => {
  let currentCommand = 0;
  function runNext() {
    if (currentCommand >= commands.length) { conn.end(); return; }
    const cmd = commands[currentCommand];
    console.log('Executing: ' + cmd);
    conn.exec(cmd, (err, stream) => {
      if (err) throw err;
      stream.on('close', () => { currentCommand++; runNext(); })
            .on('data', (data) => console.log('STDOUT: ' + data))
            .stderr.on('data', (data) => console.log('STDERR: ' + data));
    });
  }
  runNext();
}).connect({
  host: '145.79.20.74', port: 65002, username: 'u733420802', password: '20052910Oo_'
});
