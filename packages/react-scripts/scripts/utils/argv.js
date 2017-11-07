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

module.exports = {
  getArgvValue,
  getArgvIndex,
};
