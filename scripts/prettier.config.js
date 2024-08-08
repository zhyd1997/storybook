export default {
  printWidth: 100,
  tabWidth: 2,
  bracketSpacing: true,
  trailingComma: 'es5',
  singleQuote: true,
  overrides: [
    {
      files: '*.html',
      options: { parser: 'babel' },
    },
    {
      files: '*.component.html',
      options: { parser: 'angular' },
    },
  ],
  plugins: ['@trivago/prettier-plugin-sort-imports'],

  importOrder: ['^node:', '^storybook/internal', '^@storybook/(.*)$', '^[./]'],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,

  arrowParens: 'always',
};
