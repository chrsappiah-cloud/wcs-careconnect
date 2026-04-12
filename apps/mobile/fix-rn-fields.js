const fs = require('fs');
const path = require('path');

const nmDir = path.join(__dirname, 'node_modules');

function getPkgDirs() {
  const dirs = [];
  for (const entry of fs.readdirSync(nmDir)) {
    const full = path.join(nmDir, entry);
    if (entry.startsWith('.')) continue;
    if (entry.startsWith('@')) {
      for (const sub of fs.readdirSync(full)) {
        dirs.push(path.join(full, sub));
      }
    } else {
      dirs.push(full);
    }
  }
  return dirs;
}

let fixed = 0;
for (const dir of getPkgDirs()) {
  const pkgPath = path.join(dir, 'package.json');
  if (!fs.existsSync(pkgPath)) continue;
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const rnField = pkg['react-native'];
    if (typeof rnField !== 'string' || !rnField.startsWith('src/')) continue;

    // Strategy 1: Strip file extension if present (e.g. "src/index.ts" -> "src/index")
    const stripped = rnField.replace(/\.(ts|tsx|js|jsx)$/, '');
    if (stripped !== rnField) {
      const srcDir = path.join(dir, path.dirname(stripped));
      const base = path.basename(stripped);
      const exts = ['.ts', '.tsx', '.js', '.jsx'];
      if (exts.some(ext => fs.existsSync(path.join(srcDir, base + ext)))) {
        pkg['react-native'] = stripped;
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
        console.log('FIXED ' + pkg.name + ': ' + rnField + ' -> ' + stripped + ' (stripped ext)');
        fixed++;
        continue;
      }
    }

    // Strategy 2: Check if src file can be resolved without changes
    const srcBase = path.join(dir, rnField);
    if (['.ts', '.tsx', '.js', '.jsx', ''].some(ext => fs.existsSync(srcBase + ext))) {
      continue; // Metro should handle this
    }

    // Strategy 3: Fall back to compiled output (prefer commonjs to avoid codegen Babel plugin
    // issues — ESM `export default codegenNativeComponent(...)` triggers @react-native/babel-plugin-codegen
    // which fails on compiled JS lacking TypeScript type annotations)
    const candidates = ['lib/commonjs/index', 'lib/commonjs/index.js', 'lib/module/index', 'lib/module/index.js', pkg.main, pkg.module];
    for (const c of candidates) {
      if (!c) continue;
      const fullPath = path.join(dir, c);
      if (fs.existsSync(fullPath) || fs.existsSync(fullPath + '.js')) {
        pkg['react-native'] = c;
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
        console.log('FIXED ' + pkg.name + ': ' + rnField + ' -> ' + c + ' (fallback)');
        fixed++;
        break;
      }
    }
  } catch (e) {
    // skip
  }
}
console.log('Fixed ' + fixed + ' packages total');
