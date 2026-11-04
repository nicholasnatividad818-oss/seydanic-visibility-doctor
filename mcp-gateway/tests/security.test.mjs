import test from 'node:test';
import assert from 'node:assert/strict';
import { readConfig, authorizeClaims, DEVELOPMENT_SHOP } from '../dist/mcp-gateway/src/security.js';
import { safeFinding } from '../dist/mcp-gateway/src/catalog.js';

const env = {
  MCP_RESOURCE_URL: 'https://mcp-dev.example.com/mcp',
  MCP_OAUTH_ISSUER: 'https://idp.example.com/',
  MCP_OAUTH_JWKS_URL: 'https://idp.example.com/.well-known/jwks.json',
  MCP_ALLOWED_SUBJECT: 'operator-1',
  MCP_ALLOWED_CLIENT_ID: 'approved-chatgpt-client'
};
const cfg = readConfig(env);
const valid = {
  iss: cfg.issuer, aud: cfg.resourceUrl.href,
  sub: cfg.allowedSubject, client_id: cfg.allowedClientId,
  exp: Math.floor(Date.now() / 1000) + 300,
  scope: 'visibility:read'
};

test('hard-coded development shop cannot be changed by env', () => {
  assert.equal(DEVELOPMENT_SHOP, 'seydanic-visibility-doctor-test.myshopify.com');
  assert.equal(readConfig({...env, SHOPIFY_SHOP:'instinctinkidentity.myshopify.com'}).resourceUrl.href, cfg.resourceUrl.href);
});
test('must configure OAuth issuer audience subject client and JWKS', () => {
  for (const key of Object.keys(env)) assert.throws(() => readConfig({...env,[key]:''}));
  assert.throws(() => readConfig({...env,MCP_RESOURCE_URL:'http://mcp-dev.example.com/mcp'}));
});
test('validated caller requires audience issuer subject client and read-only scope', () => {
  assert.equal(authorizeClaims(valid, cfg).scopes[0], 'visibility:read');
  for (const [key,bad] of [['aud','https://other.example/mcp'],['iss','https://other.example/'],['sub','other-user'],['client_id','other-client'],['scope','products:write'],['exp',undefined]]) {
    assert.throws(() => authorizeClaims({...valid,[key]:bad},cfg), key);
  }
});
test('finding output excludes product identifiers URLs and descriptions', () => {
  const item = safeFinding({code:'MISSING_IMAGE',severity:'high',productTitle:'Test',message:'Missing',suggestion:'Add an image',productId:'secret',url:'https://secret',description:'private'});
  assert.deepEqual(Object.keys(item), ['code','severity','productTitle','message','suggestion']);
});
