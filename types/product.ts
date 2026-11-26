export type Category =
  | "Paper"
  | "Personal Care"
  | "Oral Care"
  | "Baby Care"
  | "Health and Beauty";

export type Product = {
  id: string;
  name: string;
  brand: string;
  category: Category;
  price: number;
  originalPrice: number | null;
  rating: number;
  reviews: number;
  tag: "Best Seller" | "New" | "Bundle" | "Eco" | null;
  inStock: boolean;
  stock: number;
  blurb: string | null;
  color: string | null; // tailwind gradient classes for the placeholder art
  image: string; // relative path from backend, e.g. "/products/xyz.jpg"
  isPromo: boolean;
  promoStart: string | null; // ISO date, e.g. "2026-08-01"
  promoEnd: string | null; // ISO date, e.g. "2026-08-15"
  totalOrders?: number; // only present on the best-sellers response
};

// Sections shown in the UI (tabs, navbar strip), in display order.
// "Health and Beauty" is still a valid backend Category but is no longer
// listed as a section.
export const CATEGORIES: Category[] = [
  "Paper",
  "Personal Care",
  "Oral Care",
  "Baby Care",
];

// Display-only labels — the underlying Category values stay as "Paper" etc.
// (they must match what the Laravel backend sends and what's used in URLs
// and filtering). This map only controls what text shows in the UI.
export const CATEGORY_LABELS: Record<Category, string> = {
  Paper: "Paper",
  "Personal Care": "Personal Care",
  "Oral Care": "Oral Care",
  "Baby Care": "Baby Care",
  "Health and Beauty": "Health and Beauty",
};

export const BRANDS = [
  "Fresh",
  "Kami",
  "Smart Choice",
  "Vanitá",
  "Harmony",
  "Sweetbaby",
  "PrimeCare",
  "Life Defender",
  "TeaBiotic",
  "Eco Hygiene",
];

// A promo only counts as "live" if the flag is on AND today falls inside the
// start/end range (a missing side is treated as open-ended on that side).
// Shared by the admin panel and the storefront so both agree on what "live" means.
export function isPromoActive(
  product: Pick<Product, "isPromo" | "promoStart" | "promoEnd">,
): boolean {
  if (!product.isPromo) return false;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (product.promoStart) {
    const start = new Date(product.promoStart);
    if (now < start) return false;
  }
  if (product.promoEnd) {
    const end = new Date(product.promoEnd);
    end.setHours(23, 59, 59, 999);
    if (now > end) return false;
  }
  return true;
}
