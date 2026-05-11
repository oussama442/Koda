const { Client } = require('ssh2');
const conn = new Client();

const NODE = '/opt/alt/alt-nodejs22/root/usr/bin/node';
const NPM = '/opt/alt/alt-nodejs22/root/usr/bin/npm';

const EXPORT_PATH = 'export PATH=/opt/alt/alt-nodejs22/root/usr/bin:$PATH';

const commands = [
  'mkdir -p koda',
  'unzip -o deploy_v3.zip -d koda',
  `${EXPORT_PATH} && cd koda/backend && node scripts/init_db.js`,
  `${EXPORT_PATH} && cd koda && npm install --production`,
  `${EXPORT_PATH} && cd koda/backend && nohup node server.js > ../backend.log 2>&1 &`
];

conn.on('ready', () => {
  console.log('Client :: ready');
  let currentCommand = 0;

  function runNext() {
    if (currentCommand >= commands.length) {
      console.log('All commands completed');
      conn.end();
      return;
    }

    const cmd = commands[currentCommand];
    console.log('Executing: ' + cmd);
    conn.exec(cmd, (err, stream) => {
      if (err) throw err;
      stream.on('close', (code) => {
        console.log('Command ' + currentCommand + ' exited with code ' + code);
        currentCommand++;
        runNext();
      }).on('data', (data) => {
        console.log('STDOUT: ' + data);
      }).stderr.on('data', (data) => {
        console.log('STDERR: ' + data);
      });
    });
  }

  runNext();
}).connect({
  host: '145.79.20.74',
  port: 65002,
  username: 'u733420802',
  password: '20052910Oo_'
});
