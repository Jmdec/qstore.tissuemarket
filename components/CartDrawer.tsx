"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";

const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_URL ?? "";

function resolveImageUrl(path: string | null | undefined): string {
  if (!path) return "/products/placeholder.jpg";
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("blob:")
  ) {
    return path;
  }
  return `${IMAGE_BASE_URL}${path}`;
}

export default function CartDrawer() {
  const { lines, isOpen, closeCart, removeItem, setQty, subtotal } = useCart();

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-ink/30 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={closeCart}
        aria-hidden="true"
      />

      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md transform flex-col border-l border-paper-line transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ backgroundColor: "#FAF9F5", opacity: 1 }} // 🔧 forced opaque, replace hex with your actual paper color
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        <div className="flex items-center justify-between border-b border-paper-line px-6 py-5">
          <h2 className="font-display text-xl italic text-ink">Your cart</h2>
          <button
            onClick={closeCart}
            className="text-ink-soft hover:text-forest focus-ring"
            aria-label="Close cart"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
              <path
                d="M6 6l12 12M18 6 6 18"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {lines.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
              <p className="font-display text-xl italic text-ink">
                Your cart is empty
              </p>
              <p className="text-sm text-ink-soft">
                Add a few essentials and they&apos;ll show up here.
              </p>
              <Link
                href="/"
                onClick={closeCart}
                className="mt-4 bg-forest px-6 py-3 text-sm font-medium text-paper hover:bg-forest-deep focus-ring"
              >
                Browse products
              </Link>
            </div>
          ) : (
            <ul className="flex flex-col gap-5">
              {lines.map((line) => (
                <li
                  key={line.id}
                  className="flex gap-4 border-b border-paper-line pb-5"
                >
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden bg-moss-pale">
                    <Image
                      src={resolveImageUrl(line.image)}
                      alt={line.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <p className="text-sm font-medium text-ink">{line.name}</p>
                    <p className="font-mono text-xs text-ink-faint">
                      ₱{line.price} / {line.unit}
                    </p>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center border border-paper-line">
                        <button
                          className="px-2.5 py-1 text-ink hover:text-forest focus-ring"
                          onClick={() => setQty(line.id, line.qty - 1)}
                          aria-label={`Decrease quantity of ${line.name}`}
                        >
                          −
                        </button>
                        <span className="w-6 text-center font-mono text-sm">
                          {line.qty}
                        </span>
                        <button
                          className="px-2.5 py-1 text-ink hover:text-forest focus-ring"
                          onClick={() => setQty(line.id, line.qty + 1)}
                          aria-label={`Increase quantity of ${line.name}`}
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(line.id)}
                        className="text-xs font-medium uppercase tracking-widest2 text-ink-faint hover:text-forest focus-ring rounded"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {lines.length > 0 && (
          <div
            className="border-t border-paper-line px-6 py-5"
            style={{ backgroundColor: "#FAF9F5" }}
          >
            <div className="mb-4 flex items-center justify-between text-sm">
              <span className="text-ink-soft">Subtotal</span>
              <span className="font-mono text-base text-ink">
                ₱{subtotal.toFixed(2)}
              </span>
            </div>
            <Link
              href="/checkout"
              onClick={closeCart}
              className="block w-full bg-forest py-3.5 text-center text-sm font-medium text-paper hover:bg-forest-deep focus-ring"
            >
              Check out
            </Link>
            <Link
              href="/cart"
              onClick={closeCart}
              className="mt-2 block w-full border border-ink py-3.5 text-center text-sm font-medium text-ink hover:border-forest hover:text-forest focus-ring"
            >
              View full cart
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
