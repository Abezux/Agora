# Agora (`shemsu`)

Agora is a fast, installable Progressive Web App (PWA) designed for small shop sales and inventory tracking. It provides modern point-of-sale functionality, inventory control, sales history, stock movement auditing, and business analytics with dual database/offline fallback capabilities.

---

## Features

- **Point of Sale (Sell View)**: Dynamic product grid, category filtering, cart management, and seamless multi-payment checkout.
- **Inventory Management**: Product catalog control, custom attribute definitions, restock logging, and real-time stock status.
- **Sales History & Refunds**: View past transactions, initiate itemized or full refunds, and void sales with atomic database updates.
- **Audit Logging**: Track all product adjustments, restocks, and sales movements in an activity log.
- **Analytics & Metrics**: Visual breakdown of revenue trends, hourly volume, stock health, and top performing items using Recharts.
- **Register Closures**: Daily register opening/closing reconciliations.
- **PWA Ready**: Installable as a web app on mobile and desktop devices.

---

## Tech Stack

- **Frontend Core**: React 18, TypeScript (Strict mode), Vite 5
- **Styling & UI**: Tailwind CSS 3 with custom Agora theme (`agora-*` design tokens), Lucide React icons
- **Data Visualization**: Recharts
- **Backend & Database**: Supabase (Postgres, Auth, Row Level Security)
- **State & Data Access**: React Context, custom API service layer (`src/services/api.ts`)

---

## Prerequisites

- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher

---

## Quick Start & Local Setup

### 1. Clone the Repository & Install Dependencies

```bash
git clone <repository-url>
cd Shemsu
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` to include your Supabase project credentials:

```env
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

> **Note on Local Mock Mode**: If `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` are left empty, the app falls back to a local development mode powered by `localStorage` and demo seed data.

---

## Database Setup (Supabase)

1. Create a project at [Supabase](https://supabase.com).
2. Open the **SQL Editor** in your Supabase project dashboard.
3. Paste and run the contents of [`supabase/schema.sql`](./supabase/schema.sql).

This provisions:
- Core tables (`stores`, `products`, `sales`, `sale_items`, `sale_payments`, `refunds`, `stock_movements`, `register_closures`, `custom_attribute_definitions`).
- Row Level Security (RLS) policies ensuring store owners only access their own store's data.
- Postgres RPC functions for atomic transaction handling (`create_sale_transaction`, `process_refund_transaction`, `void_sale_transaction`, `close_register_transaction`).

---

## Project Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Launches Vite dev server on port `3030` |
| `npm run build` | Compiles TypeScript (`tsc`) and builds production assets with Vite |
| `npm run preview` | Previews the production build locally |
| `npm run lint` | Runs ESLint (0 errors; warnings are a known baseline) |
| `npm run lint:fix` | Runs ESLint and applies safe fixes |
| `npm run format` | Formats the repo with Prettier |
| `npm run format:check` | Fails if any file is not Prettier-formatted |
| `npm test` | Runs the Vitest unit tests once |
| `npm run test:watch` | Runs Vitest in watch mode |

---

## Architecture & Code Guidelines

For an in-depth breakdown of codebase organization, data flows, known cleanup candidates, and developer conventions:

- See [`AGENTS.md`](./AGENTS.md) — permanent codebase rules & workflows.
- See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — structural map, database schema, and design decisions log.
- See [`docs/ROADMAP.md`](./docs/ROADMAP.md) — active development phases and upcoming tasks.

---

## License

Private / Proprietary. All rights reserved.
