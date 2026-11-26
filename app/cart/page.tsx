"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/cart-context";
import { formatPHP } from "@/lib/utils";

export default function CartPage() {
  const { lines, removeItem, setQty, subtotal } = useCart();

  if (lines.length === 0) {
    return (
      <section className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-3 px-4 text-center">
        <h1 className="font-display text-3xl italic text-ink">
          Your cart is currently empty
        </h1>
        <p className="text-sm text-ink-soft">
          Browse our best sellers and add a few essentials.
        </p>
        <Link
          href="/"
          className="mt-3 bg-forest px-7 py-3.5 text-sm font-medium text-paper hover:bg-forest-deep focus-ring"
        >
          Continue shopping
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-16">
      <p className="font-mono text-xs uppercase tracking-widest2 text-ink-faint">
        Cart
      </p>
      <h1 className="mt-1 font-display text-4xl italic text-ink">
        Shopping cart
      </h1>

      <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-3">
        <ul className="flex flex-col lg:col-span-2">
          {lines.map((line) => (
            <li
              key={line.product.id}
              className="flex gap-5 border-b border-paper-line py-6 first:pt-0"
            >
              <div className="relative h-24 w-24 shrink-0 overflow-hidden bg-moss-pale">
                <Image
                  src={line.product.image}
                  alt={line.product.name}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-display text-lg italic text-ink">
                    {line.product.name}
                  </h2>
                  <button
                    onClick={() => removeItem(line.product.id)}
                    className="text-xs font-medium uppercase tracking-widest2 text-ink-faint hover:text-forest focus-ring rounded"
                  >
                    Remove
                  </button>
                </div>
                <p className="font-mono text-xs text-ink-faint">
                  {formatPHP(line.product.price)}
                </p>
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center border border-paper-line">
                    <button
                      className="px-3 py-1.5 text-ink hover:text-forest focus-ring"
                      onClick={() => setQty(line.product.id, line.qty - 1)}
                      aria-label={`Decrease quantity of ${line.product.name}`}
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-mono text-sm">
                      {line.qty}
                    </span>
                    <button
                      className="px-3 py-1.5 text-ink hover:text-forest focus-ring"
                      onClick={() => setQty(line.product.id, line.qty + 1)}
                      aria-label={`Increase quantity of ${line.product.name}`}
                    >
                      +
                    </button>
                  </div>
                  <p className="font-mono text-sm text-ink">
                    {formatPHP(line.product.price * line.qty)}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit border border-paper-line p-6">
          <h2 className="font-display text-xl italic text-ink">
            Order summary
          </h2>
          <div className="mt-4 flex items-center justify-between text-sm text-ink-soft">
            <span>Subtotal</span>
            <span className="font-mono text-ink">{formatPHP(subtotal)}</span>
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-paper-line pt-4 font-display text-lg italic text-ink">
            <span>Total</span>
            <span className="font-mono not-italic text-base">
              {formatPHP(subtotal)}
            </span>
          </div>
          <Link
            href="/checkout"
            className="mt-6 block w-full bg-forest py-3.5 text-center text-sm font-medium text-paper hover:bg-forest-deep focus-ring"
          >
            Proceed to checkout
          </Link>
        </aside>
      </div>
    </section>
  );
}
