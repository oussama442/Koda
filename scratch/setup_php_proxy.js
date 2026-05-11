const { Client } = require('ssh2');
const conn = new Client();
const targetDir = 'domains/peachpuff-barracuda-735995.hostingersite.com/public_html';

const phpProxy = `<?php
$host = '127.0.0.1';
$port = 4000;
$path = $_SERVER['REQUEST_URI'];

$url = "http://$host:$port$path";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $_SERVER['REQUEST_METHOD']);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    curl_setopt($ch, CURLOPT_POSTFIELDS, file_get_contents('php://input'));
}

$response = curl_exec($ch);
$header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$headers = substr($response, 0, $header_size);
$body = substr($response, $header_size);

$header_lines = explode("\r\n", $headers);
foreach ($header_lines as $line) {
    if ($line && !stripos($line, 'Transfer-Encoding')) {
        header($line);
    }
}

echo $body;
curl_close($ch);
`;

conn.on('ready', () => {
  conn.exec(`echo "${phpProxy}" > ${targetDir}/index.php && rm -f ${targetDir}/.htaccess`, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end());
  });
}).connect({
  host: '145.79.20.74', port: 65002, username: 'u733420802', password: '20052910Oo_'
});
