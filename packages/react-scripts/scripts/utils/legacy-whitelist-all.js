const path = require('path');
const translationsManager = require('react-intl-translations-manager');
const pWriteFile = require('bluebird').promisify(require('fs').writeFile);

const manageTranslations = translationsManager.default;

const languages = ['defaultMessages', 'en', 'de', 'tr', 'ru', 'ar-sy'];

const msgDir = path.join(__dirname, 'meta', 'messages');
const whitelistDir = path.join(__dirname, 'meta', 'whitelistDir');
const testTranslationDir = path.join(__dirname, 'test-translations');

const toWhitelistFilePath = language =>
  path.join(testTranslationDir, `whitelist_${language}.json`);

const getDefaultMessages = () =>
  Promise.resolve()
    .then(() => translationsManager.readMessageFiles(msgDir))
    .then(translationsManager.getDefaultMessages)
    .then(res => res.messages);

const whitelistAllKeys = () =>
  getDefaultMessages()
    .then(messages => Object.keys(messages))
    .then(JSON.stringify)
    .then(messageIdsJson =>
      Promise.all(
        languages.map(language =>
          pWriteFile(toWhitelistFilePath(language), messageIdsJson)
        )
      )
    );

whitelistAllKeys().then(() =>
  manageTranslations({
    messagesDirectory: msgDir,
    translationsDirectory: testTranslationDir,
    languages,
    overridePrinters: {
      printLanguageReport: report => console.log('nope'),
    },
  })
);
