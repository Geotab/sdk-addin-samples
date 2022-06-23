/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const config = require('./package.json');

const { name: appName } = config;
const fileToTransform = path.join(__dirname, 'dist', `${appName}.js`);
const imagePrefix = `../AddIns/${appName}/${appName}`;

const getImageNames = () => new Promise((res, rej) => {
  const directoryPath = path.join(__dirname, 'dist');
  console.log(`Reading the files from ${directoryPath}`);
  // passsing directoryPath and callback function
  fs.readdir(directoryPath, (err, files) => {
    // handling error
    if (err) {
      console.log(`Unable to scan directory: ${err}`);
      rej(err);
    }
    // listing all files using forEach
    const images = files.filter((file) => {
      const regex = /((\.jpe?g)|(\.png)|(\.gif))$/i;
      return regex.test(file);
    });

    res(images);
  });
});

const getFileData = () => new Promise((res, rej) => {
  fs.readFile(fileToTransform, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      rej(err);
    }

    res(data);
  });
});

const updateFileData = (rawData) => new Promise((res, rej) => {
  fs.writeFile(fileToTransform, rawData, 'utf8', (writeFileError) => {
    if (writeFileError) {
      console.error(writeFileError);
      rej(writeFileError);
    }

    console.log('The file has been saved!');
    res('The file has been saved!');
  });
});

const updateImageReferences = async () => {
  const imagesToBeFound = await getImageNames();
  console.log(`Images to be found: ${imagesToBeFound}`);

  let fileData = await getFileData();
  console.log('Extracted file data');

  console.log(`Updating image file references on ${fileToTransform}`);
  imagesToBeFound.forEach((image, index) => {
    const regex = new RegExp(image, 'g');
    fileData = fileData.replace(regex, `${imagePrefix}/${image}`);
    console.log(`Updated image reference #${index} ${image}`);
  });
  updateFileData(fileData);
};

// asyncCall();
updateImageReferences();
