import { auditProducts } from '../../app/lib/audit.mjs';
import { getProducts } from '../../app/lib/shopify-catalog.server.mjs';
import { DEVELOPMENT_SHOP, type Config } from './security.js';

export async function scanCatalog(config: Config, maxProducts: number) {
  if (!config.shopToken) throw new Error('Development Shopify app is not installed or an offline token is not configured');
  if (!Number.isInteger(maxProducts) || maxProducts < 1 || maxProducts > 500) throw new Error('Invalid scan limit');

  // Fixed shop and fixed GraphQL endpoint: no caller-controlled URL, shop or GraphQL query.
  const url = `https://${DEVELOPMENT_SHOP}/admin/api/2026-10/graphql.json`;
  const admin = {
    graphql: (query: string, options: { variables: Record<string, unknown> }) =>
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': config.shopToken!
        },
        body: JSON.stringify({ query, variables: options.variables }),
        redirect: 'error',
        signal: AbortSignal.timeout(12000)
      })
  };
  const result = await getProducts(admin, maxProducts);
  const report = auditProducts(result.products);
  return { report, limited: result.limited, maxProducts: result.maxProducts };
}

export function safeFinding(issue: {
  code: string; severity: string; productTitle: string; message: string; suggestion: string
}) {
  // No product IDs, storefront URLs, raw descriptions, variants or merchant credentials.
  return {
    code: String(issue.code).slice(0, 64),
    severity: issue.severity,
    productTitle: String(issue.productTitle || '').slice(0, 120),
    message: String(issue.message).slice(0, 300),
    suggestion: String(issue.suggestion).slice(0, 300)
  };
}
