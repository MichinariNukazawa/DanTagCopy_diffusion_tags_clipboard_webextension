const fs = require('fs-extra');
const path = require('path');
const chokidar = require('chokidar');

const srcDir = path.join(__dirname, '..', 'src');
const distDirFirefox = path.join(__dirname, '..', 'dist.firefox');
const distDirChrome = path.join(__dirname, '..', 'dist.chrome');

const { exec } = require('child_process');

function runNpmCommand(target) {
  exec(`npm run ${target}`, (error, stdout, stderr) => {
    if (error) {
      console.error('Error running Browserify:', error);
    } else {
      console.log('Browserify completed');
    }
  });
}

// srcディレクトリの内容をdistディレクトリにコピーする関数
async function copyFiles(srcDir, distDir) {
  try {
    await fs.emptyDir(distDir);
    const files = [
      'icons/icon128.png',
      'content.js',
      'popup/popup_menu.html', 'popup/popup_menu.js', 'popup/style.css',
    ];
    for(const file of files){
      await fs.copy(path.join(srcDir, file), path.join(distDir, file));
    }
    console.log(`Files copied to ${distDir}`);
    runNpmCommand('browserify:event');
  } catch (err) {
    console.error('Error copying files:', err);
  }
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
  await copyFiles(srcDir, distDirFirefox);
  // Firefox向けの特定の処理を行う場合は、ここに追加の処理を記述する
  await fs.copy(path.join(srcDir, 'manifest.firefox.json'), path.join(distDirFirefox, 'manifest.json'));
  console.log('Firefox build completed');
}

// Chrome向けのビルド
async function buildChrome() {
  await copyFiles(srcDir, distDirChrome);
  // Chrome向けの特定の処理を行う場合は、ここに追加の処理を記述する
  await fs.copy(path.join(srcDir, 'manifest.chrome.json'), path.join(distDirChrome, 'manifest.json'));
  console.log('Chrome build completed');
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
