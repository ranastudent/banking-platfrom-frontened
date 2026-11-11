# Banking Platform Frontend — Phase 1 + Phase 2

This ZIP contains the user's Phase 1 project scaffold with Phase 2 design foundation and reusable components applied.

## Requirements
- Node.js 22 LTS recommended
- npm 10+
- VS Code

## Install / update dependencies
```cmd
npm install
```
No new third-party packages were added for Phase 2; Dialog, Dropdown and Tooltip use accessible React/browser primitives. `npm install` refreshes the lockfile if required.

## Environment
Create `.env` from `.env.example`:
```cmd
copy .env.example .env
```
Keep `.env` local and never commit it.

## Run
```cmd
npm run dev
```
Open `http://localhost:5173`.

## Verify
```cmd
npm run typecheck
npm run build
npm run preview
```

## Phase 2 contents
- 2.1 Tailwind v4 semantic design tokens and CSS variables
- 2.2 Light theme
- 2.3 Dark theme
- 2.4 ThemeProvider, localStorage persistence and theme toggle
- 2.5 Typography scale and global styling
- 2.6 Button variants and sizes
- 2.7 Input and FormField components with hint/error states
- 2.8 Card, CardHeader, CardTitle, CardDescription, CardContent and CardFooter
- 2.9 Badge and StatusBadge
- 2.10 Native accessible Dialog, Dropdown and Tooltip
- 2.11 Component showcase for visual/manual testing

The showcase uses clearly labeled illustrative data only. It is not connected to the banking API and does not perform banking operations.
