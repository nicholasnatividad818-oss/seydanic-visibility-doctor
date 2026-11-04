# SEYDANIC Visibility Doctor — read-only MCP development gateway

**Review-only scaffold. Not installed, deployed, merged or linked to ChatGPT.** Isolated from the Shopify React Router application; no mutation routes, billing integration, product writes or live-store access.

## Architecture
- Model Context Protocol TypeScript SDK **v2**, stateless Streamable HTTP at `/mcp`.
- OAuth **resource server only**: validates an external identity provider's signed JWT with remote JWKS. No token issuance, login form, password handling or static shared API key.
- Strict issuer, audience (`MCP_RESOURCE_URL`), authorized subject, authorized OAuth client ID, expiration and `visibility:read` scope checks. RS256/ES256 only. A properly configured external OAuth 2.1 AS supporting ChatGPT clients is required.
- RFC 9728 protected resource metadata at `/.well-known/oauth-protected-resource/mcp`, pointing to the configured OAuth authorization server.
- **Only shop:** `seydanic-visibility-doctor-test.myshopify.com`. Hard-coded constant, not caller or env selectable. Backend uses `read_products` offline access token from this *development app only*, stored in secret manager at runtime.
- Shared existing pure scanner `app/lib/audit.mjs` + read-only catalog paginator `app/lib/shopify-catalog.server.mjs`, with hard-coded GraphQL path and query.
- Returns sanitized metadata findings, never raw product records, customer data, Shopify tokens or OAuth tokens.
- No mutation tools registered; no install/configure/deploy tool exposed.

## Four tools
- `get_app_status`: gateway readiness; **not** proof that Shopify is installed.
- `get_audit_rules`: existing rule names and declared limitations.
- `get_catalog_health`: counts for up to 500 development products.
- `list_audit_findings`: sanitized findings, 50 maximum, with severity filter.

## Local development
Requires Node >=22.12, with credentials held privately and NOT committed.

```bash
cd mcp-gateway
npm install
npm run typecheck
npm test
cp .env.example .env
# Set values securely in your environment / secret manager (the example .env is NOT loaded automatically).
npm start
```

Do not expose the loopback listener directly. A trusted TLS reverse proxy must authenticate its own public endpoint, restrict Host/Origin, terminate HTTPS, enforce request-body and request-rate limits, and proxy to `127.0.0.1:3001`. Only enable the public endpoint after security review. This scaffold does NOT provision a proxy or identity provider.

Before running, configure a genuine OAuth authorization server supporting authorization code + PKCE, register the MCP resource URI as a permitted audience, grant only `visibility:read` to approved user/client, and check that the issuer's OIDC/JWKS metadata is valid. An existing Shopify app installation and *its own development-store token* with `read_products` are required before live catalog tools can succeed. A ChatGPT connector token or a live-store token must not be reused.

## Security tests and known gaps
`npm test` verifies config fail-closed, isolation, claimed issuer/audience/client/scope controls, and output filtering. It does **not** establish a successful OAuth exchange, verify real JWT signatures end-to-end, prove Shopify app installation, or test real-store GraphQL. Run an MCP client integration suite, valid/invalid token tests against configured IdP, SSRF/Host/Origin/replay/rate-limit checks, and real installation + product scans prior to accepting a deployment.

The in-memory scan limiter is a development guard, **not** a distributed production rate limit. Shopify token rotation and revocation, per-tenant identity binding, production secret storage, IdP availability, and privacy compliance require separate operational review. The gateway never reads the live Instinct Ink Identity shop.
