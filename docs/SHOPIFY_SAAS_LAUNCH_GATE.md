# SEYDANIC Visibility Doctor — Shopify SaaS Launch Gate

Status: **NOT SALES READY**. The Shopify app scaffold is merged into main and runs locally with test fixtures; Shopify integration and commercial readiness remain unverified. Do not publish, charge merchants, or claim automated monitoring until gates pass.

## 1. Restore runnable Shopify app (P0)
- [x] Merge the React Router app scaffold and preserve the scanner modules/tests (PR #2 is in main history).
- [x] Include package.json, committed lockfile, React Router/Vite config, app/shopify.server.ts, Prisma schema and migration files, authenticated session storage, appropriate Shopify CLI configuration. Do not commit .env, access tokens, node_modules, .shopify, or production merchant data.
- [x] Validate local install, Prisma generate/migrate, scanner tests, typecheck, build, session persistence and login HTTP response. CI definitions cover these checks.
- [ ] Verify hosted CI results and configure required branch checks before release.
- [ ] Link Shopify Partner/Dev Dashboard app to this repository, and connect **only a Shopify development store**. Use `read_products` for the current scanner; never request write scopes without a new justified feature and consent.

## 2. Production app security and reliability (P0)
- [ ] Validate Shopify embedded authentication/token exchange and secure offline sessions; session records keyed to shop. Never trust shop query parameters without session validation.
- [ ] Enforce per-shop isolation in all reports, sessions and jobs; no cross-merchant data exposure. Use managed Postgres rather than an ephemeral development SQLite database.
- [ ] Implement and test app/uninstalled lifecycle and mandatory privacy compliance webhooks (customers/data_request, customers/redact, shop/redact) with HMAC validation, idempotency, retention and deletion procedures.
- [ ] Handle Shopify GraphQL errors, throttling, retries, partial scans, timeouts and 500-product scan cap transparently. Do not run uncontrolled background jobs.
- [ ] Maintain minimum scopes, encrypted secrets, HTTPS, audit logs with redaction, access restrictions, backups, incident response and alerting.
- [ ] Provide a merchant-facing privacy policy, terms, support contact and data deletion process.

## 3. SaaS plans and entitlements (P0)
- [ ] Use **Shopify App Pricing** in the Partner/Dev Dashboard for a new public App Store listing. Configure free and recurring plans there. Do not add Stripe or an external checkout for charges governed by Shopify's App Store billing policy.
- [ ] Proposed plans pending validation: Free $0/month (25 product scan), Starter $9/month (250), Growth $29/month (2,500), Pro $79/month (10,000).
- [ ] Current scanner hard cap is **500 products per request**. Do not sell the Growth or Pro scan limits until pagination limits, async job processing and infrastructure are implemented and tested.
- [ ] Enforce plan limits server-side using an authoritative active subscription/entitlement check, not UI flags. Handle trial, pending, frozen, canceled, uninstall, upgrade, downgrade and reinstallation.
- [ ] Implement durable scan history and recurring scans **before** offering these as paid benefits. Add fair-use limits, rate controls and per-tenant cost visibility.
- [ ] Test paid plan checkout using Shopify's development/test flows; do not create real charges during testing.

## 4. Product and conversion (P1)
- [ ] Merchant onboarding: install → permission approval → initial read-only scan → issues by severity → recommended action.
- [ ] Explain clearly that metadata checks **do not validate Google indexing, ranking, actual stock, checkout, or conversion rates**.
- [ ] Add accessible error/empty/loading states and progress for larger scans; no fake scores or unsupported metrics.
- [ ] Export/share reports only after data-access, permissions, rate limits and privacy behavior are defined.
- [ ] Add opt-in email notifications and support diagnostics only if authorized and compliant.

## 5. Listing and launch (P0 before submission)
- [ ] Select **public distribution** on the production app (distribution choice is not freely reversible).
- [ ] Prepare honest App Store listing copy, category, icon, screenshots from a development store, demo video, pricing, support address, privacy URL and terms URL.
- [ ] Confirm Shopify App Store developer enrollment/registration and any required one-time fee.
- [ ] Complete Shopify's up-to-date app quality/review checklist and send test credentials or reproduction steps as required.
- [ ] Smoke test install/uninstall/reinstall, OAuth, app loading, permissions, scan of zero/one/many products, HMAC privacy webhooks, billing, support and cross-tenant isolation.
- [ ] Release progressively; verify logs and refund/support response process.

## Current repo facts (rechecked 2026-11-04)
- Remote main is e3bf933de863fdb5ec4b6de23047c1a4b635e696 and contains the PR #2 scaffold, package.json, and shopify.app.toml.
- Shopify configuration has an empty client ID and placeholder application URL. No Shopify app credentials were configured during this check.
- Local setup and validation results are recorded in LOCAL_VALIDATION.md.
- app/lib/audit.mjs implements pure product metadata checks.
- app/lib/shopify-catalog.server.mjs pages product reads with a 500-item default ceiling.
- app/routes/app._index.tsx is an embedded read-only dashboard, displaying at most 150 findings.
- Connected merchant Shopify store is Instinct Ink Identity. **Do not install, test changes, alter checkout, or publish there during development without a separate explicit decision.**

## Official references
- https://shopify.dev/docs/apps/launch/billing/shopify-app-pricing
- https://shopify.dev/docs/apps/launch/distribution
- https://shopify.dev/docs/apps/build/compliance/privacy-law-compliance
- https://shopify.dev/docs/apps/launch/shopify-app-store/app-store-requirements

## Release decision
No paid launch or App Store submission until all P0 gates are verified in a deployed, isolated production build.
