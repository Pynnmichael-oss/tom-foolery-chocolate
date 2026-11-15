import { GIFT_SETS, getGiftBuilderConfig } from "@/lib/gift-builder/queries";
import { formatMoney } from "@/lib/shopify/format";
import { getProducts, getShopPolicies } from "@/lib/shopify/queries";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

// Regenerated hourly, same window as the catalog data it's built from.
export const revalidate = 3600;

async function giftSetIsLive(handle: string): Promise<boolean> {
  try {
    return (await getGiftBuilderConfig(handle)) !== null;
  } catch {
    return false;
  }
}

/**
 * /llms.txt — a plain-text map of the site for AI assistants (the
 * llmstxt.org convention): what the shop is, then one line per page worth
 * reading. Built from the live catalog so products and prices never drift
 * from what the site itself shows.
 */
export async function GET() {
  const [products, policies, barsLive, caramelsLive] = await Promise.all([
    getProducts(),
    getShopPolicies(),
    giftSetIsLive(GIFT_SETS.bars),
    giftSetIsLive(GIFT_SETS.caramels),
  ]);

  const productLines = products.map((product) => {
    const options = product.variants
      .filter((v) => v.title && v.title !== "Default Title")
      .map((v) => `${v.title} ${formatMoney(v.price)}`)
      .join(", ");
    const price = options || formatMoney(product.priceRange.min);
    const description = product.description.trim().replace(/\s+/g, " ");
    return `- [${product.title}](${SITE_URL}/shop/${product.handle}): ${description}${
      description && !/[.!?]$/.test(description) ? "." : ""
    } ${price}.`;
  });

  const giftLines = [
    barsLive
      ? `- [Build Your Own Chocolate Bar Gift Set](${SITE_URL}/gifts/build): Pick 3 or 6 bars, a band for the occasion, optional gift wrap and a note.`
      : null,
    caramelsLive
      ? `- [Malört Caramel Gift Set](${SITE_URL}/gifts/build?set=caramels): A box of 4 or 8 Malört caramels with a band for the occasion, optional gift wrap and a note.`
      : null,
    `- [Custom, branded and event gifting](${SITE_URL}/gifting): Custom packaging and assortments for companies, weddings and events, plus ready-to-ship options. Inquiry form on the page.`,
  ].filter(Boolean);

  const policyLines = [
    policies.privacyPolicy ? `- [Privacy Policy](${SITE_URL}/privacy)` : null,
    policies.refundPolicy ? `- [Refund Policy](${SITE_URL}/returns)` : null,
    policies.shippingPolicy ? `- [Shipping Policy](${SITE_URL}/shipping)` : null,
    policies.termsOfService ? `- [Terms of Service](${SITE_URL}/terms)` : null,
  ].filter(Boolean);

  const body = [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    "Tom Foolery Chocolate (also written Tom Foolery Chocolates) is a small-batch chocolate maker in Chicago, Illinois. It sells chocolate bars, Malört caramels, sampler packs and gift sets online, and takes custom orders for corporate, wedding and event gifting. The brand is named for Tom Meldrum, the founder's grandfather, who ran the Sugar Bowl candy store in Massillon, Ohio.",
    "",
    "## Products",
    "",
    ...productLines,
    `- [All products](${SITE_URL}/shop)`,
    "",
    "## Gifting",
    "",
    ...giftLines,
    "",
    "## About",
    "",
    `- [Our story](${SITE_URL}/story): The family history behind the brand, from Tom Meldrum's Sugar Bowl to Tom Foolery.`,
    `- [Contact](${SITE_URL}/contact): Questions and wholesale inquiries.`,
    ...(policyLines.length > 0 ? ["", "## Policies", "", ...policyLines] : []),
    "",
  ].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
