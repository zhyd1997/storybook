```ts filename="Button.stories.ts" renderer="react" language="ts"
import type { Meta, StoryObj } from '@storybook/react';

import { Button } from './Button';

const meta: Meta<Button> = {
  component: Button,
  // Enable accessibility checks for all stories in this component
  // This is only necessary if you have set the `!a11ytest` tag in your preview file, otherwise `a11ytest` is enabled by default
  tags: ['a11ytest'],
};
export default meta;

type Story = StoryObj<Button>;

// This is an accessible story
export const Accessible: Story = {
  args: {
    primary: false,
    label: 'Button',
  },
};

// This is not
export const Inaccessible: Story = {
  // Turn off accessibility tests for this story using the tag's configuration option
  tags: ['!a11ytest'],
  args: {
    ...Accessible.args,
    backgroundColor: 'red',
  },
};
```

```jsx filename="Button.stories.jsx" renderer="react" language="js"
import { Button } from './Button';

export default {
  component: Button,
  // Enable accessibility checks for all stories in this component
  // This is only necessary if you have set the `!a11ytest` tag in your preview file, otherwise `a11ytest` is enabled by default
  tags: ['a11ytest'],
};

// This is an accessible story
export const Accessible = {
  args: {
    primary: false,
    label: 'Button',
  },
};

// This is not
export const Inaccessible = {
  // Turn off accessibility tests for this story using the tag's configuration option
  tags: ['!a11ytest'],
  args: {
    ...Accessible.args,
    backgroundColor: 'red',
  },
};
```

```tsx filename="Button.stories.tsx" renderer="react" language="ts-4-9"
import type { Meta, StoryObj } from '@storybook/react';

import { Button } from './Button';

const meta = {
  component: Button,
  // Enable accessibility checks for all stories in this component
  // This is only necessary if you have set the `!a11ytest` tag in your preview file, otherwise `a11ytest` is enabled by default
  tags: ['a11ytest'],
} satisfies Meta<typeof Button>;
export default meta;

type Story = StoryObj<typeof meta>;

// This is an accessible story
export const Accessible: Story = {
  args: {
    primary: false,
    label: 'Button',
  },
};

// This is not
export const Inaccessible: Story = {
  // Turn off accessibility tests for this story using the tag's configuration option
  tags: ['!a11ytest'],
  args: {
    ...Accessible.args,
    backgroundColor: 'red',
  },
};
```

```svelte filename="Button.stories.svelte" renderer="svelte" language="js" tabTitle="Svelte CSF"
<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Button } from './Button.svelte';

  const { Story } = defineMeta({
  component: Button,
  <!-- 👇 Enable accessibility checks for all stories in this component -->
  <!-- 👇 This is only necessary if you have set the `!a11ytest` tag in your preview file, otherwise `a11ytest` is enabled by default -->
  tags: ['a11ytest'],
});
</script>

<!-- 👇 This is an accessible story -->
<Story
  name="Accessible"
  args={{ variant: 1 }}
/>

<!-- 👇 Turn off accessibility tests for this story using the tag's configuration option -->
<Story
  name="Inaccessible"
  tags={['!a11ytest']}
  args={{ variant: 2 }}
/>
```

```svelte filename="Button.stories.svelte" renderer="svelte" language="ts-4-9" tabTitle="Svelte CSF"
<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Button } from './Button.svelte';

  const { Story } = defineMeta({
    component: Button,
    <!-- 👇 Enable accessibility checks for all stories in this component -->
    <!-- 👇 This is only necessary if you have set the `!a11ytest` tag in your preview file, otherwise `a11ytest` is enabled by default -->
    tags: ['a11ytest'],
  });
</script>

<!-- 👇 This is an accessible story -->
<Story
  name="Accessible"
  args={{ variant: 1 }}
/>

<!-- 👇 Turn off accessibility tests for this story using the tag's configuration option -->
<Story
  name="Inaccessible"
  tags={['!a11ytest']}
  args={{ variant: 2 }}
/>
```

```svelte filename="Button.stories.svelte" renderer="svelte" language="ts" tabTitle="Svelte CSF"
<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Button } from './Button.svelte';

  const { Story } = defineMeta({
    component: Button,
    <!-- 👇 Enable accessibility checks for all stories in this component -->
    <!-- 👇 This is only necessary if you have set the `!a11ytest` tag in your preview file, otherwise `a11ytest` is enabled by default -->
    tags: ['a11ytest'],
  });
</script>

<!-- 👇 This is an accessible story -->
<Story
  name="Accessible"
  args={{ variant: 1 }}
/>

<!-- 👇 Turn off accessibility tests for this story using the tag's configuration option -->
<Story
  name="Inaccessible"
  tags={['!a11ytest']}
  args={{ variant: 2 }}
/>
```

```js filename="Button.stories.js" renderer="vue" language="js"
import { Button } from './Button';

export default {
  component: Button,
  // Enable accessibility checks for all stories in this component
  // This is only necessary if you have set the `!a11ytest` tag in your preview file, otherwise `a11ytest` is enabled by default
  tags: ['a11ytest'],
};

// This is an accessible story
export const Accessible: Story = {
  args: {
    primary: false,
    label: 'Button',
  },
};

// This is not
export const Inaccessible: Story = {
  // Turn off accessibility tests for this story using the tag's configuration option
  tags: ['!a11ytest'],
  args: {
    ...Accessible.args,
    backgroundColor: 'red',
  },
};
```

```ts filename="Button.stories.ts" renderer="vue" language="ts-4-9"
import type { Meta, StoryObj } from '@storybook/vue3';

import { Button } from './Button';

const meta = {
  component: Button,
  // Enable accessibility checks for all stories in this component
  // This is only necessary if you have set the `!a11ytest` tag in your preview file, otherwise `a11ytest` is enabled by default
  tags: ['a11ytest'],
} satisfies Meta<typeof Button>;
export default meta;

type Story = StoryObj<typeof meta>;

// This is an accessible story
export const Accessible: Story = {
  args: {
    primary: false,
    label: 'Button',
  },
};

// This is not
export const Inaccessible: Story = {
  // Turn off accessibility tests for this story using the tag's configuration option
  tags: ['!a11ytest'],
  args: {
    ...Accessible.args,
    backgroundColor: 'red',
  },
};
```

```ts filename="Button.stories.ts" renderer="vue" language="ts"
import type { Meta, StoryObj } from '@storybook/vue3';

import { Button } from './Button';

const meta: Meta<Button> = {
  component: Button,
  // Enable accessibility checks for all stories in this component
  // This is only necessary if you have set the `!a11ytest` tag in your preview file, otherwise `a11ytest` is enabled by default
  tags: ['a11ytest'],
};
export default meta;

type Story = StoryObj<Button>;

// This is an accessible story
export const Accessible: Story = {
  args: {
    primary: false,
    label: 'Button',
  },
};

// This is not
export const Inaccessible: Story = {
  // Turn off accessibility tests for this story using the tag's configuration option
  tags: ['!a11ytest'],
  args: {
    ...Accessible.args,
    backgroundColor: 'red',
  },
};
```
