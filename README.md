# Encoteki Beta App

Web3 dApp for the Encoteki ecosystem: wallet-based sign-in (SIWE), referral-gated
access, cross-chain NFT minting (Tree Stewards), a points leaderboard, and DAO
governance voting. Built on Next.js 16 (App Router) with on-chain reads/writes via
wagmi/viem.

## Architecture

This repo is the **frontend only**. Auth (SIWE nonce/verify, session issuance),
user registration, referral codes, the leaderboard, and DAO proposal data are all
served by a separate backend API (`NEXT_PUBLIC_API_URL`) — this app never talks to
a database directly. What actually lives here:

- **Wallet UX & SIWE signing** — `src/ui/buttons/sign-in-btn.tsx` builds and signs
  the SIWE message; `src/lib/auth-client.ts` sends it to the backend and holds the
  session cookie via `credentials: 'include'`.
- **Route gating** — `src/proxy.ts` (Next.js middleware) checks the backend-issued
  session cookie on every request and redirects unauthenticated/unregistered
  visitors to `/login` before a protected page ever renders.
- **On-chain transactions** — minting (`src/hooks/useMintTransaction.ts`) and DAO
  voting/abstaining (`src/hooks/useProposalVoting.ts`), built and signed client-side
  via wagmi/viem.
- **IPFS reads** — `src/lib/ipfs-client.ts` fetches DAO proposal descriptions and
  NFT metadata with multi-gateway fallback.

If a name in this doc suggests storage, auth logic, or session state beyond what's
listed above, that's a sign this doc has drifted — check the actual code first.

## Tech stack

| Area           | Choice                                                                 |
| -------------- | ---------------------------------------------------------------------- |
| Framework      | Next.js 16 (App Router, Turbopack) · React 19                          |
| Language       | TypeScript (`strict: true`)                                            |
| Wallet / chain | wagmi 3 · viem 2 · ethers 6 · SIWE · Xellar Kit · WalletConnect        |
| Session        | Backend-issued HttpOnly cookie (SIWE-bound), checked in `src/proxy.ts` |
| Data           | TanStack Query · SWR                                                   |
| Validation     | Zod (parsed at every external boundary)                                |
| Styling        | Tailwind CSS v4 · `motion` (Framer Motion)                             |
| Observability  | Sentry (`@sentry/nextjs`) + Web Vitals RUM                             |
| Tooling        | ESLint 9 (flat config) · Prettier · yarn 4                             |

Supported chains: Base, Arbitrum, Lisk, Manta Pacific.

## Prerequisites

- **Node.js ≥ 20.9** — the repo pins **Node 24** (`.nvmrc`, `engines.node`). With nvm: `nvm use`.
- **Yarn 4** via Corepack (do **not** `npm install` — this is a Yarn-Berry repo):
  ```bash
  corepack enable
  ```

## Getting started

```bash
# 1. Use the pinned Node version
nvm use                 # reads .nvmrc → Node 24

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
Every var there is commented with what it's for and whether it's optional. Groups:

- **App:** `NEXT_PUBLIC_APP_ENV`
- **Wallet:** `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID`, `NEXT_PUBLIC_XELLAR_APP_ID`
- **Contracts / tokens:** `NEXT_PUBLIC_TSB_*`, per-chain token addresses, optional `NEXT_PUBLIC_MINT_PRICE_*` overrides
- **SIWE:** `NEXT_PUBLIC_APP_URL` (domain/URI binding for the signed message — must match the backend's `SIWE_DOMAIN`)
- **Encoteki API:** `NEXT_PUBLIC_API_URL` (optional — defaults to the production backend)
- **LayerZero:** `NEXT_PUBLIC_LZ_API_URL` (optional — cross-chain mint delivery status polling)
- **IPFS:** `NEXT_PUBLIC_GATEWAY_URL` (optional — proposal descriptions / NFT metadata)
- **Observability:** `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_DSN` (leave unset to disable), `SENTRY_ORG`/`SENTRY_PROJECT`/`SENTRY_AUTH_TOKEN` (source-map upload)
- **Security:** `CSP_ENFORCE` — see below.

> ⚠️ **Secrets must never carry the `NEXT_PUBLIC_` prefix** — that prefix ships the
> value to the browser. `SENTRY_AUTH_TOKEN` is server-only and is used only
> during the production build (source-map upload).

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
  app/            App Router routes, layouts, error/loading boundaries
    api/          Route Handlers — csp-report sink (the only one)
    login/ mint/ dao/ leaderboard/
  components/     Feature UI: common, dao, leaderboard, mint, wallet
  contexts/       React context providers (app, dao, mint)
  hooks/          Data + chain hooks (balances, mints, voting, session guard)
  lib/            Backend API clients (auth, leaderboard, proposals, referral),
                  IPFS client, Zod schemas, telemetry
  providers/      App + Web3 (wagmi/Xellar/TanStack Query) providers
  constants/      ABIs, contract addresses, route constants
  ui/             Primitives (buttons, navs, badges, svg)
  enums/ types/ utils/ assets/
  proxy.ts        Auth/referral route gate (Next.js middleware — see Architecture)
```

Routes: `/login` (wallet connect + referral gate) → `/mint` → `/dao`, `/leaderboard`.
Access is gated in `src/proxy.ts` (SIWE session + referral check).

## CI

Every PR and every push to `main`/`dev` runs **lint → build → typecheck** via
GitHub Actions (`.github/workflows/ci.yml`). To make the gate block merges, enable
branch protection on `main` with a required status check on the `lint · typecheck ·
build` job.

## Deployment

Deployed on **Vercel**. Set the same environment variables in the Vercel project
settings (including `CSP_ENFORCE=true` for production). Sentry source maps upload
during the production build when `SENTRY_AUTH_TOKEN` is configured.
