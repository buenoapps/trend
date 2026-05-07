# Working in this repo

## Workflow

- One change → one fresh branch → one PR against `main`. Don't stack PRs on feature branches.
- Branch naming: `claude/<short-topic>-<session-suffix>` (e.g. `claude/today-bugs-22UF5`).
- Always rebase off the latest `origin/main` before starting work.
- Never force-push `main`. Don't merge your own PRs.

## Verification

Run all four locally before pushing — CI (`.github/workflows/ci.yml`) runs the same on every push to `main` and PR against `main`:

```bash
npm run lint
npx tsc --noEmit
npm test -- --ci
npx expo export --platform web
```

Tests live next to source in `__tests__/` directories. Use `jest-expo` (already preset in `jest.config.js`) and `@testing-library/react-native`.

## Architecture

**Routing.** `expo-router` file-based. Tabs in `app/(tabs)/`, root stack in `app/_layout.tsx`. The tabs layout has no header.

**Shared state.** `lib/hooks.ts` exposes shared stores via `useSyncExternalStore` over a module-level pub/sub — one store per concern (`useEntries`, `useSettings`). Do not put this kind of state in a `useState` inside a screen: it won't sync across tabs. Add a new store the same way (cache + listener Set + `notify()` + `subscribe()` + `useSyncExternalStore`); export a setter directly when non-component code needs to push to it (e.g. notification handlers).

**Persistence.** `lib/storage.ts` wraps `@react-native-async-storage/async-storage`. Keys: `trend:entries:v1`, `trend:settings:v1`. `lib/hooks.ts` is the only consumer — UI never touches storage directly.

**Date keys.** A `DateKey` is a `'YYYY-MM-DD'` string in the device's local timezone. Use `todayKey()`, `addDays()`, `compareKey()`, `formatLong()` from `lib/dates.ts` — don't construct ad-hoc `Date` objects in UI.

**Units.** `lib/units.ts` is the single source of truth. `formatWeight(kg, unit, { withUnit: false })` for input fields; `parseWeightInput(text, unit)` for user input — never multiply/divide kg/lb inline.

**Notifications.** `lib/notifications.ts` wraps `expo-notifications`. Web is no-op. The root layout (`app/_layout.tsx`) registers `addNotificationResponseReceivedListener` + handles cold-start via `getLastNotificationResponseAsync()`.

## Conventions

- TypeScript strict; no `any` casts, no `// @ts-ignore`.
- ESLint via `expo lint` — fix locally, don't disable rules.
- No emojis in source or commit messages unless asked. Trend uses arrow glyphs (`▲` / `▼`) for deltas — leave those alone.
- Comments only when the *why* is non-obvious. No "what" comments.
- Don't create new `*.md` files unless the user asks for them.

## Useful files

- `app/(tabs)/index.tsx` — Today screen with day stepper.
- `app/(tabs)/history.tsx` — Trend (chart) screen.
- `app/(tabs)/settings.tsx` — kg/lb, reminder, export/import.
- `components/weight-entry-form.tsx` — controlled input, prefills from `initialKg`.
- `components/weight-chart.tsx` — `react-native-gifted-charts` LineChart wrapper.
- `lib/hooks.ts` — shared stores; `__resetHooksForTest()` exported for jest.
- `lib/serialize.ts` / `lib/share.ts` — JSON export/import payload + file picker glue.
