# Cerebrum

> OpenWolf's learning memory. Updated automatically as the AI learns from interactions.
> Do not edit manually unless correcting an error.
> Last updated: 2026-04-10

## User Preferences

<!-- How the user likes things done. Code style, tools, patterns, communication. -->

## Key Learnings

- **Project:** fissa-house-party
- **Description:** <img width="1758" alt="turbo2" src="https://user-images.githubusercontent.com/51714798/213819392-33e50db9-3e38-4c51-9a22-03abe5e48f3d.png">
- **`@fissa/db` is server-only:** `packages/db/index.ts` instantiates a `postgres` client at module load time. Never import from `@fissa/db` (or the relative path `packages/db`) in Expo/React Native code. Import types/enums from `packages/db/schema` directly instead.

## Do-Not-Repeat

<!-- Mistakes made and corrected. Each entry prevents the same mistake recurring. -->
<!-- Format: [YYYY-MM-DD] Description of what went wrong and what to do instead. -->

## Decision Log

<!-- Significant technical decisions with rationale. Why X was chosen over Y. -->
