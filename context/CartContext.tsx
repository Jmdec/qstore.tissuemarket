"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  ReactNode,
} from "react";

export type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  unit: string;
};

export type CartLine = Product & { qty: number };

type CartContextValue = {
  lines: CartLine[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (product: Product, qty?: number) => void;
  removeItem: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  subtotal: number;
  itemCount: number;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  // qty defaults to 1 (a normal "Add to Cart" click). Callers that need
  // to add a specific quantity in one shot — e.g. "buy again" on a past
  // order — pass it explicitly.
  const addItem = useCallback((product: Product, qty: number = 1) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.id === product.id);
      if (existing) {
        return prev.map((l) =>
          l.id === product.id ? { ...l, qty: l.qty + qty } : l,
        );
      }
      return [...prev, { ...product, qty }];
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    setLines((prev) =>
      prev
        .map((l) => (l.id === id ? { ...l, qty: Math.max(1, qty) } : l))
        .filter((l) => l.qty > 0),
    );
  }, []);

  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + l.price * l.qty, 0),
    [lines],
  );
  const itemCount = useMemo(
    () => lines.reduce((sum, l) => sum + l.qty, 0),
    [lines],
  );

  const value: CartContextValue = {
    lines,
    isOpen,
    openCart,
    closeCart,
    addItem,
    removeItem,
    setQty,
    subtotal,
    itemCount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
