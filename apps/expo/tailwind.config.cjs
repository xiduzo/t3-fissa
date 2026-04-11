/** @type {import("tailwindcss").Config} */
module.exports = {
  presets: [require("../../packages/config/tailwind/index.js"), require("nativewind/preset")],
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
};
