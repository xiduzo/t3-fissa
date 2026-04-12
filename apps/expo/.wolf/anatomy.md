# anatomy.md

> Auto-maintained by OpenWolf. Last scanned: 2026-04-12T12:06:46.530Z
> Files: 100 tracked | Anatomy hits: 0 | Misses: 0

## ./

- `app.config.ts` — Declares version (~494 tok)
- `babel.config.js` — Babel configuration (~45 tok)
- `CLAUDE.md` — OpenWolf (~57 tok)
- `eas.json` (~165 tok)
- `global.css` — Styles: 2 rules (~16 tok)
- `index.js` — This is the entry point for the Expo app. (~144 tok)
- `metro.config.js` — Learn more: https://docs.expo.dev/guides/monorepos/ (~428 tok)
- `nativewind-env.d.ts` — / <reference types="nativewind/types" /> (~13 tok)
- `package.json` — Node.js package manifest (~671 tok)
- `postcss.config.mjs` (~19 tok)
- `tailwind.config.cjs` (~51 tok)
- `tsconfig.json` — TypeScript configuration (~80 tok)

## .claude/

- `settings.json` (~441 tok)

## .claude/rules/

- `openwolf.md` (~313 tok)

## .expo-shared/

- `assets.json` (~45 tok)

## .expo/

- `devices.json` (~6 tok)
- `README.md` — Project documentation (~189 tok)

## app/

- `_layout.tsx` — ThemedStack — uses useEffect (~512 tok)
- `._layout.tsx.swp` — update: updateAsync (~3277 tok)
- `home.tsx` — Home — uses useQuery, useRouter, useState, useCallback (~944 tok)
- `index.tsx` — Index — uses useRouter, useRef, useCallback, useEffect (~1211 tok)
- `join.tsx` — PIN_LENGTH — uses useRouter, useCallback, useQuery, useEffect (~1335 tok)

## app/fissa/[pin]/

- `addTracks.tsx` — AddTracks — uses useRouter, useMutation, useCallback (~911 tok)
- `index.tsx` — Fissa (~1622 tok)
- `members.tsx` — Members — uses useRouter, useQuery (~378 tok)

## app/fissa/[pin]/[trackId]/

- `index.tsx` — AddToPlaylist — uses useRouter, useCallback (~512 tok)

## app/host/

- `fromPlaylist.tsx` — FromPlaylist — uses useCallback (~628 tok)
- `fromTracks.tsx` — FromTracks — uses useCallback (~158 tok)
- `index.tsx` — MAX_SEED_TRACKS — uses useState, useCallback (~590 tok)

## app/profile/

- `index.tsx` — Index — uses useRouter, useQuery, useCallback, useState (~1419 tok)

## assets/animations/

- `animation_blueey.json` (~35766 tok)
- `animation_greeny.json` (~35767 tok)
- `animation_limey.json` (~35684 tok)
- `animation_pinkey.json` (~35766 tok)
- `animation_sunny.json` (~35683 tok)
- `animation.json` (~35767 tok)

## expo-plugins/

- `with-modify-gradle.js` — @ts-check (~440 tok)

## src/components/

- `index.ts` (~34 tok)
- `PageTemplate.tsx` — Fullscreen means `max-w-screen-2xl` (1536px) (~286 tok)

## src/components/pages/fissa/

- `index.ts` (~38 tok)
- `ListEmptyComponent.tsx` — ListEmptyComponent — uses useMutation, useCallback (~646 tok)
- `ListFooterComponent.tsx` — ListFooterComponent (~142 tok)
- `Settings.tsx` — Settings (~1156 tok)
- `Tracks.tsx` — SCROLL_DISTANCE (~4204 tok)

## src/components/quickVote/

- `index.ts` (~30 tok)
- `QuickVoteContext.tsx` — QuickVoteContext — uses useState, useCallback, useMemo (~496 tok)
- `QuickVoteModal.tsx` — windowHeight — renders modal — uses useContext, useRef, useEffect, useMemo (~1317 tok)
- `useQuickVote.ts` — API routes: GET (1 endpoints) (~432 tok)

## src/components/shared/

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

## src/components/shared/button/

- `Button.tsx` — Button — uses useRouter, useMemo, useCallback (~834 tok)
- `ButtonGroup.tsx` — ButtonGroup (~63 tok)
- `Fab.tsx` — Fab — uses useRef, useRouter, useCallback, useEffect (~528 tok)
- `IconButton.tsx` — IconButton — uses useMemo (~322 tok)
- `index.ts` (~32 tok)

## src/hooks/

- `index.ts` (~86 tok)
- `useCreateFissa.ts` — Exports useCreateFissa (~322 tok)
- `useCreateVote.ts` — Exports useCreateVote (~561 tok)
- `useEncryptedStorage.ts` — Exports useEncryptedStorage, ENCRYPTED_STORAGE_KEYS (~327 tok)
- `useIsOwner.ts` — Exports useIsOwner (~96 tok)
- `useOnActiveApp.ts` — Exports useOnActiveApp (~109 tok)
- `useShareFissa.ts` — Exports useShareFissa (~214 tok)
- `useSkipTrack.ts` — Exports useSkipTrack (~241 tok)
- `useSpotifyQuery.ts` — TanStack Query hooks for Spotify API calls. (~907 tok)
- `useSwipe.ts` — Exports useSwipe (~425 tok)

## src/providers/

- `index.ts` (~31 tok)
- `NotificationProvider.tsx` — NotificationContext — uses useEffect, useMemo, useContext (~804 tok)
- `SpotifyProvider.tsx` — REFRESH_INTERVAL_MINUTES (~1656 tok)
- `ThemeProvider.tsx` — THEME_CACHE_KEY — uses useEffect, useContext (~377 tok)

## src/types/

- `nativewind.d.ts` — / <reference types="nativewind/types" /> (~13 tok)

## src/utils/

- `api.tsx` — A set of type-safe hooks for consuming your API. (~913 tok)
- `index.ts` (~22 tok)
- `mappers.ts` — Exports mapDeviceToIcon, mapSpotifyTrackToTrpcTrack (~195 tok)
- `nativewind-interop.ts` — Register third-party components with NativeWind v5 (~107 tok)
- `sqlite-storage.ts` — A simple key-value storage adapter backed by expo-sqlite. (~1478 tok)
- `Toast.ts` — Declares ToasterProps (~306 tok)
