'use strict';

// https://github.com/yahoo/babel-plugin-react-intl
// the babel-plugin-react-intl will extract the files
// defined as second preset, cause the other plugins must run BEFORE the babel-plugin
// see https://babeljs.io/docs/plugins/#plugin-preset-ordering for further information on babel-preset/plugin-ordering
const createReactIntlBabelConfig = outputPath => ({
  presets: [
    {
      plugins: [
        [
          require.resolve('babel-plugin-react-intl'),
          {
            messagesDir: outputPath,
          },
        ],
      ],
    },
    require.resolve('babel-preset-apoly-react-app'),
  ],
  babelrc: false,
});

module.exports = createReactIntlBabelConfig;
