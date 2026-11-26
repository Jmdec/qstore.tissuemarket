"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ShieldCheck,
  Smartphone,
  Landmark,
  QrCode,
  Truck,
  UploadCloud,
  X,
  Check,
  AlertCircle,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/cart-context";
import { formatPHP } from "@/lib/utils";
import { toast } from "sonner";
import { AuthDialog } from "@/components/auth-dialog";

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

type PaymentId = "gcash" | "maya" | "bank" | "qr" | "cod";

type PaymentMethod = {
  id: PaymentId;
  label: string;
  icon: React.ElementType;
  instruction: string;
  detail: string;
  needsProof: boolean;
};

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "gcash",
    label: "GCash",
    icon: Smartphone,
    instruction: "Send total to 0917 123 4567 (Q U A N T A  P A P E R)",
    detail: "We confirm within 1 business hour.",
    needsProof: true,
  },
  {
    id: "maya",
    label: "Maya",
    icon: Smartphone,
    instruction: "Send total to 0917 123 4567 (Quanta Paper Co.)",
    detail: "We confirm within 1 business hour.",
    needsProof: true,
  },
  {
    id: "bank",
    label: "Bank transfer",
    icon: Landmark,
    instruction: "BDO 0012 3456 7890 — Quanta Paper Trading Co.",
    detail: "Online or over-the-counter deposit both work.",
    needsProof: true,
  },
  {
    id: "qr",
    label: "Scan QR",
    icon: QrCode,
    instruction: "Scan with any InstaPay or QRPH-linked app.",
    detail: "Works with GCash, Maya, and most bank apps.",
    needsProof: true,
  },
  {
    id: "cod",
    label: "Cash on delivery",
    icon: Truck,
    instruction: "Pay the rider in exact amount on arrival.",
    detail: "Available in Metro Manila and nearby provinces.",
    needsProof: false,
  },
];

const STEP_LABELS = ["Contact", "Shipping", "Payment"];

function StepEyebrow({ index, label }: { index: number; label: string }) {
  return (
    <div className="flex items-baseline gap-2.5">
      <span className="font-mono text-xs text-[#252927]/50">0{index}</span>
      <h2 className="font-display text-lg font-semibold italic text-[#252927]">
        {label}
      </h2>
    </div>
  );
}

function TornDivider() {
  return (
    <div className="relative">
      {/* Notch circles use the Paper White page background */}
      <div className="absolute -left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-[#F8F7F4] sm:-left-6" />
      <div className="absolute -right-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-[#F8F7F4] sm:-right-6" />
      <div className="border-t border-dashed border-[#C6C8C5]" />
    </div>
  );
}

export default function CheckoutPage() {
  const { lines, subtotal, count, clear } = useCart();
  const total = subtotal;

  type CurrentUser = {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };

  const [currentUser, setCurrentUser] = React.useState<CurrentUser | null>(
    null,
  );
  const [userLoading, setUserLoading] = React.useState(true);
  const [authOpen, setAuthOpen] = React.useState(false);
  const [authTab, setAuthTab] = React.useState<"login" | "register">("login");

  const fetchCurrentUser = React.useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (!res.ok) {
        setCurrentUser(null);
        return;
      }
      const data = await res.json();
      setCurrentUser(data.user ?? null);
    } catch {
      setCurrentUser(null);
    } finally {
      setUserLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const [email, setEmail] = React.useState("");
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [city, setCity] = React.useState("");
  const [zip, setZip] = React.useState("");
  const [phone, setPhone] = React.useState("");

  // Prefill contact/shipping name & email once we know who's logged in,
  // without clobbering anything the person has already typed.
  React.useEffect(() => {
    if (!currentUser) return;
    setEmail((prev) => prev || currentUser.email || "");
    setFirstName((prev) => prev || currentUser.first_name || "");
    setLastName((prev) => prev || currentUser.last_name || "");
  }, [currentUser]);

  const openAuth = (tab: "login" | "register") => {
    setAuthTab(tab);
    setAuthOpen(true);
  };

  const [payment, setPayment] = React.useState<PaymentId>("gcash");
  const [proofFile, setProofFile] = React.useState<File | null>(null);
  const [proofPreview, setProofPreview] = React.useState<string | null>(null);
  const [proofName, setProofName] = React.useState<string | null>(null);
  const [placingOrder, setPlacingOrder] = React.useState(false);
  const [orderPlaced, setOrderPlaced] = React.useState(false);
  const [trackingNumber, setTrackingNumber] = React.useState<string | null>(
    null,
  );
  const [errors, setErrors] = React.useState<string[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const errorRef = React.useRef<HTMLDivElement>(null);

  const activeMethod = PAYMENT_METHODS.find((m) => m.id === payment)!;

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    setProofFile(file);
    setProofName(file.name);
    setProofPreview(URL.createObjectURL(file));
  };

  const clearProof = () => {
    setProofFile(null);
    setProofPreview(null);
    setProofName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validate = (): string[] => {
    const errs: string[] = [];

    if (!email.trim()) errs.push("Email is required.");
    else if (!/^\S+@\S+\.\S+$/.test(email))
      errs.push("Enter a valid email address.");

    if (!firstName.trim()) errs.push("First name is required.");
    if (!lastName.trim()) errs.push("Last name is required.");
    if (!address.trim()) errs.push("Address is required.");
    if (!city.trim()) errs.push("City is required.");
    if (!zip.trim()) errs.push("Postal code is required.");
    if (!phone.trim()) errs.push("Phone number is required.");

    if (activeMethod.needsProof && !proofFile) {
      errs.push(`Please upload proof of payment for ${activeMethod.label}.`);
    }

    return errs;
  };

  const handlePlaceOrder = async () => {
    if (!currentUser) {
      toast.error("Please log in to place your order");
      openAuth("login");
      return;
    }

    const validationErrors = validate();

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      toast.error("Please fix the highlighted fields");
      requestAnimationFrame(() => {
        errorRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
      return;
    }

    setErrors([]);
    setPlacingOrder(true);

    try {
      const form = new FormData();
      form.append("email", email);
      form.append("first_name", firstName);
      form.append("last_name", lastName);
      form.append("address", address);
      form.append("city", city);
      form.append("zip", zip);
      form.append("phone", phone);
      form.append("payment_method", payment);
      form.append("subtotal", String(subtotal));
      form.append("total", String(total));
      form.append(
        "lines",
        JSON.stringify(
          lines.map((line) => ({
            id: line.product.id,
            name: line.product.name,
            price: line.product.price,
            qty: line.qty,
          })),
        ),
      );
      if (proofFile) {
        form.append("proof", proofFile);
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        body: form,
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 422 && data.errors) {
          const messages = Object.values(
            data.errors as Record<string, string[]>,
          ).flat();
          setErrors(messages);
          toast.error("Please fix the highlighted fields");
        } else if (res.status === 401) {
          setErrors(["Please log in before placing your order."]);
          toast.error("You need to log in first");
        } else {
          const message =
            data.message ??
            "Something went wrong placing your order. Please try again.";
          setErrors([message]);
          toast.error("Order failed", { description: message });
        }
        requestAnimationFrame(() => {
          errorRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        });
        return;
      }

      toast.success("Order placed!", {
        description: "We'll confirm your payment and get things moving.",
      });
      setTrackingNumber(data.order?.tracking_number ?? null);
      clear(); // ✅ empty the cart after a successful order
      setOrderPlaced(true);
    } catch {
      const message =
        "Something went wrong placing your order. Please try again.";
      setErrors([message]);
      toast.error("Order failed", { description: message });
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <>
      {/* Paper White (#F8F7F4) page background from the brand palette.
          Quanta Green is reserved for the hero banner. */}
      <div aria-hidden className="fixed inset-0 -z-10 bg-[#F8F7F4]" />

      <Navbar />
      <main className="flex-1">
        {/* Hero banner — Quanta Green (#00A552) */}
        <section className="bg-[#00A552]">
          <div className="container max-w-6xl py-8 sm:py-10">
            <Link
              href="/shop"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-white/90 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to shop
            </Link>

            <div className="mt-3 flex items-baseline justify-between">
              <h1 className="font-display text-2xl font-medium italic text-white sm:text-3xl">
                Checkout
              </h1>
              <p className="font-mono text-xs text-white/80">
                {STEP_LABELS.join(" · ")}
              </p>
            </div>
          </div>
        </section>

        <div className="container max-w-6xl py-6 sm:py-8">
          {orderPlaced ? (
            <div className="rounded-2xl border border-[#C6C8C5] bg-white p-10 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F8F7F4]">
                <Check className="h-7 w-7 text-[#006B3F]" strokeWidth={3} />
              </div>
              <p className="mt-4 font-display text-xl font-medium italic text-[#252927]">
                Order placed!
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                We&apos;ll confirm your payment and get your order moving.
              </p>

              {trackingNumber && (
                <div className="mx-auto mt-5 flex w-fit flex-col items-center gap-1 rounded-xl border border-dashed border-[#C6C8C5] bg-[#F8F7F4] px-5 py-3">
                  <span className="text-[11px] font-medium uppercase tracking-widest2 text-moss-500">
                    Tracking number
                  </span>
                  <span className="font-mono text-sm font-semibold text-[#252927]">
                    {trackingNumber}
                  </span>
                </div>
              )}

              <Button asChild variant="gradient" className="mt-5">
                <Link href="/orders">View my orders</Link>
              </Button>
            </div>
          ) : count === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#C6C8C5] bg-white p-10 text-center">
              <p className="font-display text-lg text-[#252927]">
                Your cart is empty
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add items to your cart before checking out.
              </p>
              <Button asChild variant="gradient" className="mt-5">
                <Link href="/#shop">Browse products</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px] lg:items-start">
              {/* Left: form steps */}
              <div className="flex flex-col divide-y divide-[#C6C8C5] rounded-2xl border border-[#C6C8C5] bg-white shadow-sm">
                {!userLoading && !currentUser && (
                  <div className="m-5 flex flex-col items-start gap-2 rounded-xl border border-[#C6C8C5] bg-[#F8F7F4] p-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-[#252927]">
                      Log in so we can save this order to your account.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="bg-white"
                        onClick={() => openAuth("register")}
                      >
                        Register
                      </Button>
                      <Button
                        type="button"
                        variant="gradient"
                        size="sm"
                        onClick={() => openAuth("login")}
                      >
                        Log in
                      </Button>
                    </div>
                  </div>
                )}

                {errors.length > 0 && (
                  <div
                    ref={errorRef}
                    className="m-5 flex flex-col gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4"
                  >
                    <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      Please fix the following before placing your order:
                    </div>
                    <ul className="ml-6 list-disc space-y-0.5 text-sm text-destructive">
                      {errors.map((err) => (
                        <li key={err}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Contact */}
                <section className="p-5">
                  <StepEyebrow index={1} label="Contact" />
                  <div className="mt-3">
                    <Label htmlFor="email" className="text-xs text-moss-500">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@email.com"
                      className="mt-1"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={!!currentUser}
                    />
                  </div>
                </section>

                {/* Shipping */}
                <section className="p-5">
                  <StepEyebrow index={2} label="Shipping address" />
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="first" className="text-xs text-moss-500">
                        First name
                      </Label>
                      <Input
                        id="first"
                        placeholder="Juana"
                        className="mt-1"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        disabled={!!currentUser}
                      />
                    </div>
                    <div>
                      <Label htmlFor="last" className="text-xs text-moss-500">
                        Last name
                      </Label>
                      <Input
                        id="last"
                        placeholder="Dela Cruz"
                        className="mt-1"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        disabled={!!currentUser}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label
                        htmlFor="address"
                        className="text-xs text-moss-500"
                      >
                        Address
                      </Label>
                      <Input
                        id="address"
                        placeholder="Street, Barangay"
                        className="mt-1"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="city" className="text-xs text-moss-500">
                        City
                      </Label>
                      <Input
                        id="city"
                        placeholder="Taguig City"
                        className="mt-1"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="zip" className="text-xs text-moss-500">
                        Postal code
                      </Label>
                      <Input
                        id="zip"
                        placeholder="1632"
                        className="mt-1"
                        value={zip}
                        onChange={(e) => setZip(e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="phone" className="text-xs text-moss-500">
                        Phone
                      </Label>
                      <Input
                        id="phone"
                        placeholder="+63 9XX XXX XXXX"
                        className="mt-1"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </div>
                </section>

                {/* Payment */}
                <section className="p-5">
                  <StepEyebrow index={3} label="Payment" />

                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {PAYMENT_METHODS.map((method) => {
                      const Icon = method.icon;
                      const active = payment === method.id;
                      return (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setPayment(method.id)}
                          aria-pressed={active}
                          className={`relative flex flex-col items-start gap-2 rounded-xl border-2 p-3 text-left transition-colors focus-ring ${
                            active
                              ? "border-[#006B3F] bg-[#F8F7F4]"
                              : "border-[#C6C8C5] bg-white hover:border-[#006B3F]/60"
                          }`}
                        >
                          {active && (
                            <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#006B3F]">
                              <Check
                                className="h-2.5 w-2.5 text-white"
                                strokeWidth={3}
                              />
                            </span>
                          )}
                          <span
                            className={`flex h-8 w-8 items-center justify-center rounded-full ${
                              active
                                ? "bg-[#006B3F] text-white"
                                : "bg-[#F8F7F4] text-[#252927]/70"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="text-xs font-semibold text-[#252927]">
                            {method.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Method detail panel */}
                  <div className="mt-4 rounded-xl border border-[#C6C8C5] bg-[#F8F7F4] p-4">
                    <p className="font-mono text-xs text-[#252927]">
                      {activeMethod.instruction}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {activeMethod.detail}
                    </p>

                    {activeMethod.needsProof && (
                      <div className="mt-4">
                        <TornDivider />
                        <p className="mt-4 text-xs font-semibold uppercase tracking-widest2 text-moss-500">
                          Upload proof of payment
                        </p>

                        {!proofPreview ? (
                          <label
                            htmlFor="proof"
                            className="mt-2 flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-[#C6C8C5] bg-white px-4 py-6 text-center hover:border-[#006B3F]"
                          >
                            <UploadCloud className="h-5 w-5 text-[#006B3F]" />
                            <span className="text-xs font-medium text-[#252927]">
                              Tap to upload a screenshot
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              PNG or JPG, up to 10MB
                            </span>
                            <input
                              id="proof"
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleFile(e.target.files?.[0])}
                            />
                          </label>
                        ) : (
                          <div className="mt-2 flex items-center gap-3 rounded-xl border border-[#C6C8C5] bg-white p-2.5">
                            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[#F8F7F4]">
                              <Image
                                src={proofPreview}
                                alt="Payment proof"
                                fill
                                sizes="56px"
                                className="object-cover"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-medium text-[#252927]">
                                {proofName}
                              </p>
                              <p className="text-[11px] text-moss-500">
                                Ready to submit
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={clearProof}
                              aria-label="Remove uploaded file"
                              className="rounded-full p-1.5 text-muted-foreground hover:bg-[#F8F7F4] hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#006B3F]" />
                    Your order is only confirmed once payment is verified.
                  </p>
                </section>
              </div>

              {/* Right: receipt-style summary */}
              <aside className="rounded-2xl border border-[#C6C8C5] bg-white p-5 shadow-sm lg:sticky lg:top-24">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-base font-semibold italic text-[#252927]">
                    Order summary
                  </h2>
                  <span className="font-mono text-xs text-[#252927]/50">
                    {count} {count === 1 ? "item" : "items"}
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {lines.map((line) => (
                    <div
                      key={line.product.id}
                      className="flex items-center gap-2.5"
                    >
                      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md bg-[#F8F7F4]">
                        <Image
                          src={resolveImageUrl(line.product.image)}
                          alt={line.product.name}
                          fill
                          sizes="36px"
                          className="object-cover"
                        />
                        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#006B3F] font-mono text-[9px] font-semibold text-white">
                          {line.qty}
                        </span>
                      </div>
                      <span className="min-w-0 flex-1 truncate font-mono text-xs text-[#252927]">
                        {line.product.name}
                      </span>
                      <span className="shrink-0 font-mono text-xs font-medium text-[#252927]">
                        {formatPHP(line.product.price * line.qty)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="my-4">
                  <TornDivider />
                </div>

                <div className="space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between text-[#252927]/70">
                    <span>Subtotal</span>
                    <span>{formatPHP(subtotal)}</span>
                  </div>
                  <div className="flex justify-between pt-2 text-sm font-semibold text-[#252927]">
                    <span>Total</span>
                    <span>{formatPHP(total)}</span>
                  </div>
                </div>

                <Button
                  variant="gradient"
                  size="lg"
                  className="mt-5 w-full"
                  onClick={handlePlaceOrder}
                  disabled={placingOrder || userLoading || !currentUser}
                >
                  {placingOrder
                    ? "Placing order..."
                    : !currentUser
                      ? "Log in to place order"
                      : `Place order · ${formatPHP(total)}`}
                </Button>
                <p className="mt-2 text-center text-[11px] text-muted-foreground">
                  Paying via {activeMethod.label.toLowerCase()}
                </p>
              </aside>
            </div>
          )}
        </div>
      </main>
      <Footer />
      <AuthDialog
        open={authOpen}
        onOpenChange={setAuthOpen}
        defaultTab={authTab}
        onAuthSuccess={fetchCurrentUser}
      />
    </>
  );
}
