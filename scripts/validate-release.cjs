const fs = require('fs');
const path = require('path');

const app = require('../app.json').expo;
const pkg = require('../package.json');
const expected = {
  version: '0.4.2',
  versionCode: 14,
  package: 'br.com.alternativeventures.connexio',
  owner: 'henrriquenexa',
  projectId: 'cdcb129b-043c-4823-be6f-4e7dc0b7ddeb',
  icon: './assets/connexio-app-icon.png',
  adaptive: './assets/connexio-adaptive-foreground.png',
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(app.version === expected.version, `Versão Expo esperada ${expected.version}, encontrada ${app.version}`);
assert(pkg.version === expected.version, `Versão package.json esperada ${expected.version}, encontrada ${pkg.version}`);
assert(app.android?.versionCode === expected.versionCode, `Android versionCode esperado ${expected.versionCode}, encontrado ${app.android?.versionCode}`);
assert(app.android?.package === expected.package, `Android package inválido: ${app.android?.package}`);
assert(app.ios?.bundleIdentifier === expected.package, `iOS bundle inválido: ${app.ios?.bundleIdentifier}`);
assert(app.owner === expected.owner, `Owner Expo inválido: ${app.owner}`);
assert(app.extra?.eas?.projectId === expected.projectId, 'EAS projectId não corresponde ao Connexio oficial');
assert(app.icon === expected.icon, 'Ícone principal não corresponde ao asset oficial');
assert(app.android?.adaptiveIcon?.foregroundImage === expected.adaptive, 'Adaptive icon não corresponde ao asset oficial');
assert(app.newArchEnabled === false, 'Hotfix Android deve manter New Architecture desativada');

for (const file of [expected.icon, expected.adaptive]) {
  const absolute = path.resolve(__dirname, '..', file);
  assert(fs.existsSync(absolute) && fs.statSync(absolute).size > 1000, `Asset ausente: ${file}`);
}

console.log('Connexio release identity: PASS');
console.log(`Version: ${app.version}`);
console.log(`VersionCode: ${app.android.versionCode}`);
console.log(`Package: ${app.android.package}`);
console.log(`NewArch: ${app.newArchEnabled}`);
console.log(`EAS project: ${app.extra.eas.projectId}`);
