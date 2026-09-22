/** @type {import('stylelint').Config} */
export default {
  customSyntax: 'postcss-less',
  extends: ['stylelint-config-recess-order'],
  rules: {
    'selector-class-pattern': null,
    'no-descending-specificity': null,
    'no-empty-source': null,
    'at-rule-no-unknown': null,
    'import-notation': 'string',
  },
  overrides: [
    {
      files: ['**/*.vue'],
      customSyntax: 'postcss-html',
    },
  ],
};
