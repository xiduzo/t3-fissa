// import react from '@vitejs/plugin-react';
import { defineConfig } from "vitest/config";

// https://vitejs.dev/config/
export default defineConfig({
  //   plugins: [react()],
  test: {
    globals: true,
    // environment: "jsdom",
    sequence: {
      shuffle: true,
    },
    coverage: {
      // provider: 'istanbul', // https://vitest.dev/guide/coverage.html
      reporter: ["text", "text-summary", "lcov"],
      // reportsDirectory: 'coverage',
    },
    clearMocks: true,
    setupFiles: ["./setupTests.ts"],
  },
});
