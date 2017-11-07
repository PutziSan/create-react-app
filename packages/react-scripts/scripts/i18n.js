'use strict';

// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = 'development';
process.env.NODE_ENV = 'development';

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', err => {
  throw err;
});

const glob = require('glob');
const bluebird = require('bluebird');
const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');

const paths = require('../config/paths');
const readReactIntlMessagesFromFile = require('./utils/readReactIntlMessagesFromFile');
const translationFiles = require('./utils/translationFiles');

const pGlob = bluebird.promisify(glob);
const pWriteFile = bluebird.promisify(fs.writeFile);
const pMkdirp = bluebird.promisify(mkdirp);

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

const isNil = val => val === undefined || val === null;
const optionIsDefaultTrue = val => isNil(val) || (val != 0 && val !== 'false');

const getLocales = () => {
  const localesString = getArgvValue(['--locales', '-l']);
  const locales = localesString ? localesString.split(',') : ['en'];
  return ['default', ...locales];
};

const getOutputPath = () => {
  const outputPath = getArgvValue(['-o', '--output', '--build-dir']);
  return outputPath
    ? path.join(paths.appPath, outputPath)
    : path.join(paths.appSrc, 'translations');
};

const makeFlatFile = () => optionIsDefaultTrue(getArgvValue('--flat'));
const makeFlatTree = () => optionIsDefaultTrue(getArgvValue('--flat-tree'));

const toMessageObject = (localeMessages, message) => ({
  [message.id]: localeMessages[message.id] || message.defaultMessage,
});

const toJson = obj => JSON.stringify(obj, null, 2);

const createNewLocaleMessages = (defaultMessages, locale) => localeMessages => {
  // recreate every time
  const checkedLocalMessages = locale === 'default' ? {} : localeMessages;
  const messagesReducer = (acc, cur) =>
    Object.assign(acc, toMessageObject(checkedLocalMessages, cur));

  return defaultMessages.reduce(messagesReducer, checkedLocalMessages);
};

const printFinished = () =>
  console.log('finished translations, they are stored in ' + getOutputPath());

const readDefaultMessagesForFileOnNonFlat = file => {
  const nonFlatOutputPath = translationFiles.getNonFlatOutputFileDir(
    getOutputPath(),
    file
  );
  const getOutputFilePath = locale =>
    translationFiles.getNonFlatOutputFilePath(getOutputPath(), locale, file);

  const getTranslationFile = defaultMessages => locale =>
    pMkdirp(nonFlatOutputPath)
      .then(() =>
        translationFiles.getNonFlatLocaleMessages(getOutputPath(), locale, file)
      )
      .then(createNewLocaleMessages(defaultMessages, locale))
      .then(messages =>
        pWriteFile(getOutputFilePath(locale), toJson(messages))
      );

  return readReactIntlMessagesFromFile(file).then(
    defaultMessages =>
      defaultMessages &&
      defaultMessages.length > 0 &&
      Promise.all(getLocales().map(getTranslationFile(defaultMessages)))
  );
};

const flatArray = arr => arr.reduce((acc, cur) => [...acc, ...cur], []);

const createNonFlatJsonTree = messages => {
  const res = {};
  const recursiveAssign = (key, val) => {
    let current = res;
    const keys = key.split('.');
    keys.pop();
    keys.forEach(key => {
      current[key] = current[key] || {};
      current = current[key];
    });
    current[key] = val;
  };

  Object.keys(messages).forEach(key => recursiveAssign(key, messages[key]));
  return res;
};

const writeFlatTranslationFileForLocale = defaultMessages => locale =>
  translationFiles
    .getFlatLocaleMessages(getOutputPath(), locale)
    .then(createNewLocaleMessages(defaultMessages, locale))
    .then(
      messages => (makeFlatTree() ? messages : createNonFlatJsonTree(messages))
    )
    .then(messages =>
      pWriteFile(
        translationFiles.getFlatOutputFilePath(getOutputPath(), locale),
        toJson(messages)
      )
    );

const handleFiles = files => {
  if (!makeFlatFile()) {
    return Promise.all(files.map(readDefaultMessagesForFileOnNonFlat));
  }

  return Promise.all(files.map(readReactIntlMessagesFromFile))
    .then(flatArray)
    .then(defaultMessages =>
      Promise.all(
        getLocales().map(writeFlatTranslationFileForLocale(defaultMessages))
      )
    );
};

pGlob(paths.appSrc + '/**/*.js')
  .then(handleFiles)
  .then(printFinished)
  .catch(err => {
    console.log('Failed to compile i18n-files.\n');
    console.log(err);
    console.log(err && err.message);
    process.exit(1);
  });
