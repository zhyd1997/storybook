```js filename="Button.stories.js|jsx" renderer="common" language="js" tabTitle="Without story globals"
import { Button } from './Button';

export default {
  component: Button,
};

export const Large = {
  parameters: {
    backgrounds: { disable: true },
  },
};
```

```js filename="Button.stories.js|jsx" renderer="common" language="js" tabTitle="With story globals enabled"
import { Button } from './Button';

export default {
  component: Button,
};

export const Large = {
  parameters: {
    backgrounds: { disabled: true },
  },
};
```

```ts filename="Button.stories.ts|tsx" renderer="common" language="ts-4-9" tabTitle="Without story globals"
// Replace your-framework with the name of your framework
import type { Meta, StoryObj } from '@storybook/your-framework';

import { Button } from './Button';

const meta = {
  component: Button,
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Large: Story = {
  parameters: {
    backgrounds: { disable: true },
  },
};
```

```ts filename="Button.stories.ts|tsx" renderer="common" language="ts-4-9" tabTitle="With story globals enabled"
// Replace your-framework with the name of your framework
import type { Meta, StoryObj } from '@storybook/your-framework';

import { Button } from './Button';

const meta = {
  component: Button,
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Large: Story = {
  parameters: {
    backgrounds: { disabled: true },
  },
};
```

```ts filename="Button.stories.ts|tsx" renderer="common" language="ts" tabTitle="Without story globals"
// Replace your-framework with the name of your framework
import type { Meta, StoryObj } from '@storybook/your-framework';

import { Button } from './Button';

const meta: Meta<typeof Button> = {
  component: Button,
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Large: Story = {
  parameters: {
    backgrounds: { disable: true },
  },
};
```

```ts filename="Button.stories.ts|tsx" renderer="common" language="ts" tabTitle="With story globals enabled"
// Replace your-framework with the name of your framework
import type { Meta, StoryObj } from '@storybook/your-framework';

import { Button } from './Button';

const meta: Meta<typeof Button> = {
  component: Button,
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Large: Story = {
  parameters: {
    backgrounds: { disabled: true },
  },
};
```
