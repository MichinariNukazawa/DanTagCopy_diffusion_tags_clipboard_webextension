const fs = require('fs-extra');
const path = require('path');
const chokidar = require('chokidar');

const srcDir = path.join(__dirname, '..', 'src');
const distDirFirefox = path.join(__dirname, '..', 'dist.firefox');
const distDirChrome = path.join(__dirname, '..', 'dist.chrome');

const { execFile } = require('child_process');

function runNpmCommand(target) {
  execFile('npm', ['run', target], (error, stdout, stderr) => {
    if (error) {
      console.error('Error running Browserify:', error);
    } else {
      console.log('Browserify completed');
    }
  });
}

// ファイルの変更を監視して自動的に再ビルドする関数
// memo: ubuntu ` sudo sysctl fs.inotify.max_user_watches=102400 `
function watchFiles() {
  const watcher = chokidar.watch(srcDir, { persistent: true });
  watcher.on('all', (event, filePath) => {
    console.log(`File ${event}: ${filePath}`);
    build();
  });
}

// Firefox向けのビルド
async function buildFirefox() {
  try {
    await fs.emptyDir(distDirFirefox);
    await fs.copy(path.join(srcDir, 'icons/icon128.png'), path.join(distDirFirefox, 'icons/icon128.png'));
    await fs.copy(path.join(srcDir, 'content.js'), path.join(distDirFirefox, 'content.js'));
    await fs.copy(path.join(srcDir, 'popup/popup_menu.html'), path.join(distDirFirefox, 'popup/popup_menu.html'));
    await fs.copy(path.join(srcDir, 'popup/popup_menu.js'), path.join(distDirFirefox, 'popup/popup_menu.js'));
    await fs.copy(path.join(srcDir, 'popup/style.css'), path.join(distDirFirefox, 'popup/style.css'));
    await fs.copy(path.join(srcDir, 'manifest.firefox.json'), path.join(distDirFirefox, 'manifest.json'));
    console.log('Firefox build completed');
    runNpmCommand('browserify:event');
  } catch (err) {
    console.error('Error copying files:', err);
  }
}

// Chrome向けのビルド
async function buildChrome() {
  try {
    await fs.emptyDir(distDirChrome);
    await fs.copy(path.join(srcDir, 'icons/icon128.png'), path.join(distDirChrome, 'icons/icon128.png'));
    await fs.copy(path.join(srcDir, 'content.js'), path.join(distDirChrome, 'content.js'));
    await fs.copy(path.join(srcDir, 'popup/popup_menu.html'), path.join(distDirChrome, 'popup/popup_menu.html'));
    await fs.copy(path.join(srcDir, 'popup/popup_menu.js'), path.join(distDirChrome, 'popup/popup_menu.js'));
    await fs.copy(path.join(srcDir, 'popup/style.css'), path.join(distDirChrome, 'popup/style.css'));
    await fs.copy(path.join(srcDir, 'manifest.chrome.json'), path.join(distDirChrome, 'manifest.json'));
    console.log('Chrome build completed');
    runNpmCommand('browserify:event');
  } catch (err) {
    console.error('Error copying files:', err);
  }
}

// メインのビルド関数
async function build() {
  try {
    // Firefox向けのビルドを実行
    await buildFirefox();
    // Chrome向けのビルドを実行
    await buildChrome();
  } catch (err) {
    console.error('Error building extensions:', err);
  }
}

// ビルドを実行
build();

if (process.argv.length > 2){
  if('--watch' !== process.argv[2]) {
    console.error(`Usage: node build.js --watch`);
    process.exit(1);
  }
  // ファイルの変更を監視して自動的に再ビルド
  watchFiles();
}
