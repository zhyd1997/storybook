```ts filename="vitest.setup.ts" renderer="react" language="js"
// Import the a11y addon annotations
import * as a11yAddonAnnotations from '@storybook/addon-a11y/preview';
import { beforeAll } from 'vitest';
import { setProjectAnnotations } from '@storybook/react';
// Optionally import your own annotations
import * as projectAnnotations from './preview';

const project = setProjectAnnotations([
  // Add the a11y addon annotations
  a11yAddonAnnotations,
  projectAnnotations,
]);

beforeAll(project.beforeAll);
```

```js filename="vitest.setup.js" renderer="react" language="js"
// Import the a11y addon annotations
import * as a11yAddonAnnotations from '@storybook/addon-a11y/preview';
import { beforeAll } from 'vitest';
import { setProjectAnnotations } from '@storybook/react';
// Optionally import your own annotations
import * as projectAnnotations from './preview';

const project = setProjectAnnotations([
  // Add the a11y addon annotations
  a11yAddonAnnotations,
  projectAnnotations,
]);

beforeAll(project.beforeAll);
```

```ts filename="vitest.setup.ts" renderer="svelte" language="ts"
// Import the a11y addon annotations
import * as a11yAddonAnnotations from '@storybook/addon-a11y/preview';
import { beforeAll } from 'vitest';
import { setProjectAnnotations } from '@storybook/svelte';
// Optionally import your own annotations
import * as projectAnnotations from './preview';

const project = setProjectAnnotations([
  // Add the a11y addon annotations
  a11yAddonAnnotations,
  projectAnnotations,
]);

beforeAll(project.beforeAll);
```

```js filename="vitest.setup.js" renderer="svelte" language="js"
// Import the a11y addon annotations
import * as a11yAddonAnnotations from '@storybook/addon-a11y/preview';
import { beforeAll } from 'vitest';
import { setProjectAnnotations } from '@storybook/svelte';
// Optionally import your own annotations
import * as projectAnnotations from './preview';

const project = setProjectAnnotations([
  // Add the a11y addon annotations
  a11yAddonAnnotations,
  projectAnnotations,
]);

beforeAll(project.beforeAll);
```

```ts filename="vitest.setup.ts" renderer="vue" language="ts"
// Import the a11y addon annotations
import * as a11yAddonAnnotations from '@storybook/addon-a11y/preview';
import { beforeAll } from 'vitest';
import { setProjectAnnotations } from '@storybook/vue3';
// Optionally import your own annotations
import * as projectAnnotations from './preview';

const project = setProjectAnnotations([
  // Add the a11y addon annotations
  a11yAddonAnnotations,
  projectAnnotations,
]);

beforeAll(project.beforeAll);
```

```js filename="vitest.setup.js" renderer="vue" language="js"
// Import the a11y addon annotations
import * as a11yAddonAnnotations from '@storybook/addon-a11y/preview';
import { beforeAll } from 'vitest';
import { setProjectAnnotations } from '@storybook/vue3';
// Optionally import your own annotations
import * as projectAnnotations from './preview';

const project = setProjectAnnotations([
  // Add the a11y addon annotations
  a11yAddonAnnotations,
  projectAnnotations,
]);

beforeAll(project.beforeAll);
```
