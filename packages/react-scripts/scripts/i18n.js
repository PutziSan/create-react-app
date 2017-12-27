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
const babel = require('babel-core');
const translationsManager = require('react-intl-translations-manager');
const path = require('path');

const paths = require('../config/paths');
const createReactIntlBabelConfig = require('./utils/createReactIntlBabelConfig');
const argv = require('./utils/argv');
// Ensure environment variables are read.
require('../config/env');

const pWriteFile = bluebird.promisify(require('fs').writeFile);
const pRimraf = bluebird.promisify(require('rimraf'));
const pGlob = bluebird.promisify(glob);

const manageTranslations = translationsManager.default;

const toJson = obj => JSON.stringify(obj, null, 2);

const getMessagesOutputPath = () => {
  const outputPath = argv.getArgvValue(['--message-output']);
  return outputPath
    ? path.join(paths.appPath, outputPath)
    : path.join(paths.appPath, 'meta', 'messages');
};

const getTranslationsOutputPath = () => {
  const outputPath = argv.getArgvValue(['--translations-output']);
  return outputPath
    ? path.join(paths.appPath, outputPath)
    : path.join(paths.appSrc, 'translations');
};

const getLocales = () => {
  const localesString = argv.getArgvValue(['--locales', '-l', '--languages']);
  return localesString ? localesString.split(',') : ['en'];
};

const getDefaultLocale = () => {
  const defaultLocale = argv.getArgvValue(['--default-locale', '--default']);
  return defaultLocale || getLocales()[0];
};

const pTransformFile = bluebird.promisify(babel.transformFile);

const printFinished = () =>
  console.log(
    `finished, messages are extracted into ${getMessagesOutputPath()}, translations are updated in ${getTranslationsOutputPath()}`
  );

const babelifyWithExtract = file =>
  pTransformFile(file, createReactIntlBabelConfig(getMessagesOutputPath()));

const extractTranslations = () =>
  Promise.resolve()
    .then(() => pRimraf(getMessagesOutputPath())) // clear meta-messageDir
    .then(() =>
      manageTranslations({
        messagesDirectory: getMessagesOutputPath(),
        translationsDirectory: getTranslationsOutputPath(),
        languages: getLocales(),
      })
    );

const getDefaultMessages = () =>
  Promise.resolve()
    .then(() => getMessagesOutputPath())
    .then(translationsManager.readMessageFiles)
    .then(translationsManager.getDefaultMessages)
    .then(res => res.messages);

const extractDefaultMessages = () =>
  getDefaultMessages().then(messages =>
    translationsManager.createSingleMessagesFile({
      messages,
      directory: getTranslationsOutputPath(),
    })
  );

const getDefaultLocaleWhitelistFilePath = () =>
  path.join(
    getTranslationsOutputPath(),
    `whitelist_${getDefaultLocale()}.json`
  );

// this is necessary to prevent that every key markes as "untranslated"
const whiteListForDefaultLanguage = () =>
  getDefaultMessages()
    .then(messages => Object.keys(messages))
    .then(messageIds =>
      pWriteFile(getDefaultLocaleWhitelistFilePath(), toJson(messageIds))
    );

pGlob(paths.appSrc + '/**/*.js')
  .then(files => Promise.all(files.map(babelifyWithExtract)))
  .then(extractDefaultMessages)
  .then(whiteListForDefaultLanguage)
  .then(extractTranslations)
  .then(printFinished)
  .catch(err => {
    console.log('Failed to compile i18n-files.\n');
    console.log(err);
    console.log(err && err.message);
    process.exit(1);
  });
