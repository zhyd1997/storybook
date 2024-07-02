module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Ensure the imports-paths of packages in the monorepo is correct',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
  },
  fix: function (fixer) {
    console.log('FIX');
  },
  create(context) {
    console.log('CREATE');
    return {};
  },
};
