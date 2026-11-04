# SEYDANIC Visibility Doctor

Shopify embedded React Router app scaffold with a read-only product metadata auditor.

## Develop in Codespaces

Use Node 22.12 or newer. Run `npm ci`, `npm run setup`, and `npm test`. The setup command initializes the development SQLite file before applying migrations; it is safe to run again. Run `npm run typecheck` and `npm run build` before review.
Run `shopify app config link` and select the existing SEYDANIC Visibility Doctor app and the development test shop, not the live Instinct Ink Identity store. Verify `read_products` only. The example client ID and URL in shopify.app.toml must be replaced by Shopify CLI linking.
Run `npm run dev` to launch. Do not commit .env, tokens, merchant data, or databases.

The auditor scans up to 500 products and displays 150 prioritized findings. The metadata audit does NOT verify Google indexing, payments, checkout, inventory, or performance.

## Commercial release blockers

The scaffold is merged into `main` (PR #2). Local validation on 2026-11-04 covered dependency installation, all 14 scanner assertions, fresh and repeat database setup, session write/read/delete, TypeScript, production build, and the unauthenticated login form. A dependency lockfile is included for reproducible installs.

These checks do not verify Shopify installation, token exchange, session restoration through OAuth, embedded admin launch, or a real-store product scan. `shopify.app.toml` remains deliberately unlinked: do not replace its empty client ID or placeholder URL with invented values. Link an authorized development app/store and supply its genuine credentials securely before testing these flows.

Production hosting/database durability, privacy compliance webhooks, tenant isolation, billing and subscription enforcement, and Shopify App Store review remain release blockers. See [the launch gate](docs/SHOPIFY_SAAS_LAUNCH_GATE.md) and [validation evidence](docs/LOCAL_VALIDATION.md).

This branch does not modify your live Shopify store or checkout.
