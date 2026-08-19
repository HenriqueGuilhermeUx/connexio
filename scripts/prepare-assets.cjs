const fs = require('fs');
const path = require('path');
const https = require('https');

const root = path.resolve(__dirname, '..');
const assets = path.join(root, 'assets');
const sourceBase = 'https://raw.githubusercontent.com/HenriqueGuilhermeUx/connexio/agent/supabase-foundation/assets';
const files = [
  ['connexio-app-icon.base64', 'connexio-app-icon.png'],
  ['connexio-adaptive-foreground.base64', 'connexio-adaptive-foreground.png'],
];

fs.mkdirSync(assets, { recursive: true });

function download(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        response.resume();
        download(response.headers.location).then(resolve, reject);
        return;
      }
      if (response.statusCode !== 200) {
        reject(new Error(`Falha ao obter asset oficial: HTTP ${response.statusCode}`));
        response.resume();
        return;
      }
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      response.on('error', reject);
    }).on('error', reject);
  });
}

(async () => {
  for (const [encodedName, outputName] of files) {
    const encodedPath = path.join(assets, encodedName);
    const outputPath = path.join(assets, outputName);
    let encoded;
    if (fs.existsSync(encodedPath)) {
      encoded = fs.readFileSync(encodedPath, 'utf8');
    } else {
      encoded = await download(`${sourceBase}/${encodedName}`);
    }
    const png = Buffer.from(encoded.replace(/\s+/g, ''), 'base64');
    if (png.length < 1000 || png.subarray(1, 4).toString('ascii') !== 'PNG') {
      throw new Error(`Asset oficial inválido: ${outputName}`);
    }
    fs.writeFileSync(outputPath, png);
    console.log(`Asset preparado: ${outputName} (${png.length} bytes)`);
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
