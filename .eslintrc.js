module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    // "plugin:eslint-comments/recommended",
    // "plugin:jest/recommended",
    // "plugin:import/errors",
    // "plugin:import/warnings",
    // "plugin:import/typescript",
    // "prettier",
    // "prettier/@typescript-eslint",
  ],
  rules: {
    quotes: ["error", "double", "avoid-escape"],
    "jsx-quotes": ["warn", "prefer-double"],
    "@typescript-eslint/member-delimiter-style": [
      "error",
      { multiline: { delimiter: "none" } },
    ],
    "react/prop-types": "off",
  },
  parserOptions: {
    sourceType: "module",
  },
}
