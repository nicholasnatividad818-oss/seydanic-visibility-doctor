# SEYDANIC Visibility Doctor

Shopify embedded React Router app scaffold with a read-only product metadata auditor.

## Develop in Codespaces

Use Node 22.12 or newer. Run `npm install`, `npm run setup`, and `npm test`.
Run `shopify app config link` and select the existing SEYDANIC Visibility Doctor app and the development test shop, not the live Instinct Ink Identity store. Verify `read_products` only. The example client ID and URL in shopify.app.toml must be replaced by Shopify CLI linking.
Run `npm run dev` to launch. Do not commit .env, tokens, merchant data, or databases.

The auditor scans up to 500 products and displays 150 prioritized findings. The metadata audit does NOT verify Google indexing, payments, checkout, inventory, or performance.

## Commercial release blockers

The app scaffold has NOT been installed, started, or end-to-end verified yet. Produce a dependency lockfile, test Shopify authentication and webhooks, configure durable production database/hosting, implement privacy compliance webhooks, multi-tenant tests, billing and subscription enforcement, and complete Shopify App Store review before sales.

This branch does not modify your live Shopify store or checkout.
