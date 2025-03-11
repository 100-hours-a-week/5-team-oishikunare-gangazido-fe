// eslint.config.cjs (CommonJS 스타일)
module.exports = [
  {
    ignores: ["node_modules", "dist"], // ESLint가 무시할 폴더
  },
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      "semi": ["error", "always"],
      "quotes": ["error", "double"],
      "no-unused-vars": "warn",
      "no-console": "warn"
    }
  }
];