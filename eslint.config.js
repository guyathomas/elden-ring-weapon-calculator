module.exports = [
  {
    extends: [
      "eslint:recommended",
      "plugin:react/recommended",
      "plugin:react-hooks/recommended",
      "plugin:react/jsx-runtime",
      "plugin:@typescript-eslint/recommended",
    ],
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint", "prettier"],
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    root: true,
  },
];
