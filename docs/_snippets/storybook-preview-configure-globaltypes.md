```js filename=".storybook/preview.js" renderer="common" language="js"
const preview = {
  parameters: {
    toolbars: {
      //👇 The name of the global
      theme: {
        //👇 The label to show for this toolbar item
        title: 'Theme',
        description: 'Global theme for components',
      
        icon: 'circlehollow',
        // Array of plain string values or MenuItem shape (see below)
        items: ['light', 'dark'],
        // Change title based on selected value
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'light',
  },
};

export default preview;
```

```ts filename=".storybook/preview.ts" renderer="common" language="ts-4-9"
// Replace your-framework with the framework you are using (e.g., react, vue3)
import { Preview } from '@storybook/your-framework';

const preview: Preview = {
  parameters: {
    toolbars: {
      //👇 The name of the global
      theme: {
        //👇 The label to show for this toolbar item
        title: 'Theme',
        description: 'Global theme for components',

        // The label to show for this toolbar item
        icon: 'circlehollow',
        // Array of plain string values or MenuItem shape (see below)
        items: ['light', 'dark'],
        // Change title based on selected value
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'light',
  },
};

export default preview;
```

```ts filename=".storybook/preview.ts" renderer="common" language="ts"
// Replace your-framework with the framework you are using (e.g., react, vue3)
import { Preview } from '@storybook/your-framework';

const preview: Preview = {
  parameters: {
    toolbars: {
      //👇 The name of the global
      theme: {
        //👇 The label to show for this toolbar item
        title: 'Theme',
        description: 'Global theme for components',

        // The label to show for this toolbar item
        icon: 'circlehollow',
        // Array of plain string values or MenuItem shape (see below)
        items: ['light', 'dark'],
        // Change title based on selected value
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'light',
  },
};

export default preview;
```

