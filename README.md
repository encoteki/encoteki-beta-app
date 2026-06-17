# Encoteki Beta App

Web3 dApp for the Encoteki ecosystem: wallet-based sign-in (SIWE), referral-gated
access, cross-chain NFT minting (Tree Stewards), a points leaderboard, and DAO
governance voting. Built on Next.js 16 (App Router) with on-chain reads/writes via
wagmi/viem and off-chain data via Supabase.

## Tech stack

| Area           | Choice                                                          |
| -------------- | --------------------------------------------------------------- |
| Framework      | Next.js 16 (App Router, Turbopack) · React 19                   |
| Language       | TypeScript (`strict: true`)                                     |
| Wallet / chain | wagmi 3 · viem 2 · ethers 6 · SIWE · Xellar Kit · WalletConnect |
| Session        | iron-session (HttpOnly cookie, SIWE-bound)                      |
| Data           | Supabase (SSR + service-role) · TanStack Query · SWR            |
| Validation     | Zod (parsed at every external boundary)                         |
| Styling        | Tailwind CSS v4 · `motion` (Framer Motion)                      |
| Observability  | Sentry (`@sentry/nextjs`) + Web Vitals RUM                      |
| Tooling        | ESLint 9 (flat config) · Prettier · yarn 4                      |

Supported chains: Base, Arbitrum, Lisk, Manta Pacific.

## Prerequisites

- **Node.js ≥ 20.9** — the repo pins **Node 22** (`.nvmrc`). With nvm: `nvm use`.
- **Yarn 4** via Corepack (do **not** `npm install` — this is a Yarn-Berry repo):
  ```bash
  corepack enable
  ```

## Getting started

```bash
# 1. Use the pinned Node version
nvm use                 # reads .nvmrc → Node 22

# 2. Enable the pinned package manager
corepack enable

# 3. Install dependencies
yarn install --immutable

# 4. Configure environment (see "Environment variables" below)
cp .env.example .env
#   …then fill in the values in .env

# 5. Run the dev server
yarn dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

`.env.example` is the source of truth — copy it to `.env` and fill in the values.
Key groups:

- **Wallet:** `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID`, `NEXT_PUBLIC_XELLAR_APP_ID`
- **Supabase:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- **Contracts / tokens:** `NEXT_PUBLIC_TSB_*`, `NEXT_PUBLIC_*_USDC_ADDRESS`
- **SIWE session:** `IRON_SESSION_PASSWORD` (≥ 32 chars), `NEXT_PUBLIC_APP_URL`
- **APIs:** `ENCOTEKI_API_KEY`, `NEXT_PUBLIC_GATEWAY_URL` (IPFS)
- **Observability:** `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_DSN` (leave unset to disable), `SENTRY_ORG`/`SENTRY_PROJECT`/`SENTRY_AUTH_TOKEN` (source-map upload)
- **Security:** `CSP_ENFORCE` — see below.

> ⚠️ **Secrets must never carry the `NEXT_PUBLIC_` prefix** — that prefix ships the
> value to the browser. `XELLAR_APP_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`,
> `ENCOTEKI_API_KEY`, and `IRON_SESSION_PASSWORD` are server-only and are used
> only from Server Actions / Route Handlers.

### Content-Security-Policy toggle

CSP defaults to **report-only** (`CSP_ENFORCE` unset) so a missing allowlist entry
can't silently break the wallet SDKs. Violations are sent to `/api/csp-report`.
Once you've verified the login + mint flow in-browser with no CSP violations in the
console, set `CSP_ENFORCE=true` **in the production environment** to enforce the
full policy. See `next.config.ts` for the policy definition.

## Scripts

| Command          | What it does                       |
| ---------------- | ---------------------------------- |
| `yarn dev`       | Dev server (Turbopack)             |
| `yarn dev:fast`  | Dev server with a larger Node heap |
| `yarn build`     | Production build                   |
| `yarn start`     | Serve the production build         |
| `yarn typecheck` | `tsc --noEmit` — full type check   |
| `yarn lint`      | ESLint over the repo               |
| `yarn lint:fix`  | ESLint with autofix                |
| `yarn format`    | Prettier write                     |

## Project structure

```
src/
  actions/        Server Actions (auth/SIWE, referral) — 'use server'
  app/            App Router routes, layouts, error/loading boundaries
    api/          Route Handlers (BFF: leaderboard proxy, csp-report sink)
    login/ mint/ dao/ leaderboard/
  components/     Feature + shared UI components
  contexts/       React context providers (app, dao, mint)
  hooks/          Data + chain hooks (balances, mints, voting, session guard)
  lib/            session, supabase clients, schemas (Zod), telemetry
  providers/      App + Web3 (wagmi/Xellar/TanStack Query) providers
  services/       Supabase data access (DAO)
  constants/      ABIs, contract addresses, route constants
  ui/             Primitives (buttons, navs, badges, svg)
```

Routes: `/login` (wallet connect + referral gate) → `/mint` → `/dao`, `/leaderboard`.
Access is gated in `src/proxy.ts` (SIWE session + referral check).

## Further docs

- [`PRODUCT.md`](./PRODUCT.md) — product scope and flows
- [`DESIGN.md`](./DESIGN.md) — design system / visual language
- [`TSB-FLOW-DIAGRAMS.md`](./TSB-FLOW-DIAGRAMS.md) — Tree Stewards mint/cross-chain flows
- [`audit.md`](./audit.md) — latest frontend engineering audit

## CI

Every PR and every push to `main`/`dev` runs **lint → build → typecheck** via
GitHub Actions (`.github/workflows/ci.yml`). To make the gate block merges, enable
branch protection on `main` with a required status check on the `lint · typecheck ·
build` job.

## Deployment

Deployed on **Vercel**. Set the same environment variables in the Vercel project
settings (including `CSP_ENFORCE=true` for production). Sentry source maps upload
during the production build when `SENTRY_AUTH_TOKEN` is configured.
