// Copyright (c) 2026 World Class Scholars, led by Dr Christopher Appiah-Thompson. All rights reserved.
const fs = require('fs');
const path = require('path');

// Packages that have src/ files and should use "src/index" instead of "lib/module/index"
const packagesWithSrc = [
  'react-native-safe-area-context',
  'react-native-screens',
  'react-native-gesture-handler',
  'react-native-mmkv',
  'react-native-webview',
  'lottie-react-native',
  'react-freeze',
  'react-native-reanimated-carousel',
  'react-native-keyboard-controller',
  'react-native-graph',
  'react-native-google-mobile-ads',
  'react-native-purchases-ui',
  'react-native-tree-multi-select',
  'moti',
];

for (const name of packagesWithSrc) {
  const pkgPath = path.join(__dirname, 'node_modules', name, 'package.json');
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const current = pkg['react-native'];

    // Check what the src entry should be
    const dir = path.join(__dirname, 'node_modules', name);
    const exts = ['.ts', '.tsx', '.js', '.jsx'];
    let srcEntry = null;
    for (const ext of exts) {
      if (fs.existsSync(path.join(dir, 'src', 'index' + ext))) {
        srcEntry = 'src/index';
        break;
      }
    }

    if (srcEntry && current !== srcEntry) {
      pkg['react-native'] = srcEntry;
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
      console.log('RESTORED ' + name + ': ' + current + ' -> ' + srcEntry);
    } else if (!srcEntry) {
      console.log('SKIP ' + name + ': no src/index found');
    } else {
      console.log('OK ' + name + ': already ' + current);
    }
  } catch (e) {
    console.log('ERROR ' + name + ': ' + e.message);
  }
}
