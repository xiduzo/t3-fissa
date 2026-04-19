# anatomy.md

> Auto-maintained by OpenWolf. Last scanned: 2026-04-19T15:11:39.271Z
> Files: 508 tracked | Anatomy hits: 0 | Misses: 0

## ./

- `.dockerignore` — Docker ignore rules (~28 tok)
- `.eslintrc.js` — ESLint configuration (~130 tok)
- `.gitignore` — Git ignore rules (~146 tok)
- `.npmrc` — Expo doesn't play nice with pnpm by default. (~76 tok)
- `.nvmrc` (~1 tok)
- `CLAUDE.md` — OpenWolf (~57 tok)
- `docker-compose.yaml` — Docker Compose services (~100 tok)
- `docker-compose.yml` — Docker Compose services (~400 tok)
- `LICENSE` — Project license (~286 tok)
- `package.json` — Node.js package manifest (~314 tok)
- `pnpm-lock.yaml` — pnpm lock file (~214640 tok)
- `pnpm-workspace.yaml` (~57 tok)
- `prettier.config.cjs` — Declares config (~253 tok)
- `README.md` — Project documentation (~2434 tok)
- `renovate.json` (~73 tok)
- `reset.d.ts` (~11 tok)
- `supabase_dump_20260412_180717.sql` — PostgreSQL database dump (~89944 tok)
- `tsconfig.json` — TypeScript configuration (~182 tok)
- `tsconfig.tsbuildinfo` (~4606 tok)
- `turbo.json` (~390 tok)
- `vitest.config.ts` — Vitest test configuration (~153 tok)

## .claude/

- `settings.json` (~441 tok)
- `settings.local.json` (~490 tok)

## .claude/rules/

- `openwolf.md` (~313 tok)

## .expo/

- `devices.json` (~6 tok)
- `README.md` — Project documentation (~188 tok)

## .github/

- `dependabot.yml` — Basic `dependabot.yml` file with (~170 tok)
- `FUNDING.yml` — These are supported funding model platforms (~20 tok)
- `pull_request_template.md` — Summary (~91 tok)

## .github/ISSUE_TEMPLATE/

- `bug_report.yml` (~354 tok)
- `BUG.md` — 🐞 Bug: {{title}} (~157 tok)
- `EPIC.md` — 🎯 Epic: {{title}} (~244 tok)
- `feature_request.yml` — This template is heavily inspired by the Next.js's template: (~353 tok)
- `FEATURE.md` — 🚀 Feature: {{title}} (~286 tok)
- `TASK.md` — 🛠 Task: {{title}} (~627 tok)

## .github/workflows/

- `ci.yml` — CI: CI (~478 tok)

## apps/expo/

- `app.config.ts` — Declares version (~583 tok)
- `babel.config.js` — Babel configuration (~45 tok)
- `CLAUDE.md` — OpenWolf (~57 tok)
- `eas.json` (~165 tok)
- `global.css` — Styles: 2 rules (~16 tok)
- `index.js` — This is the entry point for the Expo app. (~144 tok)
- `metro.config.js` — Learn more: https://docs.expo.dev/guides/monorepos/ (~428 tok)
- `nativewind-env.d.ts` — / <reference types="nativewind/types" /> (~13 tok)
- `package.json` — Node.js package manifest (~671 tok)
- `postcss.config.mjs` (~19 tok)
- `README.md` — Project documentation (~434 tok)
- `tailwind.config.cjs` (~51 tok)
- `tsconfig.json` — TypeScript configuration (~80 tok)

## apps/expo/.claude/

- `settings.json` (~441 tok)

## apps/expo/.claude/rules/

- `openwolf.md` (~313 tok)

## apps/expo/.expo-shared/

- `assets.json` (~45 tok)

## apps/expo/.expo/

- `devices.json` (~6 tok)
- `README.md` — Project documentation (~189 tok)

## apps/expo/app/

- `_layout.tsx` — ThemedStack — uses useEffect (~554 tok)
- `home.tsx` — Home — uses useQuery, useRouter, useState, useCallback (~944 tok)
- `index.tsx` — Index — uses useRouter, useRef, useCallback, useEffect (~1211 tok)
- `join.tsx` — PIN_LENGTH — uses useRouter, useCallback, useQuery, useEffect (~1335 tok)

## apps/expo/app/fissa/[pin]/

- `addTracks.tsx` — AddTracks — uses useRouter, useMutation, useCallback (~911 tok)
- `index.tsx` — Fissa (~1622 tok)
- `members.tsx` — Members — uses useRouter, useQuery (~378 tok)

## apps/expo/app/fissa/[pin]/[trackId]/

- `index.tsx` — AddToPlaylist — uses useRouter, useCallback (~512 tok)

## apps/expo/app/host/

- `fromPlaylist.tsx` — FromPlaylist — uses useCallback (~628 tok)
- `fromTracks.tsx` — FromTracks — uses useCallback (~158 tok)
- `index.tsx` — MAX_SEED_TRACKS — uses useState, useCallback (~590 tok)

## apps/expo/app/profile/

- `index.tsx` — Index — uses useRouter, useQuery, useCallback, useState (~1419 tok)

## apps/expo/assets/animations/

- `animation_blueey.json` (~35766 tok)
- `animation_greeny.json` (~35767 tok)
- `animation_limey.json` (~35684 tok)
- `animation_pinkey.json` (~35766 tok)
- `animation_sunny.json` (~35683 tok)
- `animation.json` (~35767 tok)

## apps/expo/expo-plugins/

- `with-modify-gradle.js` — @ts-check (~440 tok)

## apps/expo/src/components/

- `index.ts` (~34 tok)
- `PageTemplate.tsx` — Fullscreen means `max-w-screen-2xl` (1536px) (~286 tok)

## apps/expo/src/components/pages/fissa/

- `index.ts` (~38 tok)
- `ListEmptyComponent.tsx` — ListEmptyComponent — uses useMutation, useCallback (~646 tok)
- `ListFooterComponent.tsx` — ListFooterComponent (~142 tok)
- `Settings.tsx` — Settings (~1156 tok)
- `Tracks.tsx` — SCROLL_DISTANCE (~4762 tok)

## apps/expo/src/components/quickVote/

- `index.ts` (~30 tok)
- `QuickVoteContext.tsx` — QuickVoteContext — uses useState, useCallback, useMemo (~496 tok)
- `QuickVoteModal.tsx` — windowHeight — renders modal — uses useContext, useRef, useEffect, useMemo (~1317 tok)
- `useQuickVote.ts` — API routes: GET (1 endpoints) (~432 tok)

## apps/expo/src/components/shared/

- `Action.tsx` — Action (~708 tok)
- `Badge.tsx` — Badge — uses useRef, useEffect (~525 tok)
- `BottomDrawer.tsx` — BottomDrawer (~404 tok)
- `Divider.tsx` — Divider (~111 tok)
- `DraggableView.tsx` — After how many pixels of dragging should the view drag along (~342 tok)
- `EmptyState.tsx` — EmptyState (~284 tok)
- `Header.tsx` — Header — uses useRef, useRouter, useEffect (~562 tok)
- `Icon.tsx` — Icon (~260 tok)
- `Image.tsx` — Image (~247 tok)
- `index.ts` (~215 tok)
- `Input.tsx` — Input (~389 tok)
- `ListItem.tsx` — ListItem — uses useRef, useEffect (~1144 tok)
- `Logo.tsx` — AnimatedLottieView (~747 tok)
- `PickTracks.tsx` — PickTracks (~1902 tok)
- `PlaylistList.tsx` — PlaylistList (~466 tok)
- `PlaylistListItem.tsx` — PlaylistListItem (~200 tok)
- `Popover.tsx` — Popover — renders modal — uses useRef, useCallback, useEffect (~665 tok)
- `ProgressBar.tsx` — ProgressBar — uses useState, useEffect (~518 tok)
- `Rejoin.tsx` — Rejoin — uses useQuery (~257 tok)
- `SafeAreaView.tsx` — SafeAreaView (~188 tok)
- `SelectDevice.tsx` — SelectDevice — uses useState, useCallback (~1071 tok)
- `ToastContainer.tsx` — Emoji which is being shown (~492 tok)
- `TrackEnd.tsx` — TrackEnd (~136 tok)
- `TrackList.tsx` — TrackList — uses useCallback (~949 tok)
- `TrackListItem.tsx` — windowHeight — uses useRef, useCallback, useEffect (~646 tok)
- `Typography.tsx` — Typography (~386 tok)

## apps/expo/src/components/shared/button/

- `Button.tsx` — Button — uses useRouter, useMemo, useCallback (~834 tok)
- `ButtonGroup.tsx` — ButtonGroup (~63 tok)
- `Fab.tsx` — Fab — uses useRef, useRouter, useCallback, useEffect (~528 tok)
- `IconButton.tsx` — IconButton — uses useMemo (~322 tok)
- `index.ts` (~32 tok)

## apps/expo/src/hooks/

- `index.ts` (~86 tok)
- `useCreateFissa.ts` — Exports useCreateFissa (~322 tok)
- `useCreateVote.ts` — Exports useCreateVote (~561 tok)
- `useEncryptedStorage.ts` — Exports useEncryptedStorage, ENCRYPTED_STORAGE_KEYS (~327 tok)
- `useIsOwner.ts` — Exports useIsOwner (~96 tok)
- `useOnActiveApp.ts` — Exports useOnActiveApp (~109 tok)
- `useShareFissa.ts` — Exports useShareFissa (~201 tok)
- `useSkipTrack.ts` — Exports useSkipTrack (~241 tok)
- `useSpotifyQuery.ts` — TanStack Query hooks for Spotify API calls. (~907 tok)
- `useSwipe.ts` — Exports useSwipe (~425 tok)

## apps/expo/src/providers/

- `index.ts` (~31 tok)
- `NotificationProvider.tsx` — NotificationContext — uses useEffect, useMemo, useContext (~804 tok)
- `SpotifyProvider.tsx` — REFRESH_INTERVAL_MINUTES (~1656 tok)
- `ThemeProvider.tsx` — THEME_CACHE_KEY — uses useEffect, useContext (~377 tok)

## apps/expo/src/types/

- `nativewind.d.ts` — / <reference types="nativewind/types" /> (~13 tok)

## apps/expo/src/utils/

- `api.tsx` — A set of type-safe hooks for consuming your API. (~1088 tok)
- `index.ts` (~22 tok)
- `mappers.ts` — Exports mapDeviceToIcon, mapSpotifyTrackToTrpcTrack (~195 tok)
- `nativewind-interop.ts` — Register third-party components with NativeWind v5 (~107 tok)
- `sqlite-storage.ts` — A simple key-value storage adapter backed by expo-sqlite. (~1478 tok)
- `Toast.ts` — Declares ToasterProps (~306 tok)

## apps/server/

- `build.mjs` — Declares require (~184 tok)
- `Dockerfile` — Docker container definition (~424 tok)
- `package.json` — Node.js package manifest (~242 tok)
- `tsconfig.json` — TypeScript configuration (~76 tok)
- `tsconfig.tsbuildinfo` (~71970 tok)

## apps/server/src/

- `index.ts` — API routes: GET (1 endpoints) (~674 tok)
- `instrument.ts` (~51 tok)

## apps/web/

- `Dockerfile` — Docker container definition (~352 tok)
- `index.html` — Fissa (~120 tok)
- `package.json` — Node.js package manifest (~452 tok)
- `postcss.config.cjs` — PostCSS configuration (~20 tok)
- `tailwind.config.cjs` — Declares config (~210 tok)
- `tsconfig.json` — TypeScript configuration (~203 tok)
- `tsconfig.tsbuildinfo` (~76119 tok)
- `vite.config.ts` — Vite build configuration (~96 tok)
- `vitest.config.ts` — Vitest test configuration (~212 tok)

## apps/web/src/

- `instrument.ts` (~93 tok)
- `main.tsx` — router (~162 tok)
- `routeTree.gen.ts` — @ts-nocheck (~614 tok)

## apps/web/src/components/

- `AppDemo.tsx` — AppDemo (~71 tok)
- `AppScreen.tsx` — AppScreen (~474 tok)
- `AppStoreLink.tsx` — AppStoreLink (~155 tok)
- `Button.tsx` — baseStyles (~531 tok)
- `CircleBackground.tsx` — CircleBackground (~274 tok)
- `Container.tsx` — Container (~107 tok)
- `CurrentlyPlayingTrack.test.tsx` — Tests for CurrentlyPlayingTrack component (Task #59) (~514 tok)
- `CurrentlyPlayingTrack.tsx` — Renders the currently playing track with artwork, track ID, and a progress bar. (~354 tok)
- `Faqs.tsx` — faqs (~1094 tok)
- `FissaCode.tsx` — FissaCode — uses useState, useQuery, useMemo, useCallback (~1069 tok)
- `Footer.tsx` — Footer (~528 tok)
- `Header.tsx` — MobileNavLink (~1063 tok)
- `Hero.tsx` — BackgroundIllustration (~930 tok)
- `JoinAFissa.tsx` — JoinAFissa — uses useQuery, useMemo (~386 tok)
- `Layout.tsx` — Layout (~90 tok)
- `Logo.tsx` — Logomark (~1816 tok)
- `NavLinks.tsx` — links (~424 tok)
- `PhoneFrame.tsx` — PlaceholderFrame (~793 tok)
- `PlayStoreLink.tsx` — PlayStoreLink (~166 tok)
- `PrimaryFeatures.tsx` — MotionAppScreenBody — uses useEffect, useState (~5180 tok)
- `QueueTrackList.test.tsx` — Tests for QueueTrackList component (Task #61) (~1244 tok)
- `QueueTrackList.tsx` — Renders the upcoming tracks queue sorted by totalScore descending. (~519 tok)
- `SecondaryFeatures.tsx` — features — renders chart (~2303 tok)
- `SpotifySignInButton.test.tsx` — Tests for SpotifySignInButton component (Task #63) (~818 tok)
- `Toast.tsx` — AUTO_CLOSE_TIME_MS (~298 tok)
- `TrackList.tsx` — TrackList (~1214 tok)

## apps/web/src/providers/

- `ThemeProvider.tsx` — ThemeContext — uses useContext (~134 tok)

## apps/web/src/routes/

- `__root.tsx` — queryClient (~218 tok)
- `index.tsx` — Route (~148 tok)

## apps/web/src/routes/fissa/

- `$pin.test.tsx` — Tests for /fissa/$pin page (Task #57, #58) (~10976 tok)
- `$pin.tsx` — Route (~1696 tok)

## apps/web/src/styles/

- `globals.css` — Styles: 3 rules (~17 tok)

## apps/web/src/test/

- `setup.ts` (~11 tok)

## apps/web/src/utils/

- `api.ts` — Exports api, trpcClient, RouterInputs, RouterOutputs (~263 tok)

## docs/steering/

- `DESIGN.md` — Fissa Design Guidelines (~2235 tok)
- `QA.md` — Fissa QA Standards (~1204 tok)
- `TECH.md` — Fissa Technical Guidelines (~1582 tok)
- `VISION.md` — Fissa Vision (~749 tok)

## packages/api/

- `client.ts` — Safe client-side entry for React Native / Expo. (~49 tok)
- `index.ts` — Declares AppRouter (~60 tok)
- `package.json` — Node.js package manifest (~209 tok)
- `transformer.ts` — Exports transformer (~22 tok)
- `tsconfig.json` — TypeScript configuration (~59 tok)
- `tsconfig.tsbuildinfo` (~62767 tok)

## packages/api/src/

- `container.ts` — Wires up the full service graph from a tRPC context. (~511 tok)
- `root.ts` — tRPC router (~124 tok)
- `trpc.ts` — API routes: GET (1 endpoints) (~384 tok)

## packages/api/src/infrastructure/

- `SpotifyService.ts` — Exports SpotifyService (~1126 tok)

## packages/api/src/interfaces/

- `IBadgeRepository.ts` — Exports Badge, IBadgeRepository (~90 tok)
- `IBadgeService.ts` — Exports IBadgeService (~81 tok)
- `IFissaRepository.ts` — Exports FissaWithRelations, FissaDetailedForSync, FissaOwnerAccount, ActiveFissa, IFissaRepository (~411 tok)
- `index.ts` (~178 tok)
- `ISpotifyService.ts` — Exports SpotifyTokenResponse, ISpotifyService (~224 tok)
- `ITrackRepository.ts` — Exports InsertTrackInput, ITrackRepository (~102 tok)
- `IUserRepository.ts` — Exports User, Session, Account, UserWithSessions + 4 more (~454 tok)
- `IVoteRepository.ts` — Exports Vote, IVoteRepository (~128 tok)

## packages/api/src/orchestration/

- `FissaSyncOrchestrator.ts` — Orchestrates background sync loops for active fissas. (~1102 tok)

## packages/api/src/repository/

- `BadgeRepository.ts` — Exports BadgeRepository (~244 tok)
- `FissaRepository.ts` — Exports FissaRepository (~1175 tok)
- `index.ts` (~75 tok)
- `TrackRepository.ts` — Exports TrackRepository (~224 tok)
- `UserRepository.ts` — Exports UserRepository (~1216 tok)
- `VoteRepository.ts` — Exports VoteRepository (~298 tok)

## packages/api/src/router/

- `auth.ts` — tRPC router: 5 procedures (~337 tok)
- `constants.ts` — Zod schemas: Z_TRACK_ID, Z_PIN (~72 tok)
- `fissa.ts` — tRPC router: 10 procedures (~501 tok)
- `track.ts` — tRPC router: 3 procedures (~253 tok)
- `vote.ts` — tRPC router: 5 procedures (~388 tok)

## packages/api/src/service/

- `AuthService.ts` — Exports AuthService (~815 tok)
- `BadgeService.ts` — Exports BadgeService (~904 tok)
- `FissaService.ts` — Zustand store (~2765 tok)
- `TrackService.ts` — Exports TrackService (~304 tok)
- `VoteService.ts` — Exports VoteService (~981 tok)

## packages/api/src/utils/

- `context.ts` — Exports CreateContextOptions, createContextInner, createContext, Context (~216 tok)
- `EarnedPoints.ts` — Exports EarnedPoints (~50 tok)

## packages/auth/

- `index.ts` — Exports Session (~66 tok)
- `package.json` — Node.js package manifest (~139 tok)
- `tsconfig.json` — TypeScript configuration (~44 tok)
- `tsconfig.tsbuildinfo` (~50056 tok)

## packages/auth/src/

- `auth.ts` — Exports auth (~229 tok)
- `get-session.ts` — Exports getSession (~115 tok)

## packages/config/eslint/

- `index.js` — Declares config (~269 tok)
- `package.json` — Node.js package manifest (~137 tok)

## packages/config/tailwind/

- `index.d.ts` — Exports Theme, Theme, themes, extrodonary, getThemeForUser (~190 tok)
- `index.js` — Declares pinkey (~359 tok)
- `package.json` — Node.js package manifest (~118 tok)
- `postcss.js` (~24 tok)
- `themes.ts` — Deterministically select a theme based on a user ID string. (~470 tok)

## packages/db/

- `drizzle.config.ts` — Drizzle ORM configuration (~61 tok)
- `index.ts` — Run all pending Drizzle migrations. (~931 tok)
- `package.json` — Node.js package manifest (~192 tok)
- `schema.ts` — Enum constant matching the `badgeType` pgEnum values. (~2367 tok)
- `tsconfig.json` — TypeScript configuration (~43 tok)
- `tsconfig.tsbuildinfo` (~17982 tok)

## packages/db/drizzle/

- `0000_initial.sql` — Squashed initial migration (idempotent) (~1752 tok)

## packages/db/drizzle/meta/

- `_journal.json` (~58 tok)
- `0000_snapshot.json` (~5591 tok)

## packages/env/

- `client.ts` — Exports env (~104 tok)
- `index.ts` — Exports env (~179 tok)
- `package.json` — Node.js package manifest (~163 tok)
- `tsconfig.json` — TypeScript configuration (~47 tok)
- `tsconfig.tsbuildinfo` (~7330 tok)

## packages/test/

- `package.json` — Node.js package manifest (~103 tok)
- `tsconfig.json` — TypeScript configuration (~20 tok)

## packages/test/src/

- `index.ts` (~24 tok)

## packages/utils/

- `array.test.ts` — Declares SortableTrack (~909 tok)
- `array.ts` — Exports splitInChunks, SortableTrack, sortFissaTracksOrder, randomSort, biasSort (~668 tok)
- `date.ts` (~8 tok)
- `hooks.ts` (~9 tok)
- `index.ts` (~117 tok)
- `number.ts` — Exports formatNumber (~38 tok)
- `package.json` — Node.js package manifest (~171 tok)
- `setupTests.ts` (~29 tok)
- `sleep.ts` — Exports sleep (~26 tok)
- `spotify.ts` — When you'd like to update a state while fetching tracks (~1017 tok)
- `tsconfig.json` — TypeScript configuration (~32 tok)
- `uuid.ts` (~11 tok)

## packages/utils/classes/

- `Error.ts` — Exports NotTheHost, FissaIsPaused, NotAbleToAccessSpotify, NoNextTrack + 4 more (~380 tok)
- `index.ts` (~15 tok)
- `Toaster.ts` — Exports Toaster, ToasterProps (~308 tok)

## packages/utils/services/

- `index.ts` (~0 tok)
- `SpotifyService.ts` — Exports SpotifyService (~770 tok)

## packages/utils/stores/

- `index.ts` (~10 tok)
- `spotifyStore.ts` — Minimal Zustand store — only holds the SpotifyWebApi client instance. (~114 tok)

## packages/utils/types/

- `AnimationSpeed.ts` — Exports AnimationSpeed (~36 tok)
- `index.ts` (~10 tok)

## volumes/db/

- `pg_hba.conf` — PostgreSQL Client Authentication Configuration File (~1312 tok)
- `pg_ident.conf` — PostgreSQL User Name Maps (~437 tok)
- `PG_VERSION` (~1 tok)
- `postgresql.auto.conf` — Do not edit this file manually! (~24 tok)
- `postgresql.conf` — PostgreSQL configuration file (~7872 tok)
- `postmaster.opts` (~10 tok)
- `postmaster.pid` (~26 tok)

## volumes/db/base/1/

- `112` (~2185 tok)
- `113` (~2185 tok)
- `1247` (~32742 tok)
- `1247_fsm` (~6554 tok)
- `1247_vm` (~2185 tok)
- `1249` (~122259 tok)
- `1249_fsm` (~6554 tok)
- `1249_vm` (~2185 tok)
- `1255` (~209576 tok)
- `1255_fsm` (~6554 tok)
- `1255_vm` (~2185 tok)
- `1259` (~30573 tok)
- `1259_fsm` (~6554 tok)
- `1259_vm` (~2185 tok)
- `13457` — Declares YES (~17443 tok)
- `13457_fsm` (~6554 tok)
- `13457_vm` (~2185 tok)
- `13460` (~0 tok)
- `13461` (~2185 tok)
- `13462` (~2184 tok)
- `13462_fsm` (~6554 tok)
- `13462_vm` (~2185 tok)
- `13465` (~0 tok)
- `13466` (~2185 tok)
- `13467` (~2185 tok)
- `13467_fsm` (~6554 tok)
- `13467_vm` (~2185 tok)
- `13470` (~0 tok)
- `13471` (~2185 tok)
- `13472` (~2184 tok)
- `13472_fsm` (~6554 tok)
- `13472_vm` (~2185 tok)
- `13475` (~0 tok)
- `13476` (~2185 tok)
- `1417` (~0 tok)
- `1418` (~0 tok)
- `174` (~2185 tok)
- `175` (~2185 tok)
- `2187` (~2185 tok)
- `2224` (~0 tok)
- `2228` (~4369 tok)
- `2328` (~0 tok)
- `2336` (~0 tok)
- `2337` (~2185 tok)
- `2579` (~4366 tok)
- `2600` (~4364 tok)
- `2600_fsm` (~6554 tok)
- `2600_vm` (~2185 tok)
- `2601` (~2185 tok)
- `2601_fsm` (~6554 tok)
- `2601_vm` (~2185 tok)
- `2602` (~15255 tok)
- `2602_fsm` (~6554 tok)
- `2602_vm` (~2185 tok)
- `2603` (~10905 tok)
- `2603_fsm` (~6554 tok)
- `2603_vm` (~2185 tok)
- `2604` (~0 tok)
- `2605` (~4363 tok)
- `2605_fsm` (~6554 tok)
- `2605_vm` (~2185 tok)
- `2606` (~6549 tok)
- `2606_fsm` (~6554 tok)
- `2606_vm` (~2185 tok)
- `2607` (~4365 tok)
- `2607_fsm` (~6554 tok)
- `2607_vm` (~2185 tok)
- `2608` (~30512 tok)
- `2608_fsm` (~6554 tok)
- `2608_vm` (~2185 tok)
- `2609` (~98088 tok)
- `2609_fsm` (~6554 tok)
- `2609_vm` (~2185 tok)
- `2610` (~8735 tok)
- `2610_fsm` (~6554 tok)
- `2610_vm` (~2185 tok)
- `2611` (~0 tok)
- `2612` (~2185 tok)
- `2612_fsm` (~6554 tok)
- `2612_vm` (~2185 tok)
- `2613` (~0 tok)
- `2615` (~2185 tok)
- `2615_fsm` (~6554 tok)
- `2615_vm` (~2185 tok)
- `2616` (~6547 tok)
- `2616_fsm` (~6554 tok)
- `2616_vm` (~2185 tok)
- `2617` (~30551 tok)
- `2617_fsm` (~6554 tok)
- `2617_vm` (~2185 tok)
- `2618` — Declares 16 (~30529 tok)
- `2618_fsm` (~6554 tok)
- `2618_vm` (~2185 tok)
- `2619` — Declares 16 (~52327 tok)
- `2619_fsm` (~6554 tok)
- `2619_vm` (~2185 tok)
- `2620` (~0 tok)
- `2650` (~4364 tok)
- `2651` (~4369 tok)
- `2652` (~4369 tok)
- `2653` (~13070 tok)
- `2654` (~13070 tok)
- `2655` (~10894 tok)
- `2656` (~2185 tok)
- `2657` (~2185 tok)
- `2658` (~32651 tok)
- `2659` (~23944 tok)
- `2660` (~4362 tok)
- `2661` (~4362 tok)
- `2662` (~8724 tok)
- `2663` (~10903 tok)
- `2664` (~4365 tok)
- `2665` (~4364 tok)
- `2666` (~4366 tok)
- `2667` (~4366 tok)
- `2668` (~4364 tok)
- `2669` (~4364 tok)
- `2670` (~4365 tok)
- `2673` (~21792 tok)
- `2674` (~17452 tok)
- `2675` (~60956 tok)
- `2678` (~4365 tok)
- `2679` (~4364 tok)
- `2680` (~2185 tok)
- `2681` (~4369 tok)
- `2682` (~4369 tok)
- `2683` (~2185 tok)
- `2684` (~4369 tok)
- `2685` (~4369 tok)
- `2686` (~4361 tok)
- `2687` (~4363 tok)
- `2688` (~10899 tok)
- `2689` (~13075 tok)
- `2690` (~23938 tok)
- `2691` (~67575 tok)
- `2692` (~4365 tok)
- `2693` (~4363 tok)
- `2696` (~10907 tok)
- `2699` (~2185 tok)
- `2701` (~2185 tok)
- `2702` (~2185 tok)
- `2703` (~8719 tok)
- `2704` (~10896 tok)
- `2753` (~4364 tok)
- `2753_fsm` (~6554 tok)
- `2753_vm` (~2185 tok)
- `2754` (~4362 tok)
- `2755` (~4364 tok)
- `2756` (~10894 tok)
- `2757` (~8718 tok)
- `2830` (~0 tok)
- `2831` (~2185 tok)
- `2832` (~0 tok)
- `2833` (~2185 tok)
- `2834` (~0 tok)
- `2835` (~2185 tok)
- `2836` (~2175 tok)
- `2836_fsm` (~6554 tok)
- `2836_vm` (~2185 tok)
- `2837` (~4369 tok)
- `2838` (~139291 tok)
- `2838_fsm` (~6554 tok)
- `2838_vm` (~2185 tok)
- `2839` (~4360 tok)
- `2840` (~8720 tok)
- `2840_fsm` (~6554 tok)
- `2840_vm` (~2185 tok)
- `2841` (~4368 tok)
- `2995` (~0 tok)
- `2996` (~2185 tok)
- `3079` (~2185 tok)
- `3079_fsm` (~6554 tok)
- `3079_vm` (~2185 tok)
- `3080` (~4369 tok)
- `3081` (~4369 tok)
- `3085` (~10897 tok)
- `3118` (~0 tok)
- `3119` (~2185 tok)
- `3164` (~15252 tok)
- `3256` (~0 tok)
- `3257` (~2185 tok)
- `3258` (~2185 tok)
- `3350` (~0 tok)
- `3351` (~2185 tok)
- `3379` (~2185 tok)
- `3380` (~2185 tok)
- `3381` (~0 tok)
- `3394` (~6542 tok)
- `3394_fsm` (~6554 tok)
- `3394_vm` (~2185 tok)
- `3395` (~4361 tok)
- `3429` (~0 tok)
- `3430` (~0 tok)
- `3431` (~2185 tok)
- `3433` (~2185 tok)
- `3439` (~0 tok)
- `3440` (~2185 tok)
- `3455` (~4355 tok)
- `3456` (~34916 tok)
- `3456_fsm` (~6554 tok)
- `3456_vm` (~2185 tok)
- `3466` (~0 tok)
- `3467` (~2185 tok)
- `3468` (~2185 tok)
- `3501` (~0 tok)
- `3502` (~2185 tok)
- `3503` (~2185 tok)
- `3534` (~2185 tok)
- `3541` (~2184 tok)
- `3541_fsm` (~6554 tok)
- `3541_vm` (~2185 tok)
- `3542` (~4369 tok)
- `3574` (~2185 tok)
- `3575` (~2185 tok)
- `3576` (~0 tok)
- `3596` (~0 tok)
- `3597` (~2185 tok)
- `3598` (~0 tok)
- `3599` (~2185 tok)
- `3600` (~2184 tok)
