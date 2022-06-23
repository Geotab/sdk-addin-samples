/*eslint-disable*/
const fs = require('fs');
const archiver = require('archiver');
const path = require('path');
const config = require('./src/app/config.json');

const { name: appName } = config;
const output = fs.createWriteStream(`${appName}.zip`);
const archive = archiver('zip');

output.on('close', () => {
  console.log(`${archive.pointer()} total bytes`);
  console.log('archiver has been finalized and the output file descriptor has closed.');
});

archive.on('error', (err) => {
  throw err;
});

archive.pipe(output);

// append files from a sub-directory and naming it `new-subdir` within the archive
archive.directory(path.join(__dirname, 'dist'), appName);

archive.finalize();
