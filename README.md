# SEYDANIC Visibility Doctor

Read-only Shopify catalog diagnostic MVP. This repository currently contains the scanner overlay, unit tests, and a Codespaces configuration. **It is not a complete Shopify React Router application yet.** The full scaffold is still on the user's Mac.

## Set up Codespaces
Open the repository in Codespaces. The devcontainer provides Node.js 22 and a Linux development environment. Until the full scaffold is uploaded, there is no `package.json`, so do not run `npm install` yet.

Transfer the official Shopify React Router scaffold from the local project, including its `package.json`, lockfile, `app/shopify.server.ts`, authentication, Prisma session storage, Shopify TOML configuration and Vite setup. Merge the scanner overlay here. **Do not transfer secrets, `.env`, `.shopify/`, `node_modules/`, or private merchant data.**

Once the complete scaffold is present:

```bash
npm ci
npx prisma generate
node --test tests/*.test.mjs
npm install -g @shopify/cli@latest
shopify app dev
```

Link the existing **SEYDANIC Visibility Doctor** app, choose the **development store** (never the live Instinct Ink Identity store), and use `read_products` only.

## Scanner
- `app/lib/audit.mjs` — read-only metadata quality checks
- `app/lib/shopify-catalog.server.mjs` — paginated GraphQL product reads
- `app/routes/app._index.tsx` — Shopify embedded dashboard
- `tests/*.test.mjs` — automated scanner checks

Current caps: 500 scanned products per request and 150 displayed findings. No proof of Google indexing, checkout health, actual stock, or storefront performance.

## Security
No write scopes; never commit access tokens, session secrets or credentials. Before commercial release: validate authentication, multi-tenant isolation, retention/privacy webhooks, billing, hosting and Shopify App Store requirements.
