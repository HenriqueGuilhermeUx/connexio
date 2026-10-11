const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const appPath = path.join(root, 'app.json');
const assetsDir = path.join(root, 'assets');
const webIconPath = path.join(assetsDir, 'connexio-web-icon.png');
const webIconConfigPath = './assets/connexio-web-icon.png';

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) {
    c ^= byte;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function createSolidPng(width, height, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const row = Buffer.alloc(1 + width * 4);
  row[0] = 0;
  for (let x = 0; x < width; x++) {
    const offset = 1 + x * 4;
    row[offset] = rgba[0];
    row[offset + 1] = rgba[1];
    row[offset + 2] = rgba[2];
    row[offset + 3] = rgba[3];
  }
  const raw = Buffer.concat(Array.from({ length: height }, () => row));
  const idat = zlib.deflateSync(raw, { level: 9 });

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

fs.mkdirSync(assetsDir, { recursive: true });
fs.writeFileSync(webIconPath, createSolidPng(512, 512, [228, 182, 78, 255]));

const originalText = fs.readFileSync(appPath, 'utf8');
const config = JSON.parse(originalText);

config.expo.icon = webIconConfigPath;
config.expo.ios = { ...(config.expo.ios || {}), icon: webIconConfigPath };
config.expo.android = {
  ...(config.expo.android || {}),
  icon: webIconConfigPath,
  adaptiveIcon: {
    ...(config.expo.android?.adaptiveIcon || {}),
    foregroundImage: webIconConfigPath,
    monochromeImage: webIconConfigPath,
  },
};
config.expo.web = { ...(config.expo.web || {}), favicon: webIconConfigPath };

try {
  fs.writeFileSync(appPath, JSON.stringify(config, null, 2) + '\n');
  console.log('Configuração temporária de Web aplicada com PNG válido isolado.');
  const result = spawnSync('npx', ['expo', 'export', '--platform', 'web'], {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: process.env,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exitCode = result.status || 1;
} finally {
  fs.writeFileSync(appPath, originalText);
  console.log('app.json oficial restaurado após o build Web.');
}
