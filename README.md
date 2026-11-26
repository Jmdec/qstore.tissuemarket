# Quanta Paper

A hygiene & household paper goods storefront built with Next.js (App Router), TypeScript, Tailwind CSS, and shadcn/ui primitives (Radix under the hood).

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:3000

## What's included

- **Navbar** — logo, search, category links, account menu (login/register dialog), cart drawer with live item count
- **Hero** — nature-green gradient hero section
- **Category strip** — visual category shortcuts
- **Shop section** — category tabs + sidebar filters (brand, price, in-stock, on-sale) + product grid
- **Product cards** — folded paper-corner signature detail, add-to-cart
- **Cart** — slide-out sheet, quantity controls, subtotal
- **Checkout** (`/checkout`) — shipping + payment form, order summary
- **Orders** (`/orders`) — placeholder order history page
- **Footer** — categories, help links, newsletter signup

## Structure

```
app/
  layout.tsx        Root layout (fonts, CartProvider)
  page.tsx           Homepage
  checkout/page.tsx
  orders/page.tsx
  globals.css        Theme tokens, gradient, deckle-edge + paper-fold signature styles
components/
  ui/                shadcn primitives (button, badge, input, tabs, sheet, dialog, dropdown-menu, checkbox, slider, separator, scroll-area, label)
  navbar.tsx
  hero.tsx
  category-strip.tsx
  shop-section.tsx
  filter-sidebar.tsx
  product-card.tsx
  brand-strip.tsx
  footer.tsx
  cart-sheet.tsx
  auth-dialog.tsx
context/
  cart-context.tsx   Global cart state (React Context)
data/
  products.ts         Sample product + category + brand data
lib/
  utils.ts            cn() helper + PHP currency formatter
```

## Notes

- Cart state is in-memory (React Context) — wire it up to your backend/cart API for persistence.
- The login/register dialog and checkout form are UI-only; hook up your auth and payment provider of choice.
- All product data in `types/product.ts` is placeholder — swap in your real catalog.
- Color system lives in `tailwind.config.ts` (`moss` scale) and `app/globals.css` (HSL theme tokens) — change there to retheme globally.
