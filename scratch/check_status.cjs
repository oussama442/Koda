const { Client } = require('ssh2');

const SSH_CONFIG = {
  host: '145.79.20.74',
  port: 65002,
  username: 'u733420802',
  password: '20052910Oo_'
};

const conn = new Client();
conn.on('ready', () => {
  conn.exec('cat /home/u733420802/koda/app.log 2>&1; echo "---PROCESSES---"; ps aux | grep node | grep -v grep; echo "---NETSTAT---"; netstat -tlnp 2>/dev/null | grep 4000 || ss -tlnp | grep 4000', (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect(SSH_CONFIG);
