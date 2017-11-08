# react-scripts

This package includes scripts and configuration used by [Create React App](https://github.com/facebookincubator/create-react-app).<br>
Please refer to its documentation:

* [Getting Started](https://github.com/facebookincubator/create-react-app/blob/master/README.md#getting-started) – How to create a new app.
* [User Guide](https://github.com/facebookincubator/create-react-app/blob/master/packages/react-scripts/template/README.md) – How to develop apps bootstrapped with Create React App.

# Apoly-customization
This fork enables you to use i18n via [react-intl](https://github.com/yahoo/react-intl) effective with CRA.

To use it wit CRA you have to run
```
create-react-app my-app --scripts-version apoly-react-scripts
``` 

## github-repo
you can find the code in the [apoly-customization-tree of the CRA-fork](https://github.com/PutziSan/create-react-app/tree/apoly-customizations).

## I18n-Workflow
1. in your `package.json` adjust the `"i18n"`-script in the `"scripts"`-part to setup your default-locale and your locales (comma-seperated)
2. run `yarn i18n` to setup your empty translation-files for every locale and [bootstrap your app](#getting-started)
3. write your app, define all messages via `defineMessages` from react-intl
4. run `yarn i18n`, per default this script will extract all your messages in the /meta/messages-dir and maintain your translations in /src/translations, you can always rerun `yarn i18n`, it will not overwrite your existing translations in /src/translations
5. (optional) maintain your translations with e.g. [lokalise](https://lokalise.co/), see infos at the end

## coding with i18n
### write messages
You have to define all your messages external with [`defineMessages`](https://github.com/yahoo/react-intl/wiki/API#definemessages).
But you can use the shorthand notation (see https://github.com/akameco/babel-plugin-react-intl-auto):
```js
const messages = defineMessages({
  welcome: 'Welcome!',
  nameQuestion: 'Your name is {name}?',
});
```
Note: You should not rename the keys later cause this will break existing translations
### use messages
1. You can use the [`<FormattedMessage>`-component](https://github.com/yahoo/react-intl/wiki/Components#formattedmessage) from react-intl like this:
    ```js
    <FormattedMessage {...messages.welcome} />
    ```
   for a more convenient use u could add an helper-component:
   ```js
   const I18nMessage = ({ message, tagName, values }) => (
     <FormattedMessage {...message} values={values} tagName={tagName} />
   );
   ```
   and then use it like so:
   ```js
   <I18nMessage message={messages.welcome}/>
   ```
2. If you need to compute the value, you can use the [`injectIntl`-HOC](https://github.com/yahoo/react-intl/wiki/API#injection-api), this exposes the `intl`-prop to your Component. You can then use the `intl.formatMessage`-method within your enhanced component:
   ```js
   const Component = ({ intl }) => (
     <div>{intl.formatMessage(messages.welcome)}</div>
   );
   export default injectIntl(Component);
   ```

## <a name="getting-started"></a>getting started
### bootstrap the app
You have to wrap your whole App with one [`<IntlProvider>`-Component](https://github.com/yahoo/react-intl/wiki/Components#intlprovider).
The Component should get the current locale and the messages from your generated JSON-files, if you really want to or have to cause your app is too big, you could further split your messages, [look at this example](https://github.com/yahoo/react-intl/tree/master/examples/nested).

Additionaly you should call  [`addLocaleData`](https://github.com/yahoo/react-intl/wiki/API#addlocaledata) with [the specific localeData](https://github.com/yahoo/react-intl/wiki#loading-locale-data).
```js
import { IntlProvider, addLocaleData } from 'react-intl';
import enLocaleData from 'react-intl/locale-data/en';

import enMessages from '../../../translations/en.json';

addLocaleData(enLocaleData);

const En = ({ children }) => (
  <IntlProvider locale="en" messages={enMessages}>
    {children}
  </IntlProvider>
);
```
### handle different languages
you have to store the currently selected language (via redux, internal state, ...) and set the messages and the locale data dependent on the current locale: 
below is an async-example with [react-lodable](https://github.com/thejameskyle/react-loadable):
```js
import React from 'react';
import Loadable from 'react-loadable';

const EnLoadable = Loadable({
  loader: () => import('./En'),
});
const DeLoadable = Loadable({
  loader: () => import('./De'),
});

const localeLoadableMap = {
  'de': DeLoadable,
  'en': EnLoadable,
};
// set EnLoadable as fallback
const getAsyncLanguageLoadable = locale => localeLoadableMap[locale] || EnLoadable;

class AsyncLanguageLoadable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      locale: window.navigator.language,
    }
  }

  render() {
    const Component = getAsyncLanguageLoadable(this.state.locale);
    return <Component {...this.props} />;
  }
}
```
## advanced : manage with lokalise
[lokalise](https://lokalise.co/) gives you the ability to maintain your translations, [they have a free personal plan to start](https://lokalise.co/pricing).
You can upload the generated `defaultMessages.json` which lays per default in `src/translations/` after you run the `yarn i18n`-command.
Then you can manage your translations and use their service and at the end download the json-files with the translations and overwrite them in your project in `src/translations/`.
### automate with CLI and API
You could use their [CLI-tool](https://docs.lokalise.co/article/44l4f1hiZM-lokalise-cli-tool) to automate the import/export process.
If you want to integrate the jobs as git-hook or in you CI-integration, you could also use [the lokalise-API](https://lokalise.co/apidocs#export) and import the data to lokalise with every push and download the data with every build.