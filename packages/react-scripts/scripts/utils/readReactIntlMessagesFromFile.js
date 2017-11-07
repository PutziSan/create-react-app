'use strict';

const babel = require('babel-core');
const bluebird = require('bluebird');

const pTransformFile = bluebird.promisify(babel.transformFile);

// set filename for a https://github.com/babel/babel/issues/6523 and b so that
// the auto-generating-tool sets the correct name
const getBabelTransformOptions = () => ({
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
  babelrc: false,
});

const readReactIntlMessagesFromFile = file =>
  pTransformFile(file, getBabelTransformOptions()).then(
    transformed => transformed.metadata['react-intl'].messages
  );

module.exports = readReactIntlMessagesFromFile;
