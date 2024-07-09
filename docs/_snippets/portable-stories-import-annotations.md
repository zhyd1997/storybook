```js filename="setupFile.js|ts" renderer="react" language="ts"
import { setProjectAnnotations } from '@storybook/react';
import * as previewAnnotations from './.storybook/preview';

// Apply the global annotations from the Storybook preview file
const annotations = setProjectAnnotations(previewAnnotations);

// Supports beforeAll hook from Storybook
beforeAll(annotations.beforeAll);
```

```js filename="setupFile.js|ts" renderer="vue" language="ts"
import { setProjectAnnotations } from '@storybook/vue3';
import * as previewAnnotations from './.storybook/preview';

// Apply the global annotations from the Storybook preview file
const annotations = setProjectAnnotations(previewAnnotations);

// Supports beforeAll hook from Storybook
beforeAll(annotations.beforeAll);
```

```js filename="setupFile.js|ts" renderer="svelte" language="ts"
import { setProjectAnnotations } from '@storybook/svelte';
import * as previewAnnotations from './.storybook/preview';

// Apply the global annotations from the Storybook preview file
const annotations = setProjectAnnotations(previewAnnotations);

// Supports beforeAll hook from Storybook
beforeAll(annotations.beforeAll);
```
