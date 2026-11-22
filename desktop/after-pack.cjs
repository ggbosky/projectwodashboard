// Po zabalení vloží ikonu a popis do .exe (bez Wine, přes resedit).
const { execFileSync } = require('child_process');
const path = require('path');

exports.default = async (context) => {
  if (context.electronPlatformName !== 'win32') return;
  const exe = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.exe`);
  execFileSync(process.execPath, [path.join(__dirname, 'set-icon.mjs'), exe, path.join(__dirname, 'icon.ico'), context.packager.appInfo.version], { stdio: 'inherit' });
};
