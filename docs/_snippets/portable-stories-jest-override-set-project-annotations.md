```tsx filename="setupTest.ts" renderer="react" language="ts"
import { beforeAll } from '@jest/globals';
import { render as testingLibraryRender } from '@testing-library/react';
import { setProjectAnnotations } from '@storybook/react';
import * as addonAnnotations from 'my-addon/preview';
import * as previewAnnotations from './.storybook/preview';

const annotations = setProjectAnnotations([
  previewAnnotations,
  addonAnnotations,
  // Attention: Passing the render function from testing library is required if you mount stories in play functions
  { testingLibraryRender },
]);

// Supports beforeAll hook from Storybook
beforeAll(annotations.beforeAll);
```

```tsx filename="setupTest.ts" renderer="vue" language="ts"
import { beforeAll } from '@jest/globals';
import { render as testingLibraryRender } from '@testing-library/vue';
import { setProjectAnnotations } from '@storybook/vue3';
import * as addonAnnotations from 'my-addon/preview';
import * as previewAnnotations from './.storybook/preview';

const annotations = setProjectAnnotations([
  previewAnnotations,
  addonAnnotations,
  // Attention: Passing the render function from testing library is required if you mount stories in play functions
  { testingLibraryRender },
]);

// Supports beforeAll hook from Storybook
beforeAll(annotations.beforeAll);
```
