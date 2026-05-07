# Trend

A small weight-tracking app built on Expo. Log a weight per day, watch the curve, and pick the unit that feels right.

## Tabs

- **Today** — log or update today's weight (or step the date back to backfill a missed day). Sprout mascot reacts to whether you've logged.
- **Trend** — line chart of every entry over time, with a delta-since-last-entry summary.
- **Settings** — kg ↔ lb toggle, daily reminder notification, export/import the local store as JSON.

Data lives in `AsyncStorage` on-device; nothing is sent over the network.

## Running locally

```bash
npm install
npx expo start
```

From the Expo CLI menu, open the app on iOS Simulator, Android Emulator, Expo Go, or `w` for the web preview.

## Checks

The same four commands run in CI on every PR and push to `main` (see `.github/workflows/ci.yml`):

```bash
npm run lint           # expo lint
npx tsc --noEmit       # type-check
npm test               # jest (jest-expo preset)
npx expo export --platform web   # production web bundle
```

## Project layout

```
app/                  expo-router file-based routes
  (tabs)/
    index.tsx         Today screen
    history.tsx       Trend (chart) screen
    settings.tsx      Settings screen
  _layout.tsx         Root stack + notification deep-link
components/           UI primitives (chart, form, mascot, themed text/view)
lib/
  hooks.ts            useSyncExternalStore-backed shared stores
  storage.ts          AsyncStorage persistence
  dates.ts            DateKey ('YYYY-MM-DD') helpers
  units.ts            kg ↔ lb conversion + parsing
  notifications.ts    expo-notifications wrapper
  serialize.ts        export/import payload shape
  share.ts            file picker + share-sheet glue
constants/, hooks/    theme + color-scheme helpers
.github/workflows/    CI workflow
```

## Built with

Expo 54, React 19, expo-router 6, `react-native-gifted-charts`, `@react-native-async-storage/async-storage`, jest-expo.
