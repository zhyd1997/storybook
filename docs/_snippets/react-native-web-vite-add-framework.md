```js filename=".storybook/main.js" renderer="react-native-web" language="js"
export default {
  addons: [
    // '@storybook/addon-react-native-web', 👈 Remove this
  ],
  // ...
  // framework: '@storybook/react-webpack5', 👈 Remove this
  framework: '@storybook/react-native-web-vite', // 👈 Add this
};
```

```ts filename=".storybook/main.ts" renderer="react-native-web" language="ts"
import { StorybookConfig } from '@storybook/react-native-web-vite';

const config: StorybookConfig = {
  addons: [
    // '@storybook/addon-react-native-web', 👈 Remove this
  ],
  // ...
  // framework: '@storybook/react-webpack5', 👈 Remove this
  framework: '@storybook/react-native-web-vite', // 👈 Add this
};

export default config;
```
