const { Client } = require('ssh2');

const SSH_CONFIG = {
  host: '145.79.20.74',
  port: 65002,
  username: 'u733420802',
  password: '20052910Oo_'
};

function runSSH(conn, command, label) {
  return new Promise((resolve, reject) => {
    if (label) console.log(`\n🔧 ${label}`);
    conn.exec(command, (err, stream) => {
      if (err) { reject(err); return; }
      let out = '';
      stream.on('data', d => { out += d; process.stdout.write(d.toString()); });
      stream.stderr.on('data', d => process.stderr.write(d.toString()));
      stream.on('close', () => resolve(out));
    });
  });
}

async function main() {
  const conn = new Client();
  await new Promise((resolve, reject) => {
    conn.on('ready', resolve);
    conn.on('error', reject);
    conn.connect(SSH_CONFIG);
  });

  console.log('✅ SSH Connected!\n');

  // Check if Hostinger uses Phusion Passenger config files
  await runSSH(conn, 'find /home/u733420802 -name "*.json" -path "*/nodejs/*" 2>/dev/null | head -10', 'Looking for Node.js manager config files');
  await runSSH(conn, 'find /home/u733420802 -name "passenger*" -o -name "*.passenger" 2>/dev/null | head -10', 'Looking for Passenger config');
  await runSSH(conn, 'ls -la /home/u733420802/', 'Home directory listing');
  await runSSH(conn, 'ls -la /home/u733420802/etc/ 2>/dev/null || echo "No etc dir"', 'etc directory');
  await runSSH(conn, 'cat /home/u733420802/.bashrc | grep -i node 2>/dev/null || echo "No node in .bashrc"', 'Checking .bashrc for node config');
  
  // Try to find where Hostinger stores the node app configs
  await runSSH(conn, 'find / -name "nodeapp.json" 2>/dev/null | grep u733420802 | head -5', 'Looking for nodeapp.json');
  await runSSH(conn, 'find /home/u733420802 -name "app.js" -not -path "*/node_modules/*" 2>/dev/null | head -10', 'Looking for existing app.js');
  
  // Check the domain directory structure
  await runSSH(conn, 'ls -la /home/u733420802/domains/', 'Domains directory');
  await runSSH(conn, 'ls -la /home/u733420802/domains/peachpuff-barracuda-735995.hostingersite.com/', 'Site domain directory');

  conn.end();
}

main().catch(console.error);
