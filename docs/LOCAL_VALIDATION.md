# Local validation — 2026-11-04

Remote `main` at `e3bf933de863fdb5ec4b6de23047c1a4b635e696` includes PR #2 commit `0a577610ea5279c77875286461cf702520ef8d11`. Git ancestry and the fetched main tree confirm that the scaffold and package.json are present. The GitHub API request was denied, so Git history is the evidence for integration, rather than an API review-status check.

## Fixes

- Add package-lock.json and use npm ci in app validation CI.
- Initialize a Prisma connection before migrations: migrate deploy failed with a generic schema-engine error when the SQLite file was absent. The revised setup succeeds from a missing file and on a repeat run.
- Run Node tests with --experimental-test-isolation=none so this environment executes and reports all 14 named assertions instead of three file-level results.
- Run app validation CI for main and fix branches as well as feature branches; require the actual /auth/login form with HTTP 200 instead of accepting a root-route 404 as application validation.
- Ignore generated route types and correct obsolete scaffold status documentation.

## Local evidence

Node 24.22.1 and Prisma 6.19.3; scanner tests also validated on the minimum Node 22.12.0. Prisma engine downloads now pass the published network policy with TLS/checksum verification enabled. Fresh SQLite migration and repeat migration succeeded. Session write/read/delete succeeded against the migrated local database. All 14 scanner assertions passed. TypeScript and production client/server build passed. The production server started with CI-only fixture credentials and /auth/login returned HTTP 200 containing the Shop domain form. A request with a non-browser user agent received the Shopify SDK's HTTP 410 bot rejection on /app; a full browser user agent received the App Bridge token-acquisition page with HTTP 200 and no rendered scanner results. Neither response proves OAuth success or a real-store scan.

## Still requires external configuration or release work

No genuine SHOPIFY_API_KEY, SHOPIFY_API_SECRET or SHOPIFY_APP_URL was available. shopify.app.toml is unlinked and remains unchanged. Never guess these values. Select an authorized Shopify development app and development shop, link it with Shopify CLI, verify read_products only, then validate installation, token exchange, restored sessions, embedded launch, uninstall/reinstall, and the rendered scanner against zero/one/many real development products. Do not use the live Instinct Ink Identity store for this test.

No live-store calls, merchant changes, deployment, environment publication, remote merge or billing actions were performed. Hosting, durable database, signed privacy compliance webhooks, tenant isolation and subscription enforcement remain release gates; local smoke tests cannot satisfy them. No paid-launch readiness is claimed.
