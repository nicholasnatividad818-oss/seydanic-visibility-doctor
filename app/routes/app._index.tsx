import { useLoaderData } from 'react-router';
import type { LoaderFunctionArgs } from 'react-router';
import { authenticate } from '../shopify.server';
import { auditProducts } from '../lib/audit.mjs';
import { getProducts } from '../lib/shopify-catalog.server.mjs';

export async function loader({request}:LoaderFunctionArgs) {
  const {admin} = await authenticate.admin(request);
  try {
    const {products,limited,maxProducts} = await getProducts(admin,500);
    return {report:auditProducts(products), limited, maxProducts, error:null};
  } catch (e) {
    console.error('Visibility Doctor scan failed', e);
    return {report:null, limited:false, maxProducts:500, error:'Scan failed. Verify read_products permissions, API connectivity, and server logs.'};
  }
}

export default function Dashboard() {
  const data = useLoaderData<typeof loader>();
  return <s-page heading="SEYDANIC Visibility Doctor">
    <s-section heading="Read-only catalog health">
      <s-paragraph>Product metadata checks only. This application does not edit products, inventory, checkout, or your storefront.</s-paragraph>
      {data.error ? <s-banner tone="critical">{data.error}</s-banner> : null}
      {data.report ? <>
        <s-paragraph>Scanned {data.report.scanned} products ({data.report.active} active). Found {data.report.issues.length} findings: {data.report.counts.high} high, {data.report.counts.medium} medium, {data.report.counts.low} low.</s-paragraph>
        {data.limited ? <s-banner tone="warning">Scan limited to the first {data.maxProducts} products. Results are incomplete; do not interpret these counts as a full-catalog audit.</s-banner> : null}
        <s-section heading="Prioritized findings">
          {data.report.issues.length===0 ? <s-paragraph>No issues detected by these baseline rules. This is not a full SEO or checkout health guarantee.</s-paragraph> : <s-table>
            <s-table-header-row><s-table-header>Severity</s-table-header><s-table-header>Product</s-table-header><s-table-header>Issue</s-table-header><s-table-header>Suggested action</s-table-header></s-table-header-row>
            <s-table-body>
              {data.report.issues.slice(0,150).map(issue => <s-table-row key={issue.id}>
                <s-table-cell>{issue.severity.toUpperCase()}</s-table-cell>
                <s-table-cell>{issue.productTitle || '(Untitled)'}</s-table-cell>
                <s-table-cell>{issue.message}</s-table-cell>
                <s-table-cell>{issue.suggestion}</s-table-cell>
              </s-table-row>)}
            </s-table-body>
          </s-table>}
          {data.report.issues.length>150 ? <s-paragraph>Showing the first 150 prioritized findings. Additional findings exist but are not displayed.</s-paragraph> : null}
        </s-section>
      </> : null}
    </s-section>
  </s-page>;
}
