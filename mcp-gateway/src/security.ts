import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import type { AuthInfo } from '@modelcontextprotocol/server';

export const DEVELOPMENT_SHOP = 'seydanic-visibility-doctor-test.myshopify.com';
export const REQUIRED_SCOPE = 'visibility:read';

export type Config = {
  resourceUrl: URL;
  issuer: string;
  jwksUrl: URL;
  allowedSubject: string;
  allowedClientId: string;
  shopToken?: string;
  port: number;
};

export function readConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const fail = (key: string): never => { throw new Error(`Missing or invalid required setting: ${key}`); };
  const resource = env.MCP_RESOURCE_URL || fail('MCP_RESOURCE_URL');
  const issuer = env.MCP_OAUTH_ISSUER || fail('MCP_OAUTH_ISSUER');
  const jwks = env.MCP_OAUTH_JWKS_URL || fail('MCP_OAUTH_JWKS_URL');
  const subject = env.MCP_ALLOWED_SUBJECT || fail('MCP_ALLOWED_SUBJECT');
  const client = env.MCP_ALLOWED_CLIENT_ID || fail('MCP_ALLOWED_CLIENT_ID');
  const resourceUrl = new URL(resource);
  const jwksUrl = new URL(jwks);
  if (resourceUrl.protocol !== 'https:' || resourceUrl.pathname !== '/mcp' || resourceUrl.search || resourceUrl.hash) fail('MCP_RESOURCE_URL');
  if (new URL(issuer).protocol !== 'https:' || jwksUrl.protocol !== 'https:') fail('MCP_OAUTH_ISSUER / MCP_OAUTH_JWKS_URL');
  if (!Number.isSafeInteger(Number(env.MCP_PORT || 3001)) || Number(env.MCP_PORT || 3001) < 1 || Number(env.MCP_PORT || 3001) > 65535) fail('MCP_PORT');
  // Never accept a store/domain from a caller or environment: shop is hard-locked in source.
  return {
    resourceUrl, issuer, jwksUrl, allowedSubject: subject, allowedClientId: client,
    shopToken: env.SHOPIFY_DEV_OFFLINE_ACCESS_TOKEN,
    port: Number(env.MCP_PORT || 3001)
  };
}

export function authorizeClaims(payload: JWTPayload, config: Config): AuthInfo {
  const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  const clientId = payload.client_id ?? payload.azp;
  const scope = payload.scope;
  const scopes = typeof scope === 'string' ? scope.split(/\s+/).filter(Boolean) : [];
  if (!aud.includes(config.resourceUrl.href) ||
      payload.iss !== config.issuer ||
      payload.sub !== config.allowedSubject ||
      clientId !== config.allowedClientId ||
      !Number.isSafeInteger(payload.exp) ||
      !scopes.includes(REQUIRED_SCOPE)) {
    throw new Error('Unauthorized MCP caller');
  }
  return {
    token: '', // Replaced with the provided token by verifier.
    clientId: String(clientId),
    scopes,
    expiresAt: payload.exp,
    resource: config.resourceUrl
  };
}

export function createTokenVerifier(config: Config) {
  const keys = createRemoteJWKSet(config.jwksUrl);
  return {
    async verifyAccessToken(token: string): Promise<AuthInfo> {
      // Only asymmetric signatures accepted. JWT exp, nbf, issuer, audience and signature checked by jose.
      const { payload } = await jwtVerify(token, keys, {
        issuer: config.issuer,
        audience: config.resourceUrl.href,
        algorithms: ['RS256', 'ES256'],
        clockTolerance: '5s'
      });
      return { ...authorizeClaims(payload, config), token };
    }
  };
}
