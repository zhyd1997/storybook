# storybook-addon-a11y

This Storybook addon can be helpful to make your UI components more accessible.

[Framework Support](https://storybook.js.org/docs/configure/integration/frameworks-feature-support)

![Screenshot](https://raw.githubusercontent.com/storybookjs/storybook/next/code/addons/a11y/docs/screenshot.png)

## Getting started

First, install the addon.

```sh
$ yarn add @storybook/addon-a11y --dev
```

Add this line to your `main.js` file (create this file inside your Storybook config directory if needed).

```js
export default {
  addons: ['@storybook/addon-a11y'],
};
```

And here's a sample story file to test the addon:

```js
import React from 'react';

export default {
  title: 'button',
};

export const Accessible = () => <button>Accessible button</button>;

export const Inaccessible = () => (
  <button style={{ backgroundColor: 'red', color: 'darkRed' }}>Inaccessible button</button>
);
```

## Handling failing rules

When Axe reports accessibility violations in stories, there are multiple ways to handle these failures depending on your needs.

### Story-level overrides

At the Story level, override rules using `parameters.a11y.config.rules`.

```js
export const InputWithoutAutofill = () => <input type="text" autocomplete="nope" />;

InputWithoutAutofill.parameters = {
  a11y: {
    // Avoid doing this, as it will fully disable all accessibility checks for this story.
    disable: true,

    // Instead, override rules 👇
    // axe-core configurationOptions (https://github.com/dequelabs/axe-core/blob/develop/doc/API.md#parameters-1)
    config: {
      rules: [
        {
          // You can exclude some elements from failing a specific rule:
          id: 'autocomplete-valid',
          selector: '*:not([autocomplete="nope"])',
        },
        {
          // You can also signify that a violation will need to be fixed in the future
          // by overriding the result of a rule to return "Needs Review"
          // rather than "Violation" if the rule fails:
          id: 'landmark-complementary-is-top-level',
          reviewOnFail: true,
        },
      ],
    },
  },
};
```

Alternatively, you can disable specific rules in a Story:

```js
export const Inaccessible = () => (
  <button style={{ backgroundColor: 'red', color: 'darkRed' }}>Inaccessible button</button>
);
Inaccessible.parameters = {
  a11y: {
    config: {
      rules: [{ id: 'color-contrast', enabled: false }],
    },
  },
};
```

Tip: clearly explain in a comment why a rule was overridden, it’ll help you and your team trace back why certain violations aren’t being reported or need to be addressed. For example:

```js
MyStory.parameters = {
  a11y: {
    config: {
      rules: [
        {
          // Allow `autocomplete="nope"` on form elements,
          // a workaround to disable autofill in Chrome.
          // @link https://bugs.chromium.org/p/chromium/issues/detail?id=468153
          id: 'autocomplete-valid',
          selector: '*:not([autocomplete="nope"])',
        },
        {
          // @fixme Color contrast of subdued text fails, as raised in issue #123.
          id: 'color-contrast',
          reviewOnFail: true,
        },
      ],
    },
  },
};
```

### Global overrides

When you want to ignore an accessibility rule or change its settings across all stories, set `parameters.a11y.config.rules` in your Storybook’s `preview.ts` file. This can be particularly useful for ignoring false positives commonly reported by Axe.

```ts
// .storybook/preview.ts

export const parameters = {
  a11y: {
    config: {
      rules: [
        {
          // This tells Axe to run the 'autocomplete-valid' rule on selectors
          // that match '*:not([autocomplete="nope"])' (all elements except [autocomplete="nope"]).
          // This is the safest way of ignoring a violation across all stories,
          // as Axe will only ignore very specific elements and keep reporting
          // violations on other elements of this rule.
          id: 'autocomplete-valid',
          selector: '*:not([autocomplete="nope"])',
        },
        {
          // To disable a rule across all stories, set `enabled` to `false`.
          // Use with caution: all violations of this rule will be ignored!
          id: 'autocomplete-valid',
          enabled: false,
        },
      ],
    },
  },
};
```

#### Overriding defaults

Per default, Storybook has disabled the axe rule 'region' as it overreports in component testing.
Landmarks are a good practice, but are usually applied during component composition, not on a component level. For example, a button itself doesn't define a landmark, whereas a whole page or a section of a page does.

If you still want to enable the rule, you can do so by setting the `enabled` property to `true`:

```ts
// .storybook/preview.ts

export const parameters = {
  a11y: {
    config: {
      rules: [
        {
          id: 'region',
          enabled: true,
        },
      ],
    },
  },
};
```

### Disabling checks

If you wish to entirely disable `a11y` checks for a subset of stories, you can control this with story parameters:

```js
export const MyNonCheckedStory = () => <SomeComponent />;
MyNonCheckedStory.parameters = {
  // Avoid doing this, as it fully disables all accessibility checks for this story,
  // and consider the techniques described above.
  a11y: { disable: true },
};
```

## Parameters and globals

For more customizability use parameters and globals to configure [aXe options](https://github.com/dequelabs/axe-core/blob/develop/doc/API.md#api-name-axeconfigure).
You can override these options [at story level too](https://storybook.js.org/docs/react/configure/features-and-behavior#per-story-options).

```js
import React from 'react';
import { addDecorator, addParameters, storiesOf } from '@storybook/react';

export default {
  title: 'button',
  parameters: {
    a11y: {
      // optional selector which element to inspect
      element: '#storybook-root',
      // axe-core configurationOptions (https://github.com/dequelabs/axe-core/blob/develop/doc/API.md#parameters-1)
      config: {},
      // axe-core optionsParameter (https://github.com/dequelabs/axe-core/blob/develop/doc/API.md#options-parameter)
      options: {},
      // Defines which impact levels will be considered as warnings instead of errors if executed via Storybook's component testing
      warnings: <'minor' | 'moderate' | 'serious' | 'critical'>[]
    },
  },
  globals: {
    a11y: {
      // optional flag to prevent the automatic check
      manual: true,
    }
  }
};

export const accessible = () => <button>Accessible button</button>;

export const inaccessible = () => (
  <button style={{ backgroundColor: 'red', color: 'darkRed' }}>Inaccessible button</button>
);
```

## Integration with [Addon Test](https://storybook.js.org/docs/writing-tests/test-addon)

The a11y addon is compatible with Storybook's newest addon, [addon test](https://storybook.js.org/docs/writing-tests/test-addon). When you run component tests, the a11y addon can automatically check for accessibility issues for all of your stories in the background. If there are any violations, the test will fail, and you will see the results in the sidebar.

### Automatic setup

When you add the a11y addon via `npx storybook add` command, it will automatically be integrated with the component testing feature. You don't need to do anything else to enable accessibility checks in your component tests.

### Manual setup

If you have already a11y addon installed and you have upgraded manually to Storybook 8.5 or later, you can enable the integration by adding the following configuration to your `.storybook/vitest.config.ts` file:

```diff
// .storybook/vitest.config.ts
...
+import * as a11yAddonAnnotations from '@storybook/addon-a11y/preview';

const annotations = setProjectAnnotations([
  previewAnnotations,
+ a11yAddonAnnotations,
]);

// Run Storybook's beforeAll hook
beforeAll(annotations.beforeAll);
```

### How to not get overwhelmed by a11y violations in addon-test

Accessibility testing can be overwhelming, especially when you have a large number of stories and you have just started to use the a11y addon in combination with the test addon.

You can disable accessibility tests which are running via the test addon for all of your stories at once. Just set the `!a11ytest` tag in your preview file:

```js
// .storybook/preview.js
export const tags = ['!a11ytest'];
```

Now you can step-by-step enable accessibility tests for your stories by adding the `a11ytest` tag to the stories' meta or by adding the `a11ytest` tag to the story's tags directly:

```js
// Button.stories.js
export default {
  title: 'Button',
  component: Button,
  // add the tag to the meta to enable accessibility checks for all of your stories
  tags: ['a11ytest'],
};

export const Primary = {
  // add the tag to story itself to just enable the accessibility check for this story
  tags: ['a11ytest'],
  ...
}
```

### Violation impact levels

By default, the addon will consider all violations as errors. However, you can configure the addon to consider some violations as warnings instead of errors. This can be useful when `@storybook/addon-a11y` is used in combination with `@storybook/experimental-addon-test`. To do this, set the `warnings` parameter in the `a11y` object to an array of impact levels that should be considered as warnings.

```js
export default {
  title: 'button',
  parameters: {
    a11y: {
      /**
       * @default [ ]
       * @type: Array<'minor' | 'moderate' | 'serious' | 'critical'>
       */
      warnings: ['minor', 'moderate'],
    },
  },
};
```

In this example, all violations with an impact level of `minor` or `moderate` will be considered as warnings. All other violations will be considered as errors. When running automated UI tests featured by Vitest, all violations with an impact level of `serious` or `critical` will now fail the test. This failure is reflected as an error in the sidebar or when running Vitest separately. `minor` and `moderate` violations will be reported as warnings but will not fail the test.

## Automate accessibility tests with test runner

The test runner does not apply any rules that you have set on your stories by default. You can configure the runner to correctly apply the rules by [following the guide on the Storybook docs](https://storybook.js.org/docs/writing-tests/accessibility-testing#automate-accessibility-tests-with-test-runner).

## Roadmap

- Make UI accessible
- Show in story where violations are.
- Add more example tests
- Add tests
- Make CI integration possible
