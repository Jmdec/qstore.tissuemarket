/**
 * Turns a product name into a URL-safe slug.
 * e.g. "Fresh Premium Eco-Pulp Bathroom Tissue 3 Ply 5+1 Rolls"
 *   -> "fresh-premium-eco-pulp-bathroom-tissue-3-ply-5-1-rolls"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Builds the "id-slug" path segment used in product URLs, e.g. "123-tissue-name".
 * The numeric id always leads, so lookups only ever need the id — the slug
 * part is purely cosmetic/SEO and never used to identify the product.
 */
export function buildProductSlug(id: string | number, name: string): string {
  const slug = slugify(name);
  return slug ? `${id}-${slug}` : `${id}`;
}

/**
 * Builds a full "/{basePath}/{id}-{slug}" href, e.g. "/products/123-tissue-name"
 * or "/promos/123-tissue-name". The numeric id always leads, so lookups only
 * ever need the id — the slug part is purely cosmetic/SEO.
 */
function buildSlugHref(
  basePath: string,
  product: { id: string | number; name: string },
): string {
  return `${basePath}/${buildProductSlug(product.id, product.name)}`;
}

export function buildProductHref(product: {
  id: string | number;
  name: string;
}): string {
  return buildSlugHref("/products", product);
}

export function buildPromoHref(product: {
  id: string | number;
  name: string;
}): string {
  return buildSlugHref("/promos", product);
}

/**
 * Extracts the leading numeric id from a combined "id-slug" route param.
 * Returns null if no leading id could be parsed.
 */
export function parseProductId(param: string): string | null {
  const match = param.match(/^(\d+)/);
  return match ? match[1] : null;
}
