# ARCHITECTURE.md — how this codebase is organized

Last reviewed: 2026-10-06. Agents: update this file whenever structure, data model, or decisions change.

## Stack
React 18 + TypeScript (strict) + Vite 5 + Tailwind 3 + Supabase (Postgres, Auth, RLS) + Recharts + lucide-react. PWA via `public/sw.js` and `public/manifest.json`.

## Folder map
```
src/
  main.tsx            App entry
  App.tsx             Top-level flow + hash-based navigation (no router library)
  globals.css         CSS variables, .font-serif, .ledger-card, .ledger-row
  context/
    AuthContext.tsx   Session, user, store; sign in/up/out; local mock mode for dev
  views/              One file per screen
    LandingView       Public marketing page (685 lines, needs splitting)
    AuthView          Login / signup
    OnboardingView    First-time store setup (demo catalog or empty)
    SellView          Register: product grid, cart, checkout
    InventoryView     Product list, add/edit, restock
    SalesView         Sales history, refunds, voids
    AuditView         Stock movement / activity log
    AnalyticsView     Charts and metrics
  components/
    common/           BottomSheet, ConfirmModal, FilterSheet, ListRow, ListSkeleton, ProductAvatar, ImagePlaceholder
    navigation/       Navbar (also exports Sidebar), AgoraLogo
    pos/              ProductTile, CartDrawer, CheckoutModal
    inventory/        AddEditProductModal, RestockModal
    sales/            SaleDetailModal, VoidSaleModal
    reports/          RegisterClosureModal
    analytics/        DrilldownModal
    settings/         SettingsModal
  services/           Data access layer (common, products, sales, movements, settings, register, analytics, api facade)
  lib/supabase.ts     Supabase client + isSupabaseConfigured()
  lib/seed.ts         Demo catalog products
  types/              index.ts (app types), supabase.ts (DB types)
  utils/              currency.ts, formatters.ts, revenue.ts
  utils/__tests__/    Vitest unit tests for currency.ts and revenue.ts
supabase/schema.sql   Tables, RLS policies, and RPC functions (run in Supabase SQL editor)
public/               sw.js, manifest.json, icons
```

## Tooling
- `eslint.config.js` — flat config: `@eslint/js` + `typescript-eslint` recommended, React hooks and React Refresh rules. `no-undef` is off because TypeScript resolves identifiers.
- `.prettierrc` / `.prettierignore` — 2 spaces, single quotes, semicolons, 100 char width. Markdown is ignored so docs keep their own formatting.
- `vitest.config.ts` — node environment, reuses the `@/` alias. Tests live next to the code in `__tests__/` folders and import `describe` / `it` / `expect` explicitly (no globals).
- Scripts: `lint`, `lint:fix`, `format`, `format:check`, `test`, `test:watch`. `build` still runs `tsc && vite build`.
- Money helpers accept an optional `locale` argument (last parameter) so formatting is deterministic in tests without changing app behavior.
- Current lint baseline: 0 errors, 45 warnings. The warnings are legacy: `react-hooks/set-state-in-effect` (views load data inside `useEffect`), `react-hooks/purity` (`Date.now()` during render), unused imports/variables, and a few `react-refresh` export notes. Both react-hooks compiler rules were set to `warn` so the tooling step did not require a view refactor. Treat the warning count as a ratchet: do not let it grow.

## How the app flows
`App.tsx` decides what to render, in order:
1. loading → spinner
2. no user → `LandingView`, or `AuthView` if the URL hash is `#login` / `#signup`
3. user but no store → `OnboardingView`
4. user + store → app shell (Navbar + Sidebar) showing the tab from the URL hash: `#sell`, `#inventory`, `#sales`, `#audit`, `#analytics`

## Data model (Supabase)
Tables: `stores`, `custom_attribute_definitions`, `products`, `sales`, `sale_payments`, `sale_items`, `refunds`, `register_closures`, `stock_movements`.
- One owner per store (`stores.owner_user_id`). RLS is enabled on every table; policies restrict rows to the store owner via `is_store_owner()`.
- Multi-step operations are atomic Postgres functions: `create_sale_transaction`, `process_refund_transaction`, `void_sale_transaction`, `close_register_transaction`. Call them via `supabase.rpc` from `services/api.ts`.

## Data access
- Views call `api.*` methods. Only `services/api.ts` talks to Supabase.
- `api.ts` also contains pure analytics helpers (`getMetricTrends`, `getRevenueTrendData`, `getHourlySalesData`, `getStockHealthData`, `getSmartRestockSuggestions`, `getTopFavorites`) and `seedDemo`.

## Local mock mode
If `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are missing, `AuthContext` and `api.ts` fall back to `localStorage` for development only. This is blocked in production mode. When Supabase is configured, queries throw explicit errors on failure rather than falling back silently.

## Design system
Tokens live in `tailwind.config.ts` under `agora.*` (bg, card, border, ink, terracotta, brass, sage, brick, gold). Fonts: Fraunces (serif headings), Inter (body). Shared look classes: `.ledger-card`, `.ledger-row`.

## Known issues (cleanup candidates, roughly by priority)
1. (Resolved in A4) Split `services/api.ts` into modular domain services (`products`, `sales`, `movements`, `settings`, `register`, `analytics`) re-exported via `api.ts` facade.
2. (Resolved in A3) Removed silent localStorage fallbacks on Supabase errors; queries now throw explicit errors.
3. (Resolved in A3) Retained Local Mock Mode strictly as a dev-only fallback when `.env` is unconfigured.
4. (Resolved in A5) Eliminated all `any` types and replaced native `alert()` / `confirm()` calls with `ConfirmModal` and inline error banners.
5. Hand-rolled hash navigation in `App.tsx`; a `landing` tab also exists inside the logged-in app. Production bundle is one 962 kB JS file (no code splitting).
6. `LandingView.tsx` is 685 lines in one file; the large views (Sell, Inventory, Analytics, Sales) are 450–510 lines each and load their own data inline.
7. (Resolved in A6) Purged `seedDemo()` out of `Navbar.tsx`; `Navbar.tsx` is now purely layout/navigation and user session controls.
8. (Resolved in P0-1) Repo hygiene: `tsconfig.tsbuildinfo` and `.babelrc` were removed in A1; README added in A1; tests, linter, and formatter added in P0-1.
9. Naming: standardized product name to "Agora", package to "agora", and localStorage keys to "agora_*" (with legacy key fallback).
10. `index.html`: `user-scalable=no` blocks pinch-zoom (accessibility); canonical/OG URLs and image are placeholders.
11. Minor: `is_store_owner()` is `SECURITY DEFINER` without a fixed `search_path`.
12. Legacy lint warnings (45) that are not worth a dedicated step yet: data loading inside `useEffect` in most views (causes an extra render), `Date.now()` during render in `InventoryView`, 25 unused imports/variables, and 2 `react-refresh` export notes. `npm run lint` passes with 0 errors. Fixing the effect pattern is a candidate for its own refactor step.

## Decisions log
- 2026-10-06: A1 repo hygiene — untracked tsconfig.tsbuildinfo from git, removed unused .babelrc, and added project README.md.
- 2026-10-06: A2 naming — standardized product name to "Agora", package name to "agora", and local storage keys to "agora_*" (with automatic fallback migration for legacy shemsu_* keys).
- 2026-10-07: A3 mock mode & error handling — retained Local Mock Mode strictly for development without Supabase keys, and removed silent localStorage fallbacks when Supabase is configured.
- 2026-10-07: A4 domain split — modularized `src/services/` into domain-specific services with a unified `api` facade export.
- 2026-10-07: A5 types & modals — replaced all 14 `any` types with strict interfaces/unions, and replaced all 18 `alert()` / `confirm()` calls with inline error banners and a reusable `ConfirmModal`.
- 2026-10-07: A6 navbar refactor — removed `seedDemo()` and sample catalog buttons from `Navbar.tsx`; preserved `seedDemo` for onboarding and upcoming landing page demo flow.
- 2026-10-26: Roadmap v1 rewrite — replaced old Phase A/B/C roadmap with a complete phased plan (P0–P4) covering ship pipeline, landing page + design tokens, offline-first data layer, onboarding/auth, insights, and launch gate. Added vision, owner decisions, sequencing rationale, old-to-new task mapping, risks, and post-v1 backlog. No code changes.
- 2026-10-26: P0-1 tooling — added ESLint (flat config), Prettier, and Vitest; unit tests cover every export in `utils/currency.ts` and `utils/revenue.ts`. Fixed two money bugs found while writing the tests: `parseInputToCents` dropped a leading minus sign, and `formatCurrency` / `centsToDecimalString` leaked `NaN` / `Infinity`. `formatCurrency` now accepts an optional `locale` argument for deterministic tests. Repo was formatted once in a separate commit.
