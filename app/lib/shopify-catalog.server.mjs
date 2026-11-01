/** Shopify Admin GraphQL pagination. Authenticated admin client supplied by loader. */
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

export async function getProducts(admin, maxProducts = 500) {
  const products = [];
  let after = null;
  let hasNextPage = true;
  while (hasNextPage && products.length < maxProducts) {
    const response = await admin.graphql(PRODUCTS_QUERY, {variables:{first:Math.min(100,maxProducts-products.length), after}});
    if (!response.ok) throw new Error(`Shopify GraphQL request failed (${response.status})`);
    const payload = await response.json();
    if (payload.errors?.length) throw new Error('Shopify returned GraphQL errors. Check the app scope and API compatibility.');
    const conn = payload.data?.products;
    if (!conn?.pageInfo || !Array.isArray(conn.nodes)) throw new Error('Unexpected Shopify GraphQL response.');
    products.push(...conn.nodes);
    hasNextPage = conn.pageInfo.hasNextPage;
    if (hasNextPage && (!conn.pageInfo.endCursor || conn.pageInfo.endCursor === after)) throw new Error('Invalid pagination cursor.');
    after = conn.pageInfo.endCursor;
  }
  return {products, limited:hasNextPage, maxProducts};
}
