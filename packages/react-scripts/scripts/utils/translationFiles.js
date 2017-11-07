'use strict';

const path = require('path');
const bluebird = require('bluebird');
const fs = require('fs');

const paths = require('../../config/paths');
const fileName = file => path.basename(file).replace(path.extname(file), '');

const pReadFile = bluebird.promisify(fs.readFile);

const isObject = obj => obj && typeof obj === 'object';
const recursiveFlatObj = obj => {
  const objReducer = (acc, currentKey) =>
    Object.assign(acc, recursiveFlatObj(obj[currentKey]));

  return Object.keys(obj)
    .filter(key => isObject(obj[key]))
    .reduce(objReducer, obj);
};

const initCachedReadFile = () => {
  const cache = {};
  const memoize = filePath => data => {
    cache[filePath] = data;
    return data;
  };

  return filePath =>
    cache[filePath] ||
    pReadFile(filePath, 'utf8')
      .then(JSON.parse)
      .then(recursiveFlatObj)
      .then(memoize(filePath));
};
const cachedReadFile = initCachedReadFile();

const getFlatOutputFilePath = (outputPath, locale) =>
  path.join(outputPath, locale + '.json');

const getNonFlatOutputFileDir = (outputPath, file) =>
  path.join(
    outputPath,
    path.relative(paths.appSrc, path.dirname(file)),
    fileName(file)
  );

const getNonFlatOutputFilePath = (outputPath, locale, file) =>
  path.join(getNonFlatOutputFileDir(outputPath, file), locale + '.json');

const getLocaleFilePath = (outputPath, flat, locale, file) =>
  flat
    ? getFlatOutputFilePath(outputPath, locale)
    : getNonFlatOutputFilePath(outputPath, locale, file);

const getFlatLocaleMessages = (outputPath, locale) =>
  Promise.resolve()
    .then(() => getFlatOutputFilePath(outputPath, locale))
    .then(cachedReadFile)
    .catch(() => ({}));

const getNonFlatLocaleMessages = (outputPath, locale, file) =>
  pReadFile(getNonFlatOutputFilePath(outputPath, locale, file))
    .then(JSON.parse)
    .catch(() => getFlatLocaleMessages(locale));

const getLocaleFile = (outputPath, flat, locale, file) =>
  flat
    ? getFlatLocaleMessages(outputPath, locale)
    : getNonFlatLocaleMessages(outputPath, locale, file);

module.exports = {
  getFlatOutputFilePath,
  getNonFlatOutputFilePath,
  getNonFlatOutputFileDir,
  getLocaleFilePath,
  getFlatLocaleMessages,
  getNonFlatLocaleMessages,
  getLocaleFile,
};
