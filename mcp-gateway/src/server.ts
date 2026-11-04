import { createMcpExpressApp, getOAuthProtectedResourceMetadataUrl, requireBearerAuth } from '@modelcontextprotocol/express';
import { toNodeHandler } from '@modelcontextprotocol/node';
import { createMcpHandler, McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import { readConfig, createTokenVerifier, DEVELOPMENT_SHOP, REQUIRED_SCOPE } from './security.js';
import { scanCatalog, safeFinding } from './catalog.js';

const config = readConfig();
const resourceMetadataUrl = getOAuthProtectedResourceMetadataUrl(config.resourceUrl);
const auth = requireBearerAuth({
  verifier: createTokenVerifier(config),
  requiredScopes: [REQUIRED_SCOPE],
  resourceMetadataUrl,
  expectedResource: config.resourceUrl
});

// In-memory per-client bound; also enforce gateway rate limits at ingress/proxy in deployments.
const accessTimes = new Map<string, number[]>();
function allowScan(client: string): boolean {
  const now = Date.now();
  const recent = (accessTimes.get(client) ?? []).filter(t => now - t < 60000);
  if (recent.length >= 5) { accessTimes.set(client, recent); return false; }
  recent.push(now);
  accessTimes.set(client, recent);
  if (accessTimes.size > 1000) accessTimes.clear();
  return true;
}

function textResult(value: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(value) }] };
}
function failure() {
  return { isError: true, content: [{ type: 'text' as const, text: 'Unable to complete read-only scan; check development app installation, read_products scope and server logs.' }] };
}
const handler = createMcpHandler(() => {
  const server = new McpServer({ name: 'seydanic-visibility-doctor', version: '0.1.0' });
  server.registerTool('get_app_status', {
    description: 'Report read-only development gateway configuration status (not a Shopify install proof).',
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false }
  }, async () => textResult({
    shop: DEVELOPMENT_SHOP,
    mode: 'read-only',
    shopTokenConfigured: Boolean(config.shopToken),
    oauth: 'validated bearer token',
    installed: 'not verified by this tool'
  }));

  server.registerTool('get_audit_rules', {
    description: 'Explain the static product metadata checks performed by Visibility Doctor.',
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false }
  }, async () => textResult({
    scannedStatuses: ['ACTIVE'],
    checks: ['MISSING_TITLE', 'DUPLICATE_TITLE', 'MISSING_DESCRIPTION', 'THIN_DESCRIPTION', 'MISSING_IMAGE', 'MISSING_SEO_TITLE', 'MISSING_META_DESCRIPTION', 'STOREFRONT_URL_UNAVAILABLE'],
    limits: { products: 500, returnedFindings: 50 },
    note: 'Metadata diagnostics only; not Google indexing, performance, checkout or inventory verification.'
  }));

  server.registerTool('get_catalog_health', {
    description: 'Summarize product metadata health for the single allowlisted development shop.',
    inputSchema: z.object({ maxProducts: z.number().int().min(1).max(500).default(100) }),
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true }
  }, async ({ maxProducts }, ctx) => {
    if (!allowScan(ctx.http?.authInfo?.clientId ?? 'anonymous')) return failure();
    try {
      const { report, limited } = await scanCatalog(config, maxProducts);
      return textResult({ shop: DEVELOPMENT_SHOP, scanned: report.scanned, active: report.active, counts: report.counts, limited });
    } catch { return failure(); }
  });

  server.registerTool('list_audit_findings', {
    description: 'Return sanitized, prioritized product metadata findings from the allowlisted development shop.',
    inputSchema: z.object({
      maxProducts: z.number().int().min(1).max(500).default(100),
      severity: z.enum(['all', 'high', 'medium', 'low']).default('all'),
      limit: z.number().int().min(1).max(50).default(25)
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true }
  }, async ({ maxProducts, severity, limit }, ctx) => {
    if (!allowScan(ctx.http?.authInfo?.clientId ?? 'anonymous')) return failure();
    try {
      const { report, limited } = await scanCatalog(config, maxProducts);
      const matched = report.issues.filter((f: { severity: string }) => severity === 'all' || f.severity === severity);
      return textResult({ shop: DEVELOPMENT_SHOP, totalMatching: matched.length, limited, findings: matched.slice(0, limit).map(safeFinding) });
    } catch { return failure(); }
  });
  return server;
}, { responseMode: 'json' });

const app = createMcpExpressApp({
  host: '127.0.0.1',
  allowedHosts: ['localhost', '127.0.0.1', config.resourceUrl.hostname],
  allowedOrigins: [config.resourceUrl.origin]
});
app.disable('x-powered-by');
app.get('/.well-known/oauth-protected-resource/mcp', (_req, res) => {
  res.json({
    resource: config.resourceUrl.href,
    authorization_servers: [config.issuer],
    scopes_supported: [REQUIRED_SCOPE],
    bearer_methods_supported: ['header']
  });
});
const node = toNodeHandler(handler);
app.all('/mcp', auth, (req, res) => void node(req, res, req.body));
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
// Local-only. Terminate TLS and enforce public Host/Origin and limits at a dedicated trusted gateway.
app.listen(config.port, '127.0.0.1', () => {
  console.log(`SEYDANIC MCP development gateway listening on 127.0.0.1:${config.port}`);
});
