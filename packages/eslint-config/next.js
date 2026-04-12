import tseslint from "typescript-eslint";
import nextConfig from "eslint-config-next";
import prettierConfig from "eslint-config-prettier";

export default [
  ...nextConfig,
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  prettierConfig,
];
