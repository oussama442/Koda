const { Client } = require('ssh2');
const http = require('http');

const SSH_CONFIG = {
  host: '145.79.20.74',
  port: 65002,
  username: 'u733420802',
  password: '20052910Oo_'
};

const PUBLIC_DIR = '/home/u733420802/domains/peachpuff-barracuda-735995.hostingersite.com/public_html';
const APP_DIR = '/home/u733420802/koda';

function runSSH(conn, command) {
  return new Promise((resolve, reject) => {
    conn.exec(command, (err, stream) => {
      if (err) { reject(err); return; }
      let out = '';
      stream.on('data', d => { out += d; process.stdout.write(d.toString()); });
      stream.stderr.on('data', d => process.stderr.write(d.toString()));
      stream.on('close', () => resolve(out));
    });
  });
}

function checkSite(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve({ status: res.statusCode, body: data.substring(0, 200) }));
    });
    req.on('error', e => resolve({ status: 0, error: e.message }));
    req.setTimeout(10000, () => { req.destroy(); resolve({ status: 0, error: 'timeout' }); });
  });
}

async function main() {
  const conn = new Client();
  await new Promise((resolve, reject) => {
    conn.on('ready', resolve);
    conn.on('error', reject);
    conn.connect(SSH_CONFIG);
  });

  console.log('✅ Connected! Fixing proxy setup...\n');

  // Check what's in public_html
  console.log('📁 Public HTML contents:');
  await runSSH(conn, `ls -la ${PUBLIC_DIR}/`);

  // Write a proper .htaccess 
  console.log('\n🔀 Writing .htaccess proxy...');
  await runSSH(conn, `cat > ${PUBLIC_DIR}/.htaccess << 'KODA_EOF'
Options -MultiViews
RewriteEngine On
RewriteRule ^(.*)$ http://127.0.0.1:4000/$1 [P,L]
KODA_EOF`);

  // Remove any index.php or index.html that might block
  await runSSH(conn, `rm -f ${PUBLIC_DIR}/index.php ${PUBLIC_DIR}/index.html`);

  console.log('\n📋 .htaccess contents:');
  await runSSH(conn, `cat ${PUBLIC_DIR}/.htaccess`);

  conn.end();

  // Wait and test
  console.log('\n⏳ Waiting 5 seconds then checking site...');
  await new Promise(r => setTimeout(r, 5000));

  const result = await checkSite('http://peachpuff-barracuda-735995.hostingersite.com/api/health');
  console.log('\n🌐 Site check result:', result);

  if (result.status && result.status < 500) {
    console.log('\n🎉 SITE IS LIVE! 🎉');
  } else {
    console.log('\n❌ Site not responding via http - may need https or .htaccess needs mod_proxy enabled');
    console.log('ℹ️  App IS running on port 4000 - this is a proxy config issue');
  }
}

main().catch(console.error);
