/* eslint-disable no-console */
const titleStyle = 'background: #222; color: lime; font: bold 1.2em "Fira Sans", serif; padding: 0.2em';
const separatorStyle = 'background: #222; color: yellow; font: bold 1.2em "Fira Sans", serif; padding: 0.2em';
const messageStyle = 'background: #222; color: cyan; font: italic 1.2em "Fira Sans", serif; padding: 0.2em';

// const url = new URL(import.meta.url);
// const addinName = url.searchParams.get('appName') != null
// ? url.searchParams.get('appName') : 'ADDIN';

const logger = (addinName) => (
  {
    log: (message) => {
      if (typeof message !== 'object') {
        console.log(`%c${addinName}%c ~~~ %c${message}`, titleStyle, separatorStyle, messageStyle);
      } else {
        const separator = addinName.replaceAll(/./ig, '#');

        console.log(`%c### ${addinName} ###`, titleStyle);
        console.log('%c%o', messageStyle, message);
        console.log(`%c###${separator}####`, titleStyle);
      }
    },
    warn: (message) => {
      if (typeof message !== 'object') {
        console.warn(`%c${addinName}%c ~~~ %c${message}`, titleStyle, separatorStyle, messageStyle);
      } else {
        const separator = addinName.replaceAll(/./ig, '#');

        console.warn(`%c### ${addinName} ###`, titleStyle);
        console.warn('%c%o', messageStyle, message);
        console.warn(`%c###${separator}####`, titleStyle);
      }
    },
    error: (message) => {
      if (typeof message !== 'object') {
        console.error(`%c${addinName}%c ~~~ %c${message}`, titleStyle, separatorStyle, messageStyle);
      } else {
        const separator = addinName.replaceAll(/./ig, '#');

        console.error(`%c### ${addinName} ###`, titleStyle);
        console.error('%c%o', messageStyle, message);
        console.error(`%c###${separator}####`, titleStyle);
      }
    },
  }
);

export default logger;
