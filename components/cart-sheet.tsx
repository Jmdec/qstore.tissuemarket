"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/context/cart-context";
import { formatPHP } from "@/lib/utils";

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

export function CartSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { lines, removeItem, setQty, subtotal, count } = useCart();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Your cart{" "}
            {count > 0 && <span className="text-moss-600">({count})</span>}
          </SheetTitle>
        </SheetHeader>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-moss-50">
              <ShoppingCart className="h-7 w-7 text-moss-400" />
            </div>
            <p className="font-display text-lg text-moss-900">
              Your cart is empty
            </p>
            <p className="max-w-[220px] text-sm text-muted-foreground">
              Add a few everyday essentials and they'll show up here.
            </p>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Keep browsing
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto pr-1">
              {lines.map((line) => (
                <div key={line.product.id} className="flex gap-3">
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-moss-50">
                    <Image
                      src={resolveImageUrl(line.product.image)}
                      alt={line.product.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold text-moss-900">
                      {line.product.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {line.product.brand}
                    </p>
                    <div className="mt-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 rounded-full border border-moss-200 px-1.5 py-0.5">
                        <button
                          className="rounded-full p-1 hover:bg-moss-50"
                          onClick={() => setQty(line.product.id, line.qty - 1)}
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-4 text-center text-xs font-semibold">
                          {line.qty}
                        </span>
                        <button
                          className="rounded-full p-1 hover:bg-moss-50"
                          onClick={() => setQty(line.product.id, line.qty + 1)}
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="text-sm font-semibold text-moss-900">
                        {formatPHP(line.product.price * line.qty)}
                      </span>
                    </div>
                  </div>
                  <button
                    className="h-fit rounded-full p-1.5 text-muted-foreground hover:bg-moss-50 hover:text-destructive"
                    onClick={() => removeItem(line.product.id)}
                    aria-label={`Remove ${line.product.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <SheetFooter>
              <Separator />
              <div className="flex items-center justify-between py-1">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="font-display text-xl font-semibold text-moss-900">
                  {formatPHP(subtotal)}
                </span>
              </div>
              <Button asChild variant="gradient" size="lg">
                <Link href="/checkout" onClick={() => onOpenChange(false)}>
                  Check out
                </Link>
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Shipping and taxes calculated at checkout.
              </p>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
