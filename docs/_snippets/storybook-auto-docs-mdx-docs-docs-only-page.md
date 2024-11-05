```mdx filename="ExampleDocumentation.mdx" renderer="common" language="mdx"
{/* TK: Vet this against recommendation and filter out Svelte CSF */}
import { Meta } from '@storybook/blocks';

import * as ExampleComponentStories from './ExampleComponent.stories';

{/* 👇 Documentation-only page */}

<Meta title="Documentation" />

{/* 👇 Component documentation page */}

<Meta of={ExampleComponentStories} />
```
