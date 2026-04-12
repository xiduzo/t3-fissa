# Fissa — Expo App

## Development

```bash
# Start on iOS simulator
pnpm dev:ios

# Start on Android emulator
pnpm dev:android
```

## EAS Commands

### Build

```bash
# Development build (internal distribution)
eas build --profile development --platform ios
eas build --profile development --platform android

# Preview build (iOS simulator)
eas build --profile preview --platform ios

# Production build
eas build --profile production --platform ios
eas build --profile production --platform android

# Build both platforms at once
eas build --profile production --platform all

# Local build (no EAS servers)
eas build --platform ios --local
```

### Update (OTA)

```bash
# Push an update to a channel
eas update --channel production --message "describe the change"
eas update --channel development --message "describe the change"
eas update --channel preview --message "describe the change"

# List recent updates
eas update:list
```

### Submit to stores

```bash
# Submit latest iOS build to App Store Connect
eas submit --platform ios --latest

# Submit latest Android build to Google Play
eas submit --platform android --latest
```

### Useful flags

| Flag | Description |
|---|---|
| `--platform ios\|android\|all` | Target platform |
| `--profile <name>` | Build profile (`development`, `preview`, `production`) |
| `--local` | Run the build on your machine instead of EAS servers |
| `--non-interactive` | Skip prompts (useful in CI) |
| `--clear-cache` | Clear EAS build cache |
| `--message "..."` | Attach a message to an update |

### Other

```bash
# Check build status
eas build:list

# View project config
eas config

# Log in to your Expo account
eas login

# View available devices (ad hoc)
eas device:list
```
