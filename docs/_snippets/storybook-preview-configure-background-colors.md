```js filename=".storybook/preview.js" renderer="common" language="js"
export default {
  parameters: {
    backgrounds: {
      options: {
        dark: { name: 'Dark', value: '#333' },
        light: { name: 'Light', value: '#333' },
      },
    },
  },
};
```

```ts filename=".storybook/preview.ts" renderer="common" language="ts"
// Replace your-framework with the framework you are using (e.g., react, vue3)
import { Preview } from '@storybook/your-framework';

const preview: Preview = {
  parameters: {
    backgrounds: {
      options: {
        dark: { name: 'Dark', value: '#333' },
        light: { name: 'Light', value: '#333' },
      },
    },
  },
};

export default preview;
```

