import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

const output = fs.createWriteStream('Koda_Final_Deploy.zip');
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => console.log('Zipped ' + archive.pointer() + ' total bytes'));
archive.on('error', (err) => { throw err; });

archive.pipe(output);

// Add backend
archive.directory('backend/', 'backend');

// Add frontend dist
archive.directory('frontend/dist/frontend/', 'dist');

// Add root package.json
const pkg = {
  name: "koda-production",
  version: "1.0.0",
  type: "module",
  dependencies: {
    "bcryptjs": "^3.0.3",
    "cors": "^2.8.6",
    "dotenv": "^17.4.2",
    "express": "^5.2.1",
    "jsonwebtoken": "^9.0.3",
    "mysql2": "^3.22.3"
  },
  scripts: {
    "start": "node dist/server/server.mjs"
  }
};
archive.append(JSON.stringify(pkg, null, 2), { name: 'package.json' });

// Add .env
archive.file('backend/.env', { name: '.env' });

archive.finalize();
