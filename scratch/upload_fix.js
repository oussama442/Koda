const SftpClient = require('ssh2-sftp-client');
const sftp = new SftpClient();

async function upload() {
  try {
    await sftp.connect({
      host: '145.79.20.74', port: 65002, username: 'u733420802', password: '20052910Oo_'
    });
    await sftp.put('d:/Koda-test/backend/server.js', '/home/u733420802/koda/backend/server.js');
    console.log('Uploaded server.js');
    await sftp.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
}
upload();
