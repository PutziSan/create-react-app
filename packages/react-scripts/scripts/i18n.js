'use strict';
// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', err => {
  throw err;
});

const extractReactIntlMessages = require('extract-react-intl-messages');
const paths = require('../config/paths');

// Ensure environment variables are read.
require('../config/env');

const getArgvIndex = options => {
  const optionArray = Array.isArray(options) ? options : [options];
  const res = optionArray
    .map(option => process.argv.indexOf(option))
    .filter(index => index >= 0);
  return options.length ? res[0] : -1;
};

const getArgvValue = options => {
  const index = getArgvIndex(options);
  return index >= 0 ? process.argv[index + 1] : null;
};

const getLocales = () => {
  const locales = getArgvValue(['--locales', '-l']);
  return locales ? locales.split(',') : ['en'];
};

const getOutput = () => {
  const outputPath = getArgvValue(['-o', '--output', '--build-dir']);
  return outputPath
    ? paths.appPath + '/' + outputPath
    : paths.appSrc + '/translations';
};

const getOptions = () => {
  const cliOptionsMap = {
    '--flat': 'flat',
    '--default-locale': 'defaultLocale',
    '--format': 'format',
    '-f': 'format',
  };

  let options = {};
  Object.keys(cliOptionsMap).forEach(cliOption => {
    const cliVal = getArgvValue(cliOption);
    if (cliVal) {
      const optionKey = cliOptionsMap[cliOption];
      options[optionKey] = cliVal;
    }
  });

  return options;
};

const pattern = paths.appSrc + '/**/*.js';

extractReactIntlMessages(getLocales(), pattern, getOutput(), getOptions())
  .then(() => {
    console.log('finished translations, they are stored in ' + getOutput());
  })
  .catch(err => {
    console.log('Failed to compile i18n-files.\n');
    console.log(err);
    console.log(err && err.message);
    process.exit(1);
  });
