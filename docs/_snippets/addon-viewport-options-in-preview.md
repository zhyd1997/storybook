```js filename=".storybook/preview.js" renderer="common" language="js"
import { INITIAL_VIEWPORTS } from '@storybook/addon-viewport';

export default {
  parameters: {
    viewport: {
      viewports: INITIAL_VIEWPORTS,
    },
  },
  initialGlobals: {
    viewport: { value: 'ipad', isRotated: false },
  },
};
```

```ts filename=".storybook/preview.ts" renderer="common" language="ts"
// Replace your-framework with the framework you are using (e.g., react, vue3)
import { Preview } from '@storybook/your-framework';

const preview: Preview = {
  parameters: {
    viewport: {
      viewports: INITIAL_VIEWPORTS,
    },
  },
  initialGlobals: {
    viewport: { value: 'ipad', isRotated: false },
  },
};

export default preview;
```
