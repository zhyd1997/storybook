```js filename="Page.stories.js" renderer="common" language="js"
import MockDate from 'mockdate';

// ...

export const ChristmasUI = {
  async play({ canvasElement }) {
    MockDate.set('2024-12-25');
    // 👇Render the component with the mocked date
    await mount();
    // act and/or assert
  },
};
```

```ts filename="Page.stories.ts" renderer="common" language="ts-4-9"
import MockDate from 'mockdate';

// ...

export const ChristmasUI: Story = {
  async play({ canvasElement }) {
    MockDate.set('2024-12-25');
    // 👇Render the component with the mocked date
    await mount();
    // act and/or assert
  },
};
```

```ts filename="Page.stories.ts" renderer="common" language="ts"
import MockDate from 'mockdate';

// ...

export const ChristmasUI: Story = {
  async play({ canvasElement }) {
    MockDate.set('2024-12-25');
    // 👇Render the component with the mocked date
    await mount();
    // act and/or assert
  },
};
```
