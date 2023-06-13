const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

function zipDirectory(directoryPath, zipFilePath) {
  const output = fs.createWriteStream(zipFilePath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  output.on('close', () => {
    console.log('ZIP archive created successfully');
  });

  archive.on('error', (err) => {
    console.error('Failed to create ZIP archive:', err);
  });

  archive.pipe(output);
  archive.directory(directoryPath, false);
  archive.finalize();
}

if (process.argv.length <= 3) {
    console.error(`Usage: node archive.js dirpath outputpath.zip`);
    process.exit(1);
}

const directoryPath = process.argv[2]; // ZIP化したいディレクトリのパス
const zipFilePath = process.argv[3]; // 作成するZIPアーカイブのパス

zipDirectory(directoryPath, zipFilePath);
