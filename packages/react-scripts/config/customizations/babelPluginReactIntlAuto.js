// from https://github.com/akameco/babel-plugin-react-intl-auto
'use strict';

const getWebpackBabelReactIntlPluginDefinition = () => {
  return [
    require.resolve('babel-plugin-react-intl-auto'),
    {
      removePrefix: 'src'
    }
  ]
};

module.exports = getWebpackBabelReactIntlPluginDefinition;
