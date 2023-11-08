/** @type {import("eslint").Linter.Config} */
const config = {
  root: true,
  extends: ["@fissa/eslint-config"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    // @ts-ignore-next-line
    tsconfigRootDir: __dirname,
    project: ["./tsconfig.json", "./apps/*/tsconfig.json", "./packages/*/tsconfig.json"],
  },
  settings: {
    next: {
      rootDir: ["apps/nextjs"],
    },
  },
};

module.exports = config;
