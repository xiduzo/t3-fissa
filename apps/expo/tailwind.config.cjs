/** @type {import("tailwindcss").Config} */
module.exports = {
  presets: [require("../../packages/config/tailwind/index.js")],
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
};
