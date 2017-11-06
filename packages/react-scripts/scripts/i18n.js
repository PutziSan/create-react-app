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

const paths = require('../config/paths');
const glob = require('glob');
const bluebird = require('bluebird');
const babel = require('babel-core');
const fs = require('fs');

const pGlob = bluebird.promisify(glob);
const pReadFile = bluebird.promisify(fs.readFile);
const pWriteFile = bluebird.promisify(fs.writeFile);

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
  const localesString = getArgvValue(['--locales', '-l']);
  const locales = localesString ? localesString.split(',') : ['en'];
  return ['default', ...locales];
};

const getOutput = () => {
  const outputPath = getArgvValue(['-o', '--output', '--build-dir']);
  return outputPath
    ? paths.appPath + '/' + outputPath
    : paths.appSrc + '/translations';
};

// set filename for a https://github.com/babel/babel/issues/6523 and b so that the auto-generating-tool sets the correct name
const getBabelTransformOptions = file => ({
  presets: [
    {
      plugins: [
        [
          'react-intl-auto',
          {
            removePrefix: 'app/',
          },
        ],
        require.resolve('babel-plugin-react-intl'),
      ],
    },
    require.resolve('babel-preset-apoly-react-app'),
  ],
  filename: file,
  babelrc: false,
});

const babelify = file => code =>
  babel.transform(code, getBabelTransformOptions(file));

const readReactIntlMessagesFromFile = file =>
  pReadFile(file, 'utf8')
    .then(babelify(file))
    .then(transformed => transformed.metadata['react-intl'].messages);

const mergeArrays = messageArrays =>
  messageArrays.reduce((acc, messageArray) => [...acc, ...messageArray], []);

const getOutputFilePath = locale => getOutput() + '/' + locale + '.json';

const getLocaleMessages = locale =>
  pReadFile(getOutputFilePath(locale), 'utf8')
    .then(data => JSON.parse(data))
    .catch(() => ({}));

const toMessageObject = (localeMessages, message) => ({
  [message.id]: localeMessages[message.id] || message.defaultMessage,
});

const toJson = obj => JSON.stringify(obj, null, 2);

const createNewLocaleMessages = (defaultMessages, locale) => localeMessages => {
  if (locale === 'default') {
    // recreate the default-messages every time
    return defaultMessages.reduce(
      (acc, cur) => Object.assign(acc, toMessageObject(localeMessages, cur)),
      {}
    );
  }

  const res = localeMessages || {};

  defaultMessages.forEach(({ id, defaultMessage }) => {
    if (!res[id]) {
      res[id] = defaultMessage;
    }
  });

  return res;
};

const tapLog = p => {
  console.log(p);
  return p;
};

const mergeWithExistingMessagesForLocale = defaultMessages => locale =>
  getLocaleMessages(locale)
    .then(createNewLocaleMessages(defaultMessages, locale))
    .then(tapLog)
    .then(messageObject =>
      pWriteFile(getOutputFilePath(locale), toJson(messageObject))
    );

pGlob(paths.appSrc + '/**/*.js')
  .then(files => Promise.all(files.map(readReactIntlMessagesFromFile)))
  .then(mergeArrays)
  .then(defaultMessages =>
    Promise.all(
      getLocales().map(mergeWithExistingMessagesForLocale(defaultMessages))
    )
  )
  .then(() =>
    console.log('finished translations, they are stored in ' + getOutput())
  )
  .catch(err => {
    console.log('Failed to compile i18n-files.\n');
    console.log(err);
    console.log(err && err.message);
    process.exit(1);
  });
