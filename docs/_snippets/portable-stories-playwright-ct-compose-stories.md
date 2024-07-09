```tsx filename="playwright/index.tsx" renderer="react" language="ts"
import { test } from '@playwright/experimental-ct-react';
import { setProjectAnnotations } from '@storybook/react';
import * as addonAnnotations from 'my-addon/preview';
import * as previewAnnotations from '../.storybook/preview';

const annotations = setProjectAnnotations([previewAnnotations, addonAnnotations]);
// Supports beforeAll hook from Storybook
test.beforeAll(annotations.beforeAll);
```

```tsx filename="playwright/index.tsx"  renderer="vue" language="ts"
import { test } from '@playwright/experimental-ct-react';
import { setProjectAnnotations } from '@storybook/vue3';
import * as addonAnnotations from 'my-addon/preview';
import * as previewAnnotations from '../.storybook/preview';

const annotations = setProjectAnnotations([previewAnnotations, addonAnnotations]);
// Supports beforeAll hook from Storybook
test.beforeAll(annotations.beforeAll);
```
