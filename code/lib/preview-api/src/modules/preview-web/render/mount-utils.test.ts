import { expect, test } from 'vitest';
import { getUsedProps } from './mount-utils';

const StoryWithContext = {
  play: async (context: any) => {
    console.log(context);
  },
};

const StoryWitCanvasElement = {
  play: async ({ canvasElement }: any) => {
    console.log(canvasElement);
  },
};

const MountStory = {
  play: async ({ mount }: any) => {
    await mount();
  },
};

test('Detect destructure', () => {
  expect(getUsedProps(StoryWithContext.play)).toMatchInlineSnapshot(`[]`);
  expect(getUsedProps(StoryWitCanvasElement.play)).toMatchInlineSnapshot(`
    [
      "canvasElement",
    ]
  `);

  expect(getUsedProps(MountStory.play)).toMatchInlineSnapshot(`
    [
      "mount",
    ]
  `);
});
