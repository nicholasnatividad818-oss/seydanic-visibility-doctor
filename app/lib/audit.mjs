/** Pure, side-effect-free catalog checks; no API calls or writes. */
const normalize = (value) => String(value ?? '').trim().toLocaleLowerCase('en-US').replace(/\s+/g, ' ');

export function auditProducts(products) {
  const titleCounts = new Map();
  for (const product of products) {
    const key = normalize(product.title);
    if (key) titleCounts.set(key, (titleCounts.get(key) ?? 0) + 1);
  }

  const issues = [];
  const add = (product, code, severity, message, suggestion) => issues.push({
    id: `${product.id}:${code}`, productId: product.id, productTitle: product.title,
    code, severity, message, suggestion, url: product.onlineStoreUrl ?? null,
  });
  for (const p of products) {
    if (p.status !== 'ACTIVE') continue;
    if (!p.title?.trim()) add(p, 'MISSING_TITLE', 'high', 'No product title', 'Add a descriptive product title.');
    if ((titleCounts.get(normalize(p.title)) ?? 0) > 1) add(p, 'DUPLICATE_TITLE', 'medium', 'Title shared by multiple products', 'Make this title distinguish the design and product type.');
    if (!p.description?.trim()) add(p, 'MISSING_DESCRIPTION', 'high', 'Empty product description', 'Describe the item, materials, fit, and shopper benefits.');
    else if (p.description.trim().length < 120) add(p, 'THIN_DESCRIPTION', 'low', 'Short product description', 'Consider adding useful, unique product details (not filler).');
    if (!p.media?.nodes?.length) add(p, 'MISSING_IMAGE', 'high', 'No product media', 'Add accurate, high-quality product imagery.');
    if (!p.seo?.title?.trim()) add(p, 'MISSING_SEO_TITLE', 'medium', 'No custom SEO title', 'Consider a concise, unique SEO title. Shopify may fall back to the product title.');
    if (!p.seo?.description?.trim()) add(p, 'MISSING_META_DESCRIPTION', 'medium', 'No custom SEO description', 'Write a specific search snippet. Shopify may generate a fallback.');
    if (!p.onlineStoreUrl) add(p, 'STOREFRONT_URL_UNAVAILABLE', 'low', 'No public online-store URL returned', 'Confirm Online Store publication, channel availability and storefront access manually.');
  }
  const order = {high:0, medium:1, low:2};
  issues.sort((a,b) => order[a.severity] - order[b.severity] || a.productTitle.localeCompare(b.productTitle));
  return {scanned:products.length, active:products.filter(p=>p.status==='ACTIVE').length, issues,
    counts:{high:issues.filter(i=>i.severity==='high').length, medium:issues.filter(i=>i.severity==='medium').length, low:issues.filter(i=>i.severity==='low').length}};
}
