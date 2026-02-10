# CorporatePay User (Vite + React + TypeScript + MUI + Tailwind)

This is a **plug-and-play** frontend project containing the **attached CorporatePay_User screens** wired into a simple, responsive navigation shell.

## Quick start

```bash
npm install
npm run dev
```

## Navigation

- Use the **left drawer** (desktop) or **hamburger menu** (mobile/tablet) to switch between screens.
- Default route opens **U25 (App Shell / Wired)**.

## Project structure

- `src/pages/screens/` — the attached screens (ported to **.tsx**)
- `src/pages/registry.ts` — screen registry (routes + grouping)
- `src/layout/AppLayout.tsx` — responsive drawer navigation
- `src/theme/` — EVzone theme tokens (MUI) and shared colors

## Notes

- This is a **frontend shell** (no backend wiring yet).
- Tailwind utilities and MUI are configured to work together via `StyledEngineProvider`.
