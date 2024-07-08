```tsx filename="Page.stories.tsx" renderer="react" language="ts"
export const Default = {
  play: async ({ mount, args }) => {
    const note = await db.note.create({
      data: { title: 'Mount inside of play' },
    });

    // 👇Pass data that is created inside of the play function to the component
    // For example a just generated UUID
    const canvas = await mount(<Page {...args} params={{ id: String(note.id) }} />);

    await userEvent.click(await canvas.findByRole('menuitem', { name: /login to add/i }));
  },
};
```

```jsx filename="Page.stories.jsx" renderer="react" language="js"
export const Default = {
  play: async ({ mount, args }) => {
    const note = await db.note.create({
      data: { title: 'Mount inside of play' },
    });

    // 👇Pass data that is created inside of the play function to the component
    // For example a just generated UUID
    const canvas = await mount(<Page {...args} params={{ id: String(note.id) }} />);

    await userEvent.click(await canvas.findByRole('menuitem', { name: /login to add/i }));
  },
};
```

```ts filename="Page.stories.ts" renderer="svelte" language="ts"
export const Default: Story = {
  play: async ({ mount, args }) => {
    const note = await db.note.create({
      data: { title: 'Mount inside of play' },
    });

    // 👇Pass data that is created inside of the play function to the component
    // For example a just generated UUID
    const canvas = await mount(Page, { props: { ...args, params: { id: String(note.id) } } });

    await userEvent.click(await canvas.findByRole('menuitem', { name: /login to add/i }));
  },
};
```

```js filename="Page.stories.js" renderer="svelte" language="js"
export const Default = {
  play: async ({ mount, args }) => {
    const note = await db.note.create({
      data: { title: 'Mount inside of play' },
    });

    // 👇Pass data that is created inside of the play function to the component
    // For example a just generated UUID
    const canvas = await mount(Page, { props: { ...args, params: { id: String(note.id) } } });

    await userEvent.click(await canvas.findByRole('menuitem', { name: /login to add/i }));
  },
};
```

```ts filename="Page.stories.ts" renderer="vue3" language="ts"
export const Default: Story = {
  play: async ({ mount, args }) => {
    const note = await db.note.create({
      data: { title: 'Mount inside of play' },
    });

    // 👇Pass data that is created inside of the play function to the component
    // For example a just generated UUID
    const canvas = await mount(Page, { props: { ...args, params: { id: String(note.id) } } });

    await userEvent.click(await canvas.findByRole('menuitem', { name: /login to add/i }));
  },
};
```

```js filename="Page.stories.js" renderer="vue3" language="js"
export const Default = {
  play: async ({ mount, args }) => {
    const note = await db.note.create({
      data: { title: 'Mount inside of play' },
    });

    // 👇Pass data that is created inside of the play function to the component
    // For example a just generated UUID
    const canvas = await mount(Page, { props: { ...args, params: { id: String(note.id) } } });

    await userEvent.click(await canvas.findByRole('menuitem', { name: /login to add/i }));
  },
};
```