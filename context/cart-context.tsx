"use client";

import * as React from "react";
import type { Product } from "@/types/product";

// The cart only ever needs these fields to render (see cart-sheet.tsx) —
// pulling in the full Product shape forces every caller to fabricate
// filler values it doesn't have (e.g. rebuilding a cart line from an
// order record, which only stores id/name/price/image/brand).
export type CartProduct = Pick<
  Product,
  "id" | "name" | "price" | "image" | "brand"
>;

export type CartLine = {
  product: CartProduct;
  qty: number;
};

type CartContextValue = {
  lines: CartLine[];
  addItem: (product: CartProduct, qty?: number) => void;
  removeItem: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
};

const CartContext = React.createContext<CartContextValue | null>(null);

// Guests get their own bucket, separate from any logged-in user's cart.
const GUEST_KEY = "cart:guest";

function storageKeyFor(userId: string | null) {
  return userId ? `cart:user:${userId}` : GUEST_KEY;
}

function loadLines(key: string): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({
  children,
  userId = null,
}: {
  children: React.ReactNode;
  // Pass the current logged-in user's id, or null/undefined for a guest.
  userId?: string | null;
}) {
  const storageKey = storageKeyFor(userId);

  // IMPORTANT: always starts empty — server has no localStorage, so this
  // must match that exactly on first render. The real cart is loaded
  // client-side in the effect below, after hydration is done.
  const [lines, setLines] = React.useState<CartLine[]>([]);
  const [hydrated, setHydrated] = React.useState(false);

  // Keep track of which key we last loaded, so we can detect a user switch.
  const currentKeyRef = React.useRef<string | null>(null);

  // Load the cart from localStorage once mounted (client-only), and again
  // whenever the active user changes (login/logout swaps storage keys).
  React.useEffect(() => {
    if (currentKeyRef.current !== storageKey) {
      currentKeyRef.current = storageKey;
      setLines(loadLines(storageKey));
      setHydrated(true);
    }
  }, [storageKey]);

  const isFirstPersist = React.useRef(true);

  React.useEffect(() => {
    // Don't persist until we've actually loaded the real cart at least
    // once — otherwise this would immediately overwrite localStorage
    // with an empty array on mount, before the load effect above runs.
    if (!hydrated) return;
    if (isFirstPersist.current) {
      isFirstPersist.current = false;
      return;
    }
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(lines));
    } catch {
      // Storage can fail (quota, private mode, etc.) — cart still works
      // in-memory for the current session even if persistence fails.
    }
  }, [lines, storageKey, hydrated]);

  // qty defaults to 1 (normal "add to cart" click). Callers that need to
  // add a specific quantity in one shot — e.g. "buy again" on a past
  // order — pass it explicitly.
  const addItem = React.useCallback((product: CartProduct, qty: number = 1) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.product.id === product.id);
      if (existing) {
        return prev.map((l) =>
          l.product.id === product.id ? { ...l, qty: l.qty + qty } : l,
        );
      }
      return [...prev, { product, qty }];
    });
  }, []);

  const removeItem = React.useCallback((id: string) => {
    setLines((prev) => prev.filter((l) => l.product.id !== id));
  }, []);

  const setQty = React.useCallback((id: string, qty: number) => {
    setLines((prev) =>
      prev.map((l) =>
        l.product.id === id ? { ...l, qty: Math.max(1, qty) } : l,
      ),
    );
  }, []);

  const clear = React.useCallback(() => setLines([]), []);

  const count = lines.reduce((sum, l) => sum + l.qty, 0);
  const subtotal = lines.reduce((sum, l) => sum + l.qty * l.product.price, 0);

  return (
    <CartContext.Provider
      value={{ lines, addItem, removeItem, setQty, clear, count, subtotal }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = React.useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
