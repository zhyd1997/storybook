```mdx filename="Checkbox.mdx" renderer="common" language="mdx"
import { Canvas, Meta } from '@storybook/blocks';

import * as CheckboxStories from './Checkbox.stories';

<Meta of={CheckboxStories} />

# Checkbox

A checkbox is a square box that can be activated or deactivated when ticked.

Use checkboxes to select one or more options from a list of choices.

<Canvas of={CheckboxStories.Unchecked} />
```

```mdx filename="Checkbox.mdx" renderer="svelte" language="mdx"
{/* TK: vet this against recomendation */}
```

```mdx filename="Checkbox.mdx" renderer="react" language="mdx"
import { Canvas, Meta, Story } from '@storybook/blocks';

import * as CheckboxStories from './Checkbox.stories';

<Meta of={CheckboxStories} />

# Checkbox

With `MDX` we can compose Markdown documentation with `Checkbox` stories and interactive controls.

<Canvas>
  <Story of={CheckboxStories.Unchecked} />
</Canvas>
```
