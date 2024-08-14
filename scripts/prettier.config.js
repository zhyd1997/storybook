export default {
  printWidth: 100,
  tabWidth: 2,
  bracketSpacing: true,
  trailingComma: 'es5',
  singleQuote: true,
  arrowParens: 'always',

  overrides: [
    {
      files: '*.html',
      options: { parser: 'babel' },
    },
    {
      files: '*.component.html',
      options: { parser: 'angular' },
    },
    {
      files: ['**/frameworks/angular/src/**/*.ts', '**/frameworks/angular/template/**/*.ts'],
      options: { parser: 'babel-ts' },
    },
    {
      files: ['*.md', '*.mdx'],
      options: {
        importOrderSeparation: false,
        importOrderSortSpecifiers: false,
      },
    },
  ],
  plugins: [
    '@trivago/prettier-plugin-sort-imports',
    // 'prettier-plugin-brace-style',
    // 'prettier-plugin-curly',
    'prettier-plugin-jsdoc',
    'prettier-plugin-css-order',
    'prettier-plugin-merge',
  ],

  importOrder: [
    '^node:',
    '^(vitest|@testing-library)',
    '^react(-dom(/client)?(/server)?)?$',
    '^storybook/internal',
    '^@storybook/[^-]*$',
    '^@storybook/(?!addon-)(.*)$',
    '^@storybook/addon-(.*)$',
    '<THIRD_PARTY_MODULES>',
    '^[./]',
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,

  // braceStyle: '1tbs',
};
