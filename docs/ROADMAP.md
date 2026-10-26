# ROADMAP.md — Agora v1 plan

Rule: one step at a time. Discuss → plan → approve → build → verify → update docs → commit. Tick a box only after `npm run build` passes and the step was checked by hand.

---

## Vision

A customizable point-of-sale and inventory tracker for any store type in any country. Merchants configure their own payment methods, currency, and optional tax. The app works **offline first** — many sales will happen without connectivity and must sync reliably when back online. Free to use, installable as a PWA.

## Definition of v1

The minimum feature set for a real shop to adopt Agora:

- **Sell offline**: ring up sales, accept configurable payments, store everything locally, and sync to the server when online.
- **Accurate profit**: every sale item records its cost at the moment of sale; profit is never retroactively wrong.
- **Register sessions**: open a register with a float, sell, close with a count, reconcile.
- **Expenses**: record shop expenses (rent, supplies, etc.) so profit is honest.
- **Customers and credit**: sell on credit, track balances, accept payments against them.
- **Suppliers and payables**: record who you buy from, what you owe, and link to restocking.
- **Insights**: slow-moving stock, stock value, CSV export.
- **Landing page**: explains Agora, has a "Try Demo" that works without an account.
- **Ship pipeline**: live URL, CI, staging, migration-based schema, tests for money math.

What v1 is **not**: dashboard visual redesign, barcode scanning, receipts, multi-store, staff accounts, billing. Those are post-v1.

## Owner decisions (permanent until changed by the owner)

1. **Offline selling is a must.** Many sales happen without connectivity.
2. **Go to production first, iterate from real use.** Nothing is hosted and no Supabase project exists yet. The owner does dashboard clicks; the engineer writes config files and numbered click-by-click instructions.
3. **Free domain and free product for now.** The domain name is effectively permanent once offline data exists (browser storage is tied to the origin).
4. **Landing page comes first** and is required. Includes a "Try Demo" flow: local-only database with sample data, no account needed.
5. **Pilot with real shops starts only after ALL of v1 is done.**
6. **Dashboard visual redesign is deferred** until after v1 and real user data. Direction mockup: https://claude.ai/artifact/USJkkonqUiw5pPKqkvhWYo . **DO plan semantic design tokens now** (CSS variables for surface, text, border, accent, success, danger, chart-1…chart-6, light + dark), so the later redesign is mostly a token swap.
7. **Awaiting owner input** for: onboarding UX, login UX, landing messaging, supported languages, and the dashboard redesign. Do not invent them.

## Status legend

| Symbol | Meaning |
|--------|---------|
| `[ ]`  | To do |
| `[~]`  | In progress |
| `[x]`  | Done |
| `[!]`  | Blocked or awaiting owner input |

## Size legend

| Size | Meaning |
|------|---------|
| S    | One session (< 1 day of focused work) |
| M    | Two to three sessions |
| L    | Must be split into sub-steps when started |

---

## Current status (agents: keep this accurate after every step)

- **Last updated**: 2026-10-26
- **Done**: A1–A6 (see [Completed work](#completed-work-a1a6) below)
- **In progress**: nothing
- **Next**: P0-1 (ESLint, Prettier, Vitest with money-math tests)
- **Blockers / questions for the owner**: none currently

---

## Sequencing logic

Why this order:

1. **P0 (Ship pipeline) first.** Nothing has ever run against real Supabase. Mock mode may be hiding bugs in RLS policies, RPC argument shapes, or auth flows. Every later phase needs a working deploy and CI to validate changes. Money-math tests (P0-1) go first within P0 because money correctness is the foundation of trust.

2. **P1 (Landing page + design tokens) second.** The landing page is a product requirement (owner decision 4) and needs no data-layer changes. Design tokens prepare for dark mode and the deferred redesign. Because P1 is independent of the database work in P2, it can proceed once P0 is green.

3. **P2 (Data layer + offline-first selling) third.** This is the largest architectural change: local database, outbox queue, sync engine, configurable payments, cost snapshots, register sessions, expenses. It **must** precede any UI work that depends on the new data model. The "Try Demo" button (P2-13) connects P1's landing page to P2's local database.

4. **P3 (Customers, credit, suppliers, onboarding, auth) fourth.** Depends on the offline-capable data layer from P2. Customers and credit use `sale_payments` with a new method and an append-only ledger. Suppliers and payables are a simpler ledger. Onboarding and auth UX await owner input but the functional parts can be built.

5. **P4 (Insights + launch gate) last.** Insights are computed queries over the data from P2 and P3 — no new tables. The launch gate checklist is the final quality bar before pilot.

---

## Completed work (A1–A6)

- [x] **A1.** Repo hygiene: removed committed `tsconfig.tsbuildinfo` and `.babelrc`, added `README.md`
- [x] **A2.** Naming: standardized to "Agora" / `"agora"` across `package.json`, `manifest.json`, `sw.js`, and `localStorage` keys
- [x] **A3.** Dev-only mock mode and explicit Supabase error handling: removed silent `localStorage` fallbacks on Supabase errors
- [x] **A4.** Domain split: modularized `src/services/` into domain-specific services with a unified `api` facade
- [x] **A5.** Types and modals: replaced all `any` types with strict TypeScript types; replaced all `alert()` / `confirm()` with `ConfirmModal` and inline error banners
- [x] **A6.** Navbar refactor: purged `seedDemo()` and sample data triggers from `Navbar.tsx`

---

## Old-to-new mapping

Nothing from the old roadmap is lost. This table shows where each old item went and why.

| Old ID | Old title | New location | Reason |
|--------|-----------|-------------|--------|
| A1–A6 | (completed) | Completed work section | Already done |
| A7 | ESLint + Prettier + Vitest | **P0-1** | Same scope, now first task |
| A8 | Router (replace hash navigation) | **Post-v1** | Hash routing works, needs no host rewrite rules, and risks regressions in the offline flow. Revisit after v1 launch. |
| A9 | Code splitting (lazy-load views) | **Post-v1** | Bundle is 965 kB (260 kB gzipped). Acceptable for launch; offline caching means the full bundle is fetched once. Revisit after real user perf data. |
| A10 | `index.html` zoom + metadata fixes | **P4-3** | Folded into the launch gate checklist (zoom, canonical/OG, metadata) |
| B1 | Landing discussion | **P1-2** | Landing strategy spec |
| B2 | Landing outline | **P1-2** | Same spec task |
| B3 | Split LandingView.tsx | **P1-3** | Same scope |
| B4 | Build sections | **P1-4** | Same scope |
| B5 | Polish | **P1-5** | Same scope |
| Phase C | Features (empty) | **P2–P3** | Now fully specified |

---

## P0 — Ship pipeline

**Goal**: The app runs on a live URL against a real Supabase database, with type-checking, linting, and tests automated.

**Why**: Nothing has ever run against real Supabase. Mock mode may be hiding bugs in RLS policies, RPC argument shapes, and auth flows. Every later phase needs a working deploy and CI to validate changes.

**Exit criterion**: `npm run build` and `npm test` pass in CI; the staging URL loads, a user can sign up, create a store, add a product, make a sale, refund it, and close the register; two accounts cannot see each other's data.

---

- [ ] **P0-1** ESLint, Prettier, Vitest (S) | Depends on: nothing
  - **Why**: Money correctness before anything else. A linter catches bugs the compiler misses. A formatter ends style debates. Tests for `currency.ts` and `revenue.ts` are the minimum safety net for financial logic.
  - **How**: Add `eslint`, `prettier`, `vitest` as dev dependencies. Configure ESLint for React + TS strict. Add scripts to `package.json`. Write unit tests for `formatCurrency`, `parseInputToCents`, `centsToDecimalString`, `calculateSaleRefunds`, `getSaleNetRevenue`, `calculateNetRevenue`, `getSaleItemNetTotal`. Add edge cases: zero, negative, very large amounts, NaN input, non-2-decimal currencies (future-proofing).
  - **Done when**: `npm run lint`, `npm run format:check`, and `npm test` all pass; `npm run build` still passes; tests cover every exported function in `utils/currency.ts` and `utils/revenue.ts`.

- [ ] **P0-2** Migrations baseline (S) | Depends on: nothing
  - **Why**: Re-running `schema.sql` is destructive once real data exists. Schema changes must be incremental, reviewable migration files.
  - **How**: Install `supabase` CLI as a dev dependency. Run `supabase init` (if not already). Create `supabase/migrations/00000000000000_baseline.sql` containing the current `schema.sql` content. Document the rule: after this point, all schema changes are new timestamped migration files. Update `AGENTS.md` with the migration rule. Update `README.md` with migration instructions.
  - **Done when**: `supabase/migrations/` exists with the baseline file; `AGENTS.md` and `README.md` reference the migration workflow; `npm run build` passes.

- [ ] **P0-3** Test Supabase project and smoke test (M) | Depends on: P0-2
  - **Why**: The first real-database run will surface bugs that mock mode hides. Better to find them before building on top.
  - **How**: Write a step-by-step guide for the owner: create a Supabase project, run the baseline migration, configure auth (email confirmation off for testing, redirect URLs), set env vars. Update `.env.example` and `README.md`. Then perform a manual smoke test: sign up → onboarding → add product → make a sale → refund → void → close register. Document every bug found as a new task appended to P0.
  - **Done when**: Guide is written, `.env.example` is updated, the owner has a working test project, and the smoke test passes (or found bugs are logged).

- [ ] **P0-4** Data isolation test (S) | Depends on: P0-3
  - **Why**: RLS is the app's entire multi-tenancy security. If two users can see each other's data, the app is broken.
  - **How**: Write a repeatable script or test (can be a Vitest integration test or a documented manual script): create two users, each with a store, products, and a sale. Verify user A cannot read/write user B's data and vice versa. Check every table. Note: `is_store_owner()` is `SECURITY DEFINER` without a fixed `search_path` — this is a known security concern (ARCHITECTURE.md item 11); decide whether to fix it now or log it.
  - **Done when**: The test is documented (or automated) and passes; the `search_path` concern is either fixed or logged as a tracked risk.

- [ ] **P0-5** Hosting and staging deploy (M) | Depends on: P0-3
  - **Why**: We need a URL to test against and to eventually ship to real users. A staging environment is the first gate.
  - **How**: Evaluate and recommend one host (Vercel, Netlify, or Cloudflare Pages) with reasons (free tier limits, preview deploys, env var support, custom domain, build caching). Write deployment config. Configure Supabase site URL and redirect URLs. Document env var setup. Deploy to staging with the test Supabase project. Domain name decision is an owner decision — document the tradeoffs (free subdomain vs. custom domain, permanence of the origin for offline storage).
  - **Done when**: Staging URL is live, the owner can access it, the smoke test from P0-3 passes against staging.

- [ ] **P0-6** CI with GitHub Actions (S) | Depends on: P0-1, P0-5
  - **Why**: Every PR must be verified automatically. Manual-only checking does not scale.
  - **How**: Create `.github/workflows/ci.yml`: type-check (`tsc --noEmit`), lint, test, build on every PR. Recommend branch protection (require CI pass before merge). No deploy in CI yet — staging deploys from the host's Git integration.
  - **Done when**: A PR triggers CI, all four checks pass, and the workflow file is committed.

---

## P1 — Landing page and design tokens

**Goal**: A professional landing page with a "Try Demo" button (wired up in P2-13), plus a design-token system that makes dark mode and the deferred redesign cheap.

**Why**: The landing page is required (owner decision 4) before real shops see the product. Tokens pay for themselves the moment dark mode or the redesign starts.

**Exit criterion**: Landing page is deployed to staging; dark mode follows the system `prefers-color-scheme` setting; no visual regression in the existing app; "Try Demo" button is visible but links to nothing until P2-13.

---

- [ ] **P1-1** Design tokens: light and dark (M) | Depends on: P0-1
  - **Why**: The app currently uses Tailwind `agora-*` tokens defined in `tailwind.config.ts` with hardcoded hex values. Semantic tokens (CSS custom properties for surface, text, border, accent, success, danger, chart-1…chart-6) decouple meaning from value. This makes dark mode a media query + token swap, and the deferred redesign mostly a token file edit.
  - **How**: Define CSS variables in `globals.css` under `:root` (light) and `@media (prefers-color-scheme: dark)` (dark). Map Tailwind `agora-*` tokens to reference these CSS variables. Incrementally migrate existing color usage — the goal is zero visible change in light mode. Add dark mode. Keep existing `agora-terracotta`, `agora-brass`, etc. as semantic aliases. Test every screen in both themes.
  - **Done when**: `globals.css` has light and dark token definitions; Tailwind config references them; every existing screen looks identical in light mode; dark mode applies automatically; `npm run build` passes.

- [!] **P1-2** Landing strategy spec (S) | Depends on: nothing | **AWAITING OWNER INPUT**
  - **Why**: The landing page's audience, message, call to action, proof, and section order must be decided before building.
  - **How**: Write `docs/specs/landing-page.md` with the decisions. Owner provides: target audience, the one main message, the primary CTA, what proof or screenshots to show, section order, tone. Engineer drafts the spec for review.
  - **Done when**: `docs/specs/landing-page.md` is approved by the owner.

- [ ] **P1-3** Split LandingView.tsx (S) | Depends on: P1-1
  - **Why**: `LandingView.tsx` is 685 lines in one file (ARCHITECTURE.md item 6). It must be split before redesigning.
  - **How**: Extract sections into `src/components/landing/` (e.g., `Hero.tsx`, `Features.tsx`, `Pricing.tsx`, `Footer.tsx`). No visual change. Verify by hand and build.
  - **Done when**: `LandingView.tsx` is thin (< 100 lines), imports section components, looks identical, build passes.

- [ ] **P1-4** Build landing sections (M–L) | Depends on: P1-2, P1-3
  - **Why**: Sections are built one at a time, each reviewed, so the owner sees progress and can redirect early.
  - **How**: Mobile-first implementation of each section from the approved spec. Use the new design tokens. Each section is a separate PR or commit, reviewed before the next.
  - **Done when**: All sections from the spec are built and approved; the page is responsive at phone, tablet, and desktop widths.

- [ ] **P1-5** Landing polish (S) | Depends on: P1-4
  - **Why**: Accessibility, performance, and SEO are not optional.
  - **How**: Audit with Lighthouse. Fix: proper heading hierarchy, alt text, focus management, `prefers-reduced-motion` for animations, lazy-load images, real `<title>`, meta description, OG tags (or remove placeholders). Verify keyboard navigation.
  - **Done when**: Lighthouse accessibility and SEO scores are ≥ 90; reduced motion disables animations; metadata is real or removed.

- [ ] **P1-6** Deploy landing to staging (S) | Depends on: P1-5
  - **Why**: The landing page must be visible on the staging URL. "Try Demo" button is present but wired up in P2-13.
  - **How**: Deploy. Verify on phone, tablet, desktop. "Try Demo" button is visible but shows a "coming soon" state or links to `#signup` until P2-13 wires it to local-only demo mode.
  - **Done when**: Staging shows the landing page; "Try Demo" is visible but does not crash; the rest of the app still works behind login.

---

## P2 — Data layer and Slice 1 (offline-first selling)

**Goal**: A shop can sell fully offline — products are in a local database, sales go into an outbox, everything syncs when online, and profit is honest because cost is snapshotted.

**Why**: This is the largest architectural change. It touches the data model, services layer, RPC functions, and the app shell. It must precede any screen that depends on the new data (configurable payments, register sessions, expenses, customers, suppliers).

**Exit criterion**: A tester can put the phone in airplane mode, sell 10 items, come back online, and see all 10 sales synced to Supabase with correct stock, correct profit, and no duplicates. The "Try Demo" button works without an account.

---

- [ ] **P2-1** Architecture Decision Records (S) | Depends on: P0-3
  - **Why**: The offline-first architecture, money representation, ledger pattern, and configurable payments are consequential decisions. Writing them down prevents re-litigation and gives future agents context.
  - **How**: Write short ADRs in `docs/adr/` with status "proposed" for owner approval:
    - `001-offline-sync.md` — offline-first architecture: local DB, outbox, sync engine, conflict policy.
    - `002-money-and-currency.md` — integer minor units everywhere, `Intl.NumberFormat` for display, full ISO 4217 list with per-currency decimal places.
    - `003-ledger-pattern.md` — append-only ledger for credit and payables; balances are computed, never stored.
    - `004-configurable-payments.md` — per-store `payment_methods` table replaces hardcoded `CASH | MOBILE_MONEY | CARD | OTHER`.
  - Also propose additions to `AGENTS.md`: offline-first data flow rules, money in minor units rule, ledger pattern rule, migrations-only rule, semantic tokens rule, tests required for money and sync logic.
  - **Done when**: ADRs are written with status "proposed"; proposed AGENTS.md additions are listed for owner review.

- [ ] **P2-2** Slice 1 migrations (M) | Depends on: P2-1 (approved ADRs), P0-2
  - **Why**: New tables and columns must exist before the code that uses them.
  - **How**: Create migration files for:
    - `payment_methods` table (per store, with name, icon, is_cash flag, display order).
    - `sale_items.unit_cost` column (nullable INT, backfill from current product `cost_price`; nullable because some products have no cost).
    - `register_sessions` table (opening float, counted cash at close, linked to a date range, replaces the closure-only model).
    - `expenses` table (store_id, amount, category, description, date, created_at).
    - Client-generated UUIDs: ensure all insert RPCs accept a provided `id` for offline-generated records.
    - RLS policies and isolation tests for each new table.
  - **Done when**: Migrations apply cleanly on the test Supabase project; isolation tests pass for new tables; `npm run build` passes.

- [ ] **P2-3** Money and currency overhaul (M) | Depends on: P0-1
  - **Why**: The current `currency.ts` hardcodes 8 presets and assumes 2 decimal places (divides by 100). Currencies like JPY (0 decimals), KWD (3 decimals), and UGX (0 decimals) would display incorrectly. The vision is "any country."
  - **How**: Replace `CURRENCY_PRESETS` with a full ISO 4217 list (or a curated subset covering all common currencies) that includes `minorUnitDigits` per currency. Update `formatCurrency` to use `Intl.NumberFormat` with the currency code for locale-aware formatting. Keep internal storage as integer minor units. Ensure `parseInputToCents` handles non-2-decimal currencies. Add tests for JPY (0), KWD (3), USD (2), UGX (0). Migrate existing data safely: existing data is already in integer cents (2-decimal assumption); for 0-decimal currencies like UGX, clarify whether 1500 means 1500 shillings or 15.00 shillings and document the migration path.
  - **Done when**: `formatCurrency('1500', 'JPY')` → `¥1,500`; `formatCurrency('1500', 'USD')` → `$15.00`; `formatCurrency('1500', 'KWD')` → `KD 1.500`; all existing tests still pass; build passes.

- [ ] **P2-4** Local database (IndexedDB) (M) | Depends on: P2-1 (approved ADRs)
  - **Why**: Offline selling requires a local database that survives page reloads. `localStorage` (used by mock mode) is synchronous, has a 5 MB limit, and is not designed for structured queries. IndexedDB (via Dexie or idb) is the standard for offline web apps.
  - **How**: Add an IndexedDB wrapper (evaluate Dexie vs. idb; propose in ADR). Define local tables mirroring the Supabase schema: products, settings, payment_methods, sales, sale_items, sale_payments, stock_movements, register_sessions, expenses, plus a sync outbox. The services layer (`src/services/*`) becomes the abstraction: views call the same API, services read/write locally and queue sync. The existing mock-mode localStorage code is replaced by this.
  - **Done when**: Products, settings, and payment methods load from IndexedDB; existing views work identically in online mode; `npm run build` passes.

- [ ] **P2-5** Offline selling and sync engine (L) | Depends on: P2-2, P2-4
  - **Why**: The core offline requirement. Sales must be recorded locally, queued, and synced to Supabase when connectivity returns.
  - **How**:
    - Outbox queue in IndexedDB: each offline action (sale, refund, void, restock, expense) is a queue entry with a client-generated UUID, a device timestamp, and a `synced_at: null` marker.
    - Client UUIDs: all IDs are generated client-side (UUIDv4) so they are stable across sync attempts.
    - Sale numbers: per-device prefix (e.g., `D1-0001`) to avoid collisions. The server assigns a canonical number on sync if needed.
    - Idempotent sale RPC: modify `create_sale_transaction` to accept a client-provided `id` and skip if it already exists (upsert or conflict check). Same for refund and void RPCs.
    - Sync on reconnect: listen for `navigator.onLine` and `online` event. Retry with exponential backoff. Mark entries `synced_at` on success.
    - Conflict policy (documented in ADR): if stock goes negative on the server after syncing an offline sale, log it and alert the user but do not reject the sale (it already happened physically). If a duplicate sync is detected (same client UUID), skip silently.
    - Device timestamp vs. server time: store both `device_timestamp` and `synced_at`. Display `device_timestamp` to the user; use `synced_at` for server-side ordering.
  - **Done when**: A sale made offline appears in IndexedDB immediately, syncs when online, and appears in the Supabase `sales` table with the correct client UUID; duplicate sync produces no duplicate rows; stock deduction is correct; tests cover offline → online → sync → verify.

- [ ] **P2-6** Offline-capable session and app shell (M) | Depends on: P2-4
  - **Why**: The app must load and be usable without network. Currently, `AuthContext` calls `supabase.auth.getSession()` on mount — this fails offline.
  - **How**: Cache the Supabase session (access token, refresh token, user object) in IndexedDB on successful auth. On app load, if offline, use the cached session. If the token is expired and offline, allow read-only local access and queue writes. Upgrade `public/sw.js` to cache all build assets (JS, CSS, fonts, icons) using a precache manifest from Vite. Show a clear "You are offline" indicator.
  - **Done when**: The app loads from cache with no network; the user can browse products and start a sale; the service worker caches all necessary assets.

- [ ] **P2-7** Sync status UI (S) | Depends on: P2-5
  - **Why**: The user must know whether their data is synced, pending, or failed.
  - **How**: Add a sync status indicator in the app shell (e.g., in the navbar): green dot = synced, yellow dot = offline / N pending, red dot = sync failed. Tapping it opens a simple status view: list of pending items, failed items with retry button, last sync time. If sync fails repeatedly, show a clear error with instructions.
  - **Done when**: The indicator reflects real sync state; tapping it shows details; a forced-offline test shows "offline, N pending"; reconnecting shows "syncing…" then "synced".

- [ ] **P2-8** Configurable payment methods (M) | Depends on: P2-2, P2-4
  - **Why**: Payment methods are currently hardcoded as `CASH | MOBILE_MONEY | CARD | OTHER` in `CheckoutModal.tsx` (line 97) and in `types/index.ts` (lines 59, 97). Real shops use diverse methods (M-Pesa, GCash, bank transfer, etc.). The owner's vision is "any country."
  - **How**: Settings UI: add a "Payment Methods" section in SettingsModal where the merchant can add/edit/remove/reorder methods. Each method has a name, icon (from a preset list), and an `is_cash` flag (for register reconciliation). Default methods seeded during onboarding based on country/business type. CheckoutModal reads from the store's payment methods list instead of a hardcoded array. The `sale_payments.method` column stores the method name string (or ID). Offline: payment methods are cached locally.
  - **Done when**: A merchant can add a custom payment method in settings; it appears in checkout; a sale using it is recorded correctly; removing a method does not break historical sales; build passes.

- [ ] **P2-9** Cost snapshot and honest profit (M) | Depends on: P2-2
  - **Why**: Currently `sale_items` has no cost column. Profit is calculated by looking up the product's current `cost_price`. If a merchant updates the cost, all historical profit numbers silently change. This is incorrect.
  - **How**: Add `unit_cost` (nullable INT) to `sale_items` via migration (P2-2). Update `create_sale_transaction` to snapshot `products.cost_price` into `sale_items.unit_cost` at sale time. Update profit calculations in `revenue.ts` and `analytics.ts` to use `sale_items.unit_cost` when available, and show "cost unknown" where it is `NULL`. Backfill existing `sale_items.unit_cost` from `products.cost_price` in the migration (best-effort; noted as approximate in the migration comment).
  - **Done when**: A new sale stores `unit_cost` per item; editing a product's cost does not change past sale profit; items with no cost show "unknown" profit; build and tests pass.

- [ ] **P2-10** Opening float and register sessions (M) | Depends on: P2-2
  - **Why**: Currently only register closures exist — there is no opening float or session concept. A real shop needs to: open the register with a known float → sell → close the register → count cash → see the variance. Without an opening float, the expected cash is wrong.
  - **How**: Create `register_sessions` table (migration in P2-2) with: `id`, `store_id`, `opened_at`, `opening_float` (cents), `closed_at` (null while open), `counted_cash` (null while open), `expected_cash`, `variance`, `notes`. Migrate the existing `register_closures` data into sessions if feasible (each closure becomes a session opened at `period_start`). Update `close_register_transaction` RPC to close a session rather than create a standalone closure. Add "Open Register" flow: prompt for the opening float amount. Update the cash-in-drawer calculation to include the opening float. Make sessions offline-capable.
  - **Done when**: The register flow is: Open (enter float) → Sell → Close (count cash) → See variance (expected = float + cash sales − cash refunds); old closures are migrated; build passes.

- [ ] **P2-11** Expenses (offline-capable) (M) | Depends on: P2-2, P2-4, P2-5
  - **Why**: Without expenses, "profit" is just revenue minus cost-of-goods. Real profit requires subtracting rent, utilities, transport, etc.
  - **How**: `expenses` table (migration in P2-2) with: `id`, `store_id`, `amount` (cents), `category` (from a preset list the merchant can extend), `description`, `date`, `created_at`. Services: `src/services/expenses.ts`. Views: add an Expenses tab or section (discuss placement). Offline: expenses go into the outbox like sales. Profit metrics in analytics include expenses.
  - **Done when**: A merchant can add an expense, see a list, filter by category and date; expenses are included in profit calculations; expenses sync from offline; build and tests pass.

- [ ] **P2-12** i18n scaffolding and optional tax (S) | Depends on: P2-4
  - **Why**: Shipping English-only is fine for v1, but the scaffolding must exist so adding a language is cheap. Tax is off by default but some shops need it.
  - **How**: i18n: add a translation framework (e.g., `react-i18next` or a simpler home-grown key-value approach — propose in the discussion step). Extract all user-facing strings from the sell and checkout flows into a translation file. Ship only English. Language list is [!] awaiting owner input. Tax: add an optional `tax_rate` (percentage, 0 by default) to store settings. When non-zero, show tax on receipts and in sale totals. Sales store `tax_amount` in cents. Keep it simple: single flat rate, no per-item tax.
  - **Done when**: English strings are in a translation file; adding a new language is a file copy + translate; tax can be turned on in settings; a sale with tax shows the correct total; build passes.

- [ ] **P2-13** Try Demo mode (M) | Depends on: P2-4, P1-6
  - **Why**: Owner decision 4 requires a "Try Demo" that works without an account. This uses the local database from P2-4 seeded with sample data.
  - **How**: "Try Demo" button on the landing page creates a local-only session (no Supabase, no sign-up). Seed IndexedDB with sample products, a few historical sales, and payment methods appropriate to a selected business type. Show a clear persistent banner: "Demo mode — data is local only. Sign up to save your data." Provide a "Reset Demo" button. No data syncs to Supabase. The existing `seedDemo` function in `lib/seed.ts` is the starting point.
  - **Done when**: Clicking "Try Demo" opens the app with sample data; the user can sell, restock, view analytics; the demo banner is always visible; "Reset Demo" clears and re-seeds; no network calls are made; build passes.

- [ ] **P2-14** Offline test suite (M) | Depends on: P2-5, P2-7
  - **Why**: Offline sync is the riskiest part of the app. It needs dedicated, repeatable tests.
  - **How**: Automated (Vitest): test the sync engine in isolation — enqueue, dequeue, retry, backoff, idempotency, duplicate detection, conflict handling (negative stock). Manual script: step-by-step instructions for testing on a real phone — enable airplane mode, sell, come back online, verify sync, check for duplicates, test with two devices. Include edge cases: clock skew (device clock is 1 hour behind), large queue (50+ pending sales), network drop mid-sync.
  - **Done when**: Automated sync tests pass; manual test script is documented; at least one full manual run is completed and documented.

---

## P3 — Slice 2, onboarding, and auth

**Goal**: Customers, credit, suppliers, an improved onboarding flow, and verified auth.

**Why**: Credit sales are table-stakes for shops in many markets. Suppliers close the buy-side loop. Onboarding and auth UX are required for real users but the visual design awaits owner input.

**Exit criterion**: A shop can sell on credit, track customer balances, record supplier bills and payments, and a new user can onboard with sensible defaults for their country and business type.

---

- [ ] **P3-1** Customers and credit ledger (L) | Depends on: P2-5
  - **Why**: Many small shops sell on credit. Tracking balances manually leads to disputes.
  - **How**: Tables: `customers` (name, phone, notes), `credit_ledger` (customer_id, sale_id or payment_id, amount, type: CREDIT_SALE | PAYMENT, timestamp). Balance is computed as `SUM(amount) WHERE type = PAYMENT` minus `SUM(amount) WHERE type = CREDIT_SALE` (or equivalently, sum with signed amounts). A credit sale uses `sale_payments` with a method matching the store's "On Credit" payment method. Accepting a payment against credit is a separate action (not a sale). Offline-capable: both credit sales and payments go through the outbox. UI: customer list, customer detail with balance and ledger history, "Sell on Credit" option in checkout.
  - **Done when**: A merchant can create a customer, sell on credit, see the balance, accept a payment, and the ledger is correct; all operations work offline; build and tests pass.

- [ ] **P3-2** Suppliers and payables (M) | Depends on: P2-5
  - **Why**: Shops buy from suppliers. Tracking what's owed helps manage cash flow and restocking.
  - **How**: Tables: `suppliers` (name, phone, notes), `supplier_ledger` (supplier_id, amount, type: BILL | PAYMENT, description, date, timestamp). Balance = SUM(BILL amounts) − SUM(PAYMENT amounts). Optional link from restocking: when restocking a product, the merchant can select a supplier (updates the bill). Simple ledger, not purchase orders. Offline-capable.
  - **Done when**: A merchant can add a supplier, record a bill, record a payment, see the balance; optionally link a restock to a supplier; offline sync works; build passes.

- [!] **P3-3** Onboarding v2 — functional part (M) | Depends on: P2-8, P2-12 | **UX/visual design AWAITING OWNER INPUT**
  - **Why**: The current onboarding collects store name, business type, and currency. v1 needs: store type templates (pre-configured categories and payment methods), country → currency default, payment method selection, optional tax toggle, and a "cost price" explanation.
  - **How**: Build the functional logic: templates per business type (product categories, default payment methods), country-to-currency mapping, tax rate input. The UX and visual design will be specified by the owner later; build with the current visual style for now, ready to re-skin.
  - **Done when**: A new user choosing "Pharmacy" in "Kenya" gets KES currency, M-Pesa in payment methods, pharmacy categories pre-loaded; tax is off by default; the cost-price concept is explained; build passes.

- [!] **P3-4** Auth rework (S) | Depends on: P0-3 | **UX/visual design AWAITING OWNER INPUT**
  - **Why**: Auth flows (login, signup, password reset, email confirmation) must work end-to-end against real Supabase before real users arrive. The visual design awaits owner input.
  - **How**: Meanwhile (before owner input): verify password reset flow end-to-end (send email, click link, set new password). Verify email confirmation flow. Fix any bugs. Document the current auth flow and any limitations. When the owner provides UX direction, restyle `AuthView.tsx`.
  - **Done when**: Password reset and email confirmation work end-to-end on staging; bugs are fixed or logged; the current auth flow is documented.

---

## P4 — Insights and launch gate

**Goal**: Useful analytics and a verified production deployment.

**Why**: Insights help merchants make decisions (what to reorder, what's not selling). The launch gate ensures nothing ships broken.

**Exit criterion**: The launch gate checklist in `docs/specs/launch-gate.md` is fully green; the production URL is live; the owner approves pilot readiness.

---

- [ ] **P4-1** Insights: slow movers and stock value (S) | Depends on: P2-9
  - **Why**: "What should I reorder?" and "How much is my inventory worth?" are the two most common merchant questions after revenue.
  - **How**: Computed queries, no new tables. Slow movers: products ranked by units sold in the last 30 days (ascending). Stock value: `SUM(products.cost_price * products.stock_quantity)` with a note where cost is unknown. Add to AnalyticsView or a new Insights section.
  - **Done when**: The slow-movers list and stock value are visible in the app; they update when sales and restocks happen; build passes.

- [ ] **P4-2** CSV export (S) | Depends on: P2-11, P3-1
  - **Why**: Merchants need to get their data out — for accountants, for tax filings, or just for backup.
  - **How**: Add "Export CSV" buttons for: sales (with items, payments, cost), stock snapshot, expenses, credit balances. Generate CSV client-side (no server needed). Include date range filter for sales and expenses.
  - **Done when**: Each export produces a valid CSV that opens correctly in Excel/Google Sheets; date filtering works; build passes.

- [ ] **P4-3** Launch gate checklist (M) | Depends on: P0-5, P2-14, P3-4
  - **Why**: A single checklist ensures nothing is missed before real users arrive.
  - **How**: Write `docs/specs/launch-gate.md` with the following items, each checked off:
    - [ ] Production Supabase project created (owner) with production env vars
    - [ ] Production deploy live on the chosen host
    - [ ] Re-run data isolation test (P0-4) on production
    - [ ] Error monitoring set up (e.g., Sentry free tier, or Supabase logs — evaluate)
    - [ ] Backup plan documented (Supabase daily backups on paid plan, or manual pg_dump script)
    - [ ] Supabase free-tier limits checked: database size, API requests, auth users, storage, **inactivity pausing** (free-tier projects pause after 7 days of inactivity — document the mitigation)
    - [ ] `index.html` fixes: remove `user-scalable=no` (accessibility), set real canonical URL, real OG image/description (or remove placeholders) — from old A10
    - [ ] Confirm mock mode is OFF in production (`import.meta.env.MODE === 'production'` check exists in AuthContext)
    - [ ] Performance check on a slow phone (target: first paint < 3s on 3G, app usable offline after first load)
    - [ ] Full phone smoke test including offline: sell offline → sync → verify on another device
    - [ ] Terms of service and privacy policy pages (even minimal ones)
    - [ ] Zoom/pinch enabled (remove `user-scalable=no`)
  - **Done when**: `docs/specs/launch-gate.md` exists; each item is actionable; the checklist is used as the final gate before production.

- [ ] **P4-4** Pilot (S) | Depends on: P0 through P4-3
  - **Why**: Pilot starts only when everything is done (owner decision 5). Feedback produces the next roadmap.
  - **How**: Owner selects pilot shops. Engineer provides onboarding support (documentation, bug triage). Feedback is collected and becomes the post-v1 roadmap.
  - **Done when**: At least one shop is using Agora in production; feedback is collected and prioritized.

---

## Post-v1 backlog

These are candidates for the roadmap after v1 ships and real user feedback arrives. They are **not** commitments.

| Candidate | Notes |
|-----------|-------|
| Dashboard visual redesign | Using the owner's mockup. Mostly a token swap if P1-1 is done well. |
| Router (old A8) | Replace hash navigation with `react-router`. Lower risk after offline sync is stable. |
| Code splitting (old A9) | Lazy-load views for faster first paint. Less urgent if SW caching works well. |
| Staff accounts and roles | Will change sync conflict rules (multi-device, multi-user). Design carefully. |
| More languages | Depends on P2-12 scaffolding. Language list awaiting owner. |
| Barcode scanning | Camera-based scanning for product lookup and checkout. |
| Receipts (print / SMS / WhatsApp) | Thermal printer support, or digital receipt sharing. |
| Billing and pricing | If Agora becomes a paid product. |
| Multi-store | One owner, multiple stores. Changes data model and RLS significantly. |
| Low-stock alerts (push notifications) | Requires notification permission and a trigger mechanism. |
| Daily summary notifications | End-of-day revenue, top sellers, low stock. |
| Purchase orders | Full buy-side workflow (PO → receive → bill). Extends P3-2. |

---

## Awaiting owner input

These items are blocked until the owner provides direction. They are referenced in the roadmap with `[!]`.

| Item | Where referenced | What's needed |
|------|-----------------|---------------|
| Landing page messaging | P1-2 | Audience, message, CTA, proof, section order, tone |
| Onboarding UX and visual design | P3-3 | Screen flow, visual style, copy |
| Login / auth UX and visual design | P3-4 | Screen flow, visual style, error messaging |
| Supported languages | P2-12 | Which languages to ship after English |
| Dashboard visual redesign direction | Post-v1 | When to start, final mockup approval |

---

## Risks and mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Offline complexity** | Sync bugs lose or duplicate sales; merchants lose trust | Dedicated test suite (P2-14); conflict policy documented in ADR; idempotent RPCs; manual phone testing |
| **Scope growth vs. speed** | v1 takes too long; the market moves on | Strict phase gates; owner reviews at each phase exit; defer anything not in v1 definition |
| **Supabase free-tier limits** | Project pauses after 7 days of inactivity; 500 MB DB limit; 50K monthly auth requests | Document limits in launch gate (P4-3); set up a keep-alive ping or upgrade to paid tier before pilot |
| **Domain permanence** | Changing the domain after offline data exists breaks IndexedDB storage | Choose a permanent domain in P0-5; if using a free subdomain, understand the commitment; document in launch gate |
| **One-owner-per-store assumption** | Adding staff accounts later changes RLS, sync conflict rules, and the data model | Keep the single-owner model for v1; design the schema so staff accounts are additive, not a rewrite |
| **Device clock errors** | Offline sales have wrong timestamps; sorting and reporting are off | Store both device timestamp and synced_at (P2-5); use server time for canonical ordering; document the policy |
| **Schema changes without migrations** | Ad-hoc SQL breaks the test or production database | Migration rule enforced from P0-2; `AGENTS.md` updated; no direct SQL after baseline |
| **Agent drift** | AI agents ignore rules, invent decisions, or make unauthorized changes | AGENTS.md workflow loop; discuss-first rule; no code without approval; doc updates required |
| **`is_store_owner()` search_path** | `SECURITY DEFINER` function without fixed `search_path` is a potential security issue (ARCHITECTURE.md item 11) | Evaluate and fix in P0-4 or log as accepted risk with justification |
| **Mock mode masking real bugs** | localStorage mock behaves differently from Supabase (no RLS, no RPC, different error shapes) | Smoke test against real Supabase in P0-3; replace mock mode with local IndexedDB in P2-4 |

---

## Assumptions to verify / corrections

These are claims from the owner's review that were checked against the code. Discrepancies and confirmations are noted.

| Claim | Verified? | Finding |
|-------|-----------|---------|
| Payment methods are hardcoded (cash, mobile money, card) | ✅ Confirmed | `CheckoutModal.tsx` line 97: `{ CASH: '', MOBILE_MONEY: '', CARD: '', OTHER: '' }`. Also hardcoded in `types/index.ts` lines 59, 97. There is no `payment_methods` table. |
| About 8 currency presets assuming 2 decimals | ✅ Confirmed | `utils/currency.ts` lines 6–15: exactly 8 presets (USD, KES, NGN, EUR, GBP, ZAR, PHP, INR). `formatCurrency` divides by 100 unconditionally (line 26). `centsToDecimalString` calls `.toFixed(2)` (line 48). No per-currency decimal support. |
| `sale_items` has no cost snapshot | ✅ Confirmed | `sale_items` table in `schema.sql` has `unit_price` but no `unit_cost` or `cost_price` column. `types/index.ts` `SaleItem` interface has no cost field. Confirmed: no `unit_cost` anywhere in the codebase. |
| Only register closures exist (no opening float or sessions) | ✅ Confirmed | `register_closures` table exists (schema.sql line 106). No `register_sessions` table. No `opening_float` column. No references to `opening_float` or `register_session` anywhere in the codebase. |
| One owner per store | ✅ Confirmed | `stores.owner_user_id` (single UUID). RLS policies use `is_store_owner()` which checks `owner_user_id = auth.uid()`. No staff/role tables. |
| Sales go straight to Supabase RPC (no offline support) | ✅ Confirmed | `services/sales.ts` calls `supabase.rpc('create_sale_transaction', ...)` directly. No outbox, no queue, no local write-first. The only offline fallback is the dev-only mock mode using `localStorage`. |
| Hash-based navigation | ✅ Confirmed | `App.tsx` uses `window.location.hash` and `hashchange` event listener. No router library. |
| A service worker exists | ✅ Confirmed | `public/sw.js` exists (67 lines). Cache-first strategy for static assets. Bypasses cache for Supabase API calls. Does not precache build assets (only caches `/`, `/index.html`, `/manifest.json`). The `CACHE_NAME` uses `__BUILD_TIMESTAMP__` which does not appear to be replaced at build time — **potential bug**: cache versioning may not work. |
| No expenses, customers, credit, or supplier tables | ✅ Confirmed | Schema has: `stores`, `custom_attribute_definitions`, `products`, `sales`, `sale_payments`, `sale_items`, `refunds`, `register_closures`, `stock_movements`. None of the missing tables exist. |

### Additional findings not in the owner's review

| Finding | Impact | Where to address |
|---------|--------|-----------------|
| `sw.js` `__BUILD_TIMESTAMP__` placeholder is never replaced at build time | Service worker cache never invalidates properly | P2-6 (app shell upgrade) |
| `create_sale_transaction` generates server-side UUIDs and random sale numbers | Cannot accept client-generated IDs for offline sync | P2-5 (idempotent RPCs) |
| `close_register_transaction` assumes `CASH` method string for expected cash calculation | Will break when payment methods are configurable (need `is_cash` flag) | P2-10 |
| `is_store_owner()` is `SECURITY DEFINER` without `SET search_path` | Minor security concern (search_path injection) | P0-4 or logged as risk |
| `LandingView.tsx` is 685 lines (35 kB) | Too large for one component; already tracked | P1-3 |
| The `landing` tab exists inside the logged-in app shell (App.tsx line 88) | Users can navigate to the marketing page while logged in, which is confusing | P1-3 (remove it during split) |
| `revenue.ts` has no concept of cost-based profit | Profit calculations will need updating when `unit_cost` is added | P2-9 |
| `low_stock_alerts_enabled` is hardcoded to `true` in settings service | Not stored in the database; always true | Minor; fix when touching settings |

---

## Definition of done (for any task)

A task is done when:
1. `npm run build` passes.
2. `npm run test` passes (after P0-1).
3. `npm run lint` passes (after P0-1).
4. The feature was tested by hand in the browser (documented: what to click, what should happen).
5. `docs/ARCHITECTURE.md` is updated if files, tables, or architecture changed.
6. `docs/ROADMAP.md` is updated (task ticked, status block current).
7. A commit message is suggested (conventional format).

## Feature spec template

Copy this into `docs/specs/<feature-name>.md` before building anything.

```
# Feature: <name>

Goal: one or two sentences — what the user can do after this ships.
Who uses it:
Screens / files likely touched:
Data needed (new tables or columns? new RPC?):
Edge cases:
Out of scope:
Done when: (a checklist someone can test by hand)
Open questions:
```
