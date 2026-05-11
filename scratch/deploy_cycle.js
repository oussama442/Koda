const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const https = require('https');

const SSH_CONFIG = {
  host: '145.79.20.74',
  port: 65002,
  username: 'u733420802',
  password: '20052910Oo_'
};

const SITE_URL = 'http://peachpuff-barracuda-735995.hostingersite.com/api/health';
const APP_DIR = '/home/u733420802/koda';
const PUBLIC_DIR = '/home/u733420802/domains/peachpuff-barracuda-735995.hostingersite.com/public_html';

function runSSH(commands) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    const results = [];
    conn.on('ready', () => {
      const allCommands = Array.isArray(commands) ? commands.join(' && ') : commands;
      console.log(`\n🔧 Running: ${allCommands.substring(0, 100)}...`);
      conn.exec(allCommands, (err, stream) => {
        if (err) { conn.end(); reject(err); return; }
        let stdout = '', stderr = '';
        stream.on('data', d => { stdout += d; process.stdout.write(d.toString()); });
        stream.stderr.on('data', d => { stderr += d; process.stderr.write(d.toString()); });
        stream.on('close', (code) => {
          conn.end();
          resolve({ code, stdout, stderr });
        });
      });
    });
    conn.on('error', reject);
    conn.connect(SSH_CONFIG);
  });
}

function verifySite() {
  return new Promise((resolve) => {
    const http = require('http');
    const req = http.get(SITE_URL, (res) => {
      resolve({ ok: res.statusCode < 500, status: res.statusCode });
    });
    req.on('error', (e) => resolve({ ok: false, status: 0, error: e.message }));
    req.setTimeout(10000, () => { req.destroy(); resolve({ ok: false, status: 0, error: 'timeout' }); });
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function cycle(attempt) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔄 CYCLE ${attempt} — Starting deployment...`);
  console.log('='.repeat(60));

  try {
    // STEP 1: Clear everything and set up directory structure
    console.log('\n📁 STEP 1: Clearing server and creating directories...');
    await runSSH([
      `rm -rf ${APP_DIR}`,
      `mkdir -p ${APP_DIR}/dist`,
      `mkdir -p ${PUBLIC_DIR}`
    ]);

    // STEP 2: Create package.json directly on server
    console.log('\n📦 STEP 2: Writing package.json on server...');
    const pkg = JSON.stringify({
      name: "koda-erp",
      version: "1.0.0",
      type: "module",
      dependencies: {
        "bcryptjs": "^3.0.3",
        "cors": "^2.8.6",
        "dotenv": "^17.4.2",
        "express": "^5.2.1",
        "jsonwebtoken": "^9.0.3",
        "mysql2": "^3.22.3"
      }
    }, null, 2).replace(/"/g, '\\"');
    await runSSH(`echo "${pkg}" > ${APP_DIR}/package.json`);

    // STEP 3: Write .env on server
    console.log('\n🔐 STEP 3: Writing .env on server...');
    const envContent = [
      'DB_HOST=localhost',
      'DB_USER=u733420802_koda',
      'DB_PASSWORD=20052910Oo_',
      'DB_NAME=u733420802_koda_db',
      'JWT_SECRET=koda_super_secret_jwt_key_2024',
      'PORT=4000',
      'NODE_ENV=production'
    ].join('\\n');
    await runSSH(`printf "${envContent}" > ${APP_DIR}/.env`);

    // STEP 4: Upload backend files via heredoc/scp equivalent
    console.log('\n🚀 STEP 4: Uploading backend server.js...');
    const serverJsContent = fs.readFileSync(path.join(__dirname, '../backend/server.js'), 'utf8')
      .replace(/'/g, "'\\''");
    await runSSH(`cat > ${APP_DIR}/server.js << 'ENDOFFILE'\n${fs.readFileSync(path.join(__dirname, '../backend/server.js'), 'utf8')}\nENDOFFILE`);

    // STEP 5: Upload all backend files using tar pipe
    console.log('\n📂 STEP 5: Syncing all backend files...');
    await runSSH([
      `mkdir -p ${APP_DIR}/routes ${APP_DIR}/controllers ${APP_DIR}/config ${APP_DIR}/middleware`,
    ]);

    // Write each backend file
    const backendFiles = {
      'config/db.js': path.join(__dirname, '../backend/config/db.js'),
      'middleware/auth.js': path.join(__dirname, '../backend/middleware/auth.js'),
      'routes/authRoutes.js': path.join(__dirname, '../backend/routes/authRoutes.js'),
      'controllers/authController.js': path.join(__dirname, '../backend/controllers/authController.js'),
    };

    for (const [remotePath, localPath] of Object.entries(backendFiles)) {
      if (fs.existsSync(localPath)) {
        const content = fs.readFileSync(localPath, 'utf8');
        await runSSH(`cat > ${APP_DIR}/${remotePath} << 'KODA_EOF'\n${content}\nKODA_EOF`);
      }
    }

    // STEP 6: Install dependencies on server
    console.log('\n📦 STEP 6: Installing npm dependencies on server...');
    await runSSH(`cd ${APP_DIR} && /opt/alt/alt-nodejs22/root/usr/bin/npm install --production 2>&1`);

    // STEP 7: Copy frontend dist from previous upload or rebuild
    console.log('\n🌐 STEP 7: Copying pre-built frontend dist...');
    // The dist files should be there from before - check if they exist
    const distCheck = await runSSH(`ls ${APP_DIR}/dist/ 2>&1`);
    console.log('Dist contents:', distCheck.stdout);

    // STEP 8: Start the app
    console.log('\n▶️  STEP 8: Starting the application...');
    await runSSH([
      `pkill -u u733420802 -f "node.*server" 2>/dev/null || true`,
      `sleep 2`,
      `cd ${APP_DIR} && /opt/alt/alt-nodejs22/root/usr/bin/node server.js > ${APP_DIR}/app.log 2>&1 &`,
      `sleep 3`,
      `echo "PID: $!" > ${APP_DIR}/app.pid`
    ]);

    // STEP 9: Set up .htaccess proxy
    console.log('\n🔀 STEP 9: Setting up .htaccess reverse proxy...');
    const htaccess = `RewriteEngine On
RewriteCond %{HTTP:Upgrade} websocket [NC]
RewriteCond %{HTTP:Connection} upgrade [NC]
RewriteRule ^/?(.*) "ws://127.0.0.1:4000/$1" [P,L]
RewriteRule ^/?(.*) "http://127.0.0.1:4000/$1" [P,L]`;
    await runSSH(`cat > ${PUBLIC_DIR}/.htaccess << 'KODA_EOF'\n${htaccess}\nKODA_EOF`);

    // STEP 10: Check app log for startup errors
    console.log('\n📋 STEP 10: Checking application logs...');
    await sleep(5000);
    const logCheck = await runSSH(`cat ${APP_DIR}/app.log 2>&1 | head -50`);
    
    if (logCheck.stdout.includes('Error') || logCheck.stdout.includes('error')) {
      console.log('\n⚠️  Errors detected in logs. Analyzing...');
      console.log(logCheck.stdout);
    } else {
      console.log('\n✅ No errors in startup logs!');
    }

    // STEP 11: Verify the site is responding
    console.log('\n🌍 STEP 11: Verifying site is live...');
    await sleep(3000);
    const result = await verifySite();
    
    if (result.ok) {
      console.log(`\n🎉 SUCCESS! Site is live! Status: ${result.status}`);
      return true;
    } else {
      console.log(`\n❌ Site not responding. Status: ${result.status}, Error: ${result.error}`);
      console.log('\n📋 App log output:');
      await runSSH(`cat ${APP_DIR}/app.log 2>&1`);
      return false;
    }

  } catch (err) {
    console.error(`\n💥 Cycle ${attempt} failed with error:`, err.message);
    return false;
  }
}

async function main() {
  const MAX_CYCLES = 5;
  
  for (let i = 1; i <= MAX_CYCLES; i++) {
    const success = await cycle(i);
    if (success) {
      console.log(`\n🏆 DEPLOYMENT COMPLETE after ${i} cycle(s)!`);
      console.log(`🌐 Site is live at: http://peachpuff-barracuda-735995.hostingersite.com`);
      process.exit(0);
    }
    
    if (i < MAX_CYCLES) {
      console.log(`\n⏳ Waiting 10 seconds before cycle ${i + 1}...`);
      await sleep(10000);
    }
  }
  
  console.log('\n💔 All cycles exhausted. Manual inspection required.');
  process.exit(1);
}

main();
