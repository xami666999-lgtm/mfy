const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Running post-install setup...');

try {
  // Rebuild native modules for Electron
  console.log('📦 Rebuilding native modules...');
  execSync('npm rebuild --runtime=electron --target=28.0.0 --disturl=https://electronjs.org/headers', {
    stdio: 'inherit',
    cwd: __dirname + '/..'
  });

  // Create necessary directories
  const dirs = [
    'build',
    'build/velo',
    'src/resources',
    'plugins'
  ];

  dirs.forEach(dir => {
    const fullPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });

  // Create placeholder icon if missing
  const iconPath = path.join(__dirname, '..', 'build', 'icon.ico');
  if (!fs.existsSync(iconPath)) {
    console.log('⚠️  No icon.ico found in build/. Please add your application icon.');
  }

  // Create placeholder installer.nsh if missing
  const nshPath = path.join(__dirname, '..', 'build', 'installer.nsh');
  if (!fs.existsSync(nshPath)) {
    const nshContent = `; Custom NSIS installer script for Hydra++
; Add custom installation logic here

!macro customInstall
  ; Custom install steps
!macroend

!macro customUnInstall
  ; Custom uninstall steps
!macroend
`;
    fs.writeFileSync(nshPath, nshContent);
    console.log('📝 Created placeholder installer.nsh');
  }

  // Create Velopack configuration
  const veloDir = path.join(__dirname, '..', 'build', 'velo');
  if (!fs.existsSync(veloDir)) {
    fs.mkdirSync(veloDir, { recursive: true });
  }

  const veloConfig = {
    name: "Hydra++",
    description: "Unified Game Launcher",
    author: "Hydra++ Team",
    version: "1.0.0",
    iconUrl: "https://raw.githubusercontent.com/hydraplus/hydra-plus/main/build/icon.ico",
    projectUrl: "https://github.com/hydraplus/hydra-plus",
    feedUrl: "https://github.com/hydraplus/hydra-plus/releases",
    loadingGifUrl: "https://raw.githubusercontent.com/hydraplus/hydra-plus/main/build/loading.gif"
  };

  fs.writeFileSync(
    path.join(veloDir, 'config.json'),
    JSON.stringify(veloConfig, null, 2)
  );
  console.log('📝 Created Velopack config');

  console.log('✅ Post-install setup complete!');
  console.log('');
  console.log('Next steps:');
  console.log('  1. Add icon.ico to build/');
  console.log('  2. Run "npm run dev" to start development');
  console.log('  3. Run "npm run build" to build for production');
  console.log('  4. Run "npm run package:win" to create Windows installer');

} catch (error) {
  console.error('❌ Post-install failed:', error.message);
  process.exit(1);
}