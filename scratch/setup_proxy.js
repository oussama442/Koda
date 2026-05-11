const { Client } = require('ssh2');
const conn = new Client();
const htaccess = `
RewriteEngine On
RewriteRule ^(.*)$ http://127.0.0.1:4000/$1 [P,L]
`;

conn.on('ready', () => {
  conn.exec(`echo "${htaccess}" > domains/peachpuff-barracuda-735995.hostingersite.com/public_html/.htaccess`, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end());
  });
}).connect({
  host: '145.79.20.74', port: 65002, username: 'u733420802', password: '20052910Oo_'
});
