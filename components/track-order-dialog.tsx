// components/track-order-dialog.tsx
"use client";

import * as React from "react";
import { PackageSearch, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type TrackedOrder = {
  tracking_number: string;
  status: string;
  shipping_location: string | null;
  created_at: string;
  items: { name: string; qty: number }[];
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  paid: "Paid",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function TrackOrderDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [trackingNumber, setTrackingNumber] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [order, setOrder] = React.useState<TrackedOrder | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = trackingNumber.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setOrder(null);

    try {
      const res = await fetch(`/api/track/${encodeURIComponent(trimmed)}`, {
        cache: "no-store",
      });

      if (res.status === 404) {
        setError("No order found with that tracking number.");
        return;
      }
      if (!res.ok) {
        setError("Something went wrong. Please try again.");
        return;
      }

      const data = await res.json();
      setOrder(data.order);
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setTrackingNumber("");
    setOrder(null);
    setError(null);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageSearch className="h-5 w-5 text-moss-700" />
            Track your order
          </DialogTitle>
          <DialogDescription>
            Enter the tracking number from your order confirmation email.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="QPC-XXXXXXXXXX"
            className="uppercase placeholder:normal-case"
            autoFocus
          />
          <Button type="submit" disabled={loading || !trackingNumber.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Track"}
          </Button>
        </form>

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        {order && (
          <div className="rounded-lg border border-moss-100 p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm text-moss-700">
                {order.tracking_number}
              </span>
              <Badge variant="secondary">
                {STATUS_LABEL[order.status] ?? order.status}
              </Badge>
            </div>

            {order.shipping_location && (
              <p className="mt-2 text-sm text-muted-foreground">
                Last known location: {order.shipping_location}
              </p>
            )}

            <p className="mt-1 text-xs text-muted-foreground">
              Placed on {new Date(order.created_at).toLocaleDateString()}
            </p>

            <ul className="mt-3 space-y-1 text-sm">
              {order.items.map((item, i) => (
                <li key={i} className="flex justify-between">
                  <span>{item.name}</span>
                  <span className="text-muted-foreground">×{item.qty}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
