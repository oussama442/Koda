const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const SSH_CONFIG = {
  host: '145.79.20.74',
  port: 65002,
  username: 'u733420802',
  password: '20052910Oo_'
};

const APP_DIR = '/home/u733420802/koda';
const LOCAL_DIST = path.join(__dirname, '../frontend/dist/frontend');
const LOCAL_BACKEND = path.join(__dirname, '../backend');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Upload a file via SFTP
function uploadFile(sftp, localPath, remotePath) {
  return new Promise((resolve, reject) => {
    sftp.fastPut(localPath, remotePath, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// Create remote directory
function mkdirRemote(sftp, remotePath) {
  return new Promise((resolve) => {
    sftp.mkdir(remotePath, (err) => resolve()); // ignore errors (dir may exist)
  });
}

// Recursively upload a directory
async function uploadDir(sftp, localDir, remoteDir) {
  await mkdirRemote(sftp, remoteDir);
  const entries = fs.readdirSync(localDir, { withFileTypes: true });
  for (const entry of entries) {
    const localPath = path.join(localDir, entry.name);
    const remotePath = `${remoteDir}/${entry.name}`;
    if (entry.isDirectory()) {
      await uploadDir(sftp, localPath, remotePath);
    } else {
      try {
        await uploadFile(sftp, localPath, remotePath);
        process.stdout.write('.');
      } catch (e) {
        process.stdout.write('x');
      }
    }
  }
}

function runSSH(conn, command) {
  return new Promise((resolve, reject) => {
    conn.exec(command, (err, stream) => {
      if (err) { reject(err); return; }
      let out = '', errOut = '';
      stream.on('data', d => { out += d; process.stdout.write(d.toString()); });
      stream.stderr.on('data', d => { errOut += d; process.stderr.write(d.toString()); });
      stream.on('close', (code) => resolve({ code, out, errOut }));
    });
  });
}

async function main() {
  console.log('🚀 Starting SSH upload...\n');

  const conn = new Client();
  
  await new Promise((resolve, reject) => {
    conn.on('ready', resolve);
    conn.on('error', reject);
    conn.connect(SSH_CONFIG);
  });
  
  console.log('✅ SSH Connected!\n');

  // Step 1: Clear and create directories
  console.log('📁 Clearing old files and creating fresh directories...');
  await runSSH(conn, `rm -rf ${APP_DIR} && mkdir -p ${APP_DIR}/dist && mkdir -p ${APP_DIR}/routes && mkdir -p ${APP_DIR}/controllers && mkdir -p ${APP_DIR}/config && mkdir -p ${APP_DIR}/middleware`);
  console.log('\n✅ Directories created!\n');

  // Step 2: Upload via SFTP
  const sftp = await new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => {
      if (err) reject(err);
      else resolve(sftp);
    });
  });

  // Upload backend files
  console.log('📤 Uploading backend files...');
  await uploadDir(sftp, LOCAL_BACKEND, `${APP_DIR}/backend_src`);
  console.log('\n✅ Backend files uploaded!\n');

  // Upload frontend dist
  console.log('📤 Uploading frontend dist files...');
  await uploadDir(sftp, LOCAL_DIST, `${APP_DIR}/dist`);
  console.log('\n✅ Frontend dist uploaded!\n');

  // Step 3: Create the main server entry point
  console.log('📝 Creating main server entry point...');
  const mainServer = `
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: ['https://peachpuff-barracuda-735995.hostingersite.com', 'http://localhost:4200'],
  credentials: true
}));
app.use(express.json());

// Import backend routes
import('./backend_src/server.js').catch(() => {
  console.log('Backend routes will be handled by SSR server');
});

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Serve SSR app
import('./dist/server/server.mjs').then(({ app: ssrApp }) => {
  console.log('SSR app loaded successfully');
}).catch(err => {
  console.error('SSR load error:', err.message);
  app.use(express.static(join(__dirname, 'dist/browser')));
  app.get('*', (req, res) => res.sendFile(join(__dirname, 'dist/browser/index.html')));
});

app.listen(PORT, () => {
  console.log(\`Koda ERP running on port \${PORT}\`);
});
`;

  await runSSH(conn, `cat > ${APP_DIR}/server.js << 'KODA_EOF'
${mainServer}
KODA_EOF`);

  // Step 4: Write package.json
  const pkg = JSON.stringify({
    name: "koda-erp",
    version: "1.0.0",
    type: "module",
    main: "server.js",
    scripts: { start: "node server.js" },
    dependencies: {
      "bcryptjs": "^3.0.3",
      "cors": "^2.8.6",
      "dotenv": "^17.4.2",
      "express": "^5.2.1",
      "jsonwebtoken": "^9.0.3",
      "mysql2": "^3.22.3"
    }
  }, null, 2);
  
  await runSSH(conn, `cat > ${APP_DIR}/package.json << 'KODA_EOF'
${pkg}
KODA_EOF`);

  // Step 5: Write .env
  const envContent = `DB_HOST=localhost
DB_USER=u733420802_koda
DB_PASSWORD=20052910Oo_
DB_NAME=u733420802_koda_db
JWT_SECRET=koda_super_secret_jwt_key_2024
PORT=4000
NODE_ENV=production`;

  await runSSH(conn, `cat > ${APP_DIR}/.env << 'KODA_EOF'
${envContent}
KODA_EOF`);

  // Step 6: Install dependencies
  console.log('\n📦 Installing npm dependencies (this takes ~1 min)...');
  await runSSH(conn, `cd ${APP_DIR} && /opt/alt/alt-nodejs22/root/usr/bin/npm install --production 2>&1`);

  // Step 7: Kill old processes and start fresh
  console.log('\n▶️  Starting application...');
  await runSSH(conn, `pkill -u u733420802 -f "node" 2>/dev/null; sleep 2; echo "done"`);
  await runSSH(conn, `cd ${APP_DIR} && nohup /opt/alt/alt-nodejs22/root/usr/bin/node server.js > ${APP_DIR}/app.log 2>&1 & echo "Started PID=$!"`);
  
  await sleep(5000);
  
  // Step 8: Check logs
  console.log('\n📋 Checking startup logs...');
  await runSSH(conn, `cat ${APP_DIR}/app.log`);
  
  // Step 9: Set up .htaccess
  console.log('\n🔀 Setting up reverse proxy...');
  const PUBLIC_DIR = '/home/u733420802/domains/peachpuff-barracuda-735995.hostingersite.com/public_html';
  const htaccess = `RewriteEngine On
RewriteRule ^/?(.*) "http://127.0.0.1:4000/$1" [P,L]`;
  await runSSH(conn, `cat > ${PUBLIC_DIR}/.htaccess << 'KODA_EOF'
${htaccess}
KODA_EOF`);

  console.log('\n✅ All done! Checking site...');
  
  conn.end();
}

main().catch(console.error);
