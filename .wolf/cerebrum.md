# Cerebrum

> OpenWolf's learning memory. Updated automatically as the AI learns from interactions.
> Do not edit manually unless correcting an error.
> Last updated: 2026-04-10

## User Preferences

<!-- How the user likes things done. Code style, tools, patterns, communication. -->

## Key Learnings

- **Web testing setup:** `apps/web` uses Vitest with jsdom. Config is at `apps/web/vitest.config.ts`. Must alias `react` and `react-dom` to `apps/web/node_modules/react` (React 18) to avoid dual-React instance conflicts with `@testing-library/react` which has its own nested `react-dom`. Root `node_modules/react` is React 19 — wrong version for web app tests.
- **@testing-library/react location:** Installed at root `node_modules/@testing-library/react` (not inside `apps/web/node_modules`). Has nested `react-dom` that must be deduped via vitest `resolve.alias` + `dedupe`.
- **vitest.config.ts setupFiles:** Must use absolute path (`path.resolve(__dirname, ...)`) when the config is used from root or another directory — relative paths break.
- **Project:** fissa-house-party
- **Description:** <img width="1758" alt="turbo2" src="https://user-images.githubusercontent.com/51714798/213819392-33e50db9-3e38-4c51-9a22-03abe5e48f3d.png">
- **`@fissa/db` is server-only:** `packages/db/index.ts` instantiates a `postgres` client at module load time. Never import from `@fissa/db` (or the relative path `packages/db`) in Expo/React Native code. Import types/enums from `packages/db/schema` directly instead.

## Do-Not-Repeat

<!-- Mistakes made and corrected. Each entry prevents the same mistake recurring. -->
<!-- Format: [YYYY-MM-DD] Description of what went wrong and what to do instead. -->

## Decision Log

<!-- Significant technical decisions with rationale. Why X was chosen over Y. -->
