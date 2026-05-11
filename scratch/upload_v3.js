const SftpClient = require('ssh2-sftp-client');
const sftp = new SftpClient();

async function upload() {
  try {
    await sftp.connect({
      host: '145.79.20.74',
      port: 65002,
      username: 'u733420802',
      password: '20052910Oo_'
    });
    console.log('Connected to SFTP');
    
    const remotePath = '/home/u733420802/deploy_v3.zip';
    await sftp.put('d:/Koda-test/deploy_v3.zip', remotePath);
    console.log('Uploaded deploy_v3.zip to ' + remotePath);
    
    await sftp.end();
  } catch (err) {
    console.error('Error during upload:', err.message);
    process.exit(1);
  }
}

upload();
