import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@storybook/addon-controls",
    "@storybook/experimental-addon-test",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  core: {
    disableWhatsNewNotifications: true
  },
  previewHead: (head = '') => `${head}
  <style>
    body {
      border: 1px solid red;
    }
  </style>`,
  staticDirs: [{ from: './test-static-dirs', to:'test-static-dirs' }],
};
export default config;
