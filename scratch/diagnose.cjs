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

  // Diagnose the environment
  await runSSH(conn, 'echo "=== Apache modules ===" && apache2ctl -M 2>/dev/null | grep -i proxy || echo "Cannot check apache modules"', 'Checking Apache proxy modules');
  await runSSH(conn, 'echo "=== Node process ===" && ps aux | grep node | grep -v grep', 'Checking Node process');
  await runSSH(conn, 'echo "=== Port 4000 check ===" && curl -s http://127.0.0.1:4000/api/health 2>&1 | head -20', 'Testing port 4000 locally on server');
  await runSSH(conn, 'echo "=== Hostinger passenger config ===" && ls /etc/apache2/sites-enabled/ 2>/dev/null || ls /etc/httpd/conf.d/ 2>/dev/null || echo "No apache config found"', 'Checking Apache config');
  await runSSH(conn, 'echo "=== Check .htaccess ===" && cat /home/u733420802/domains/peachpuff-barracuda-735995.hostingersite.com/public_html/.htaccess 2>/dev/null || echo "No .htaccess"', 'Reading .htaccess');
  await runSSH(conn, 'echo "=== Check error log ===" && tail -20 /var/log/apache2/error.log 2>/dev/null || tail -20 ~/logs/error.log 2>/dev/null || find ~ -name "*.log" -newer ~/koda/package.json 2>/dev/null | head -5', 'Checking error logs');
  await runSSH(conn, 'echo "=== Env variables ===" && env | grep -i passenger 2>/dev/null; env | grep -i phusion 2>/dev/null', 'Checking Passenger env');
  await runSSH(conn, 'echo "=== Node.js App Manager hints ===" && ls ~/etc/ 2>/dev/null; ls ~/.cpanel 2>/dev/null; ls ~/passenger* 2>/dev/null || echo "No cpanel/passenger files found"', 'Checking Node.js manager files');

  conn.end();
}

main().catch(console.error);
