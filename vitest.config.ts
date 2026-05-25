// import react from '@vitejs/plugin-react';
import { defineConfig } from "vitest/config";

// https://vitejs.dev/config/
export default defineConfig({
  //   plugins: [react()],
  test: {
    globals: true,
    // environment: "jsdom",
    // Stale agent worktrees carry duplicate, broken test copies — keep them out.
    exclude: ["**/node_modules/**", "**/dist/**", ".claude/**"],
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
