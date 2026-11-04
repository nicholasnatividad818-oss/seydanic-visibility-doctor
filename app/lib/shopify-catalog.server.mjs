/** Shopify Admin GraphQL pagination. Authenticated admin client supplied by loader. */
export const MAX_SYNC_PRODUCTS = 500;
export const PRODUCTS_QUERY = `#graphql
query VisibilityDoctorProducts($first: Int!, $after: String) {
  products(first: $first, after: $after, sortKey: ID) {
    nodes {
      id title description status onlineStoreUrl
      seo { title description }
      media(first: 1) { nodes { id } }
    }
    pageInfo { hasNextPage endCursor }
  }
}`;

export async function getProducts(admin, maxProducts = MAX_SYNC_PRODUCTS) {
  if (!admin || typeof admin.graphql !== 'function') throw new TypeError('Authenticated admin client required.');
  if (!Number.isSafeInteger(maxProducts) || maxProducts < 1 || maxProducts > MAX_SYNC_PRODUCTS) throw new RangeError(`maxProducts must be between 1 and ${MAX_SYNC_PRODUCTS}`);
  const products = [];
  const seenCursors = new Set();
  let after = null;
  let hasNextPage = true;
  while (hasNextPage && products.length < maxProducts) {
    const response = await admin.graphql(PRODUCTS_QUERY, {variables:{first:Math.min(100,maxProducts-products.length), after}});
    if (!response?.ok) throw new Error(`Shopify GraphQL request failed (${response.status})`);
    const payload = await response.json();
    if (payload.errors?.length) throw new Error('Shopify returned GraphQL errors. Check the app scope and API compatibility.');
    const conn = payload.data?.products;
    if (!conn?.pageInfo || !Array.isArray(conn.nodes) || typeof conn.pageInfo.hasNextPage !== 'boolean') throw new Error('Unexpected Shopify GraphQL response.');
    if (conn.nodes.length > Math.min(100, maxProducts-products.length)) throw new Error('Unexpected Shopify GraphQL page size.');
    products.push(...conn.nodes);
    hasNextPage = conn.pageInfo.hasNextPage;
    if (hasNextPage && (!conn.pageInfo.endCursor || seenCursors.has(conn.pageInfo.endCursor) || conn.nodes.length===0)) throw new Error('Invalid pagination cursor.');
    if (hasNextPage) seenCursors.add(conn.pageInfo.endCursor);
    after = conn.pageInfo.endCursor;
  }
  return {products, limited:hasNextPage, maxProducts};
}
