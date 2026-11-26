"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Facebook,
  Instagram,
  Youtube,
  Mail,
  Phone,
  MapPin,
  Bell,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/types/product";

type HelpLink = { label: string; href: string };

// lucide-react doesn't ship current logos for X or TikTok, so these are
// drawn by hand as simple currentColor SVGs to match the other icons.
function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M18.9 2H22l-7.6 8.68L23.3 22h-6.86l-5.37-6.62L4.9 22H1.8l8.13-9.29L1 2h7.03l4.86 6.05L18.9 2Zm-1.2 18.17h1.7L7.4 3.75H5.58l12.12 16.42Z" />
    </svg>
  );
}

function TikTokIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M16.6 2h-3.2v13.4a2.9 2.9 0 1 1-2.05-2.77V9.4a6.1 6.1 0 1 0 5.25 6.05V8.36a8.1 8.1 0 0 0 4.75 1.52V6.66A4.8 4.8 0 0 1 16.6 2Z" />
    </svg>
  );
}

// Real logo image — place the transparent-background logo file at
// /public/q-logo.png in your Next.js project. The image already contains
// the "QUANTA PAPER CORPORATION" wordmark, so no text is rendered
// alongside it here. Height is kept small so the logo stays proportionate
// to the description text below it.
function QuantaBadge() {
  return (
    <Image
      src="/q-logo-no-bg.png"
      alt="Quanta Paper Corporation"
      width={480}
      height={100}
      className="h-auto w-full max-w-sm"
      priority
    />
  );
}

const SOCIAL_LINKS = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/quantapaper/",
    icon: Facebook,
  },
  {
    label: "X (Twitter)",
    href: "https://x.com/quantapaper",
    icon: XIcon,
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/quantapaper_ph/",
    icon: Instagram,
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/channel/UCpm4vyQ1WcpBVkAd7ElQsEQ",
    icon: Youtube,
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@quantapaper",
    icon: TikTokIcon,
  },
];

// Real routes use "/", placeholders stay "#" until those pages exist —
// rendered with <Link> vs <a> below so that distinction is preserved.
const HELP_LINKS: HelpLink[] = [
  { label: "Track Orders", href: "/orders" },
  { label: "Terms of Use", href: "/terms-of-use" },
  { label: "FAQ", href: "/faq" },
  { label: "Privacy Policy", href: "/privacy-policy" },
];

const DEPARTMENTS = [
  { label: "Consumer Sales", email: "salesadmin@quantapaper.com" },
  {
    label: "Institutional Sales",
    email: "quanta.institutionals@quantapaper.com",
  },
  { label: "Credit & Collection", email: "cnc@quantapaper.com" },
  { label: "Human Resources", email: "human.resources@quantapaper.com" },
];

export function Footer() {
  const [email, setEmail] = useState("");

  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email || status === "loading") return;

    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message ?? "Something went wrong.");
      }

      setStatus("success");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong.",
      );
    }
  }

  return (
    // Heritage Forest (#006B3F) background, Paper White (#F8F7F4) text,
    // Industrial Silver (#C6C8C5) for rules and icons — all from the brand palette.
    <footer className="bg-[#006B3F] text-[#F8F7F4]">
      {/* Restock reminder — the one thing this footer should be remembered for */}
      <div className="border-b border-[#C6C8C5]/25">
        <div className="container flex flex-col items-center justify-between gap-4 py-6 sm:flex-row">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F8F7F4]/10 sm:flex">
              <Bell className="h-4 w-4 text-[#F8F7F4]" />
            </span>
            <div>
              <p className="font-display text-sm font-semibold text-[#F8F7F4]">
                Subscribe for the latest product updates, special discounts, and
                exclusive offers.
              </p>
            </div>
          </div>

          {status === "success" ? (
            <p className="text-sm font-medium text-[#F8F7F4]">
              You&apos;re on the list — thanks!
            </p>
          ) : (
            <div className="flex w-full max-w-sm flex-col gap-1.5">
              <form
                onSubmit={handleSubscribe}
                className="flex w-full items-center gap-2"
              >
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  aria-label="Email address"
                  disabled={status === "loading"}
                  className="border-[#C6C8C5]/40 bg-[#F8F7F4]/10 text-[#F8F7F4] placeholder:text-[#F8F7F4]/60 focus-visible:ring-[#F8F7F4]"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={status === "loading"}
                  className="shrink-0 rounded-full bg-[#F8F7F4] text-[#006B3F] hover:bg-white"
                  aria-label="Subscribe"
                >
                  {status === "loading" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                </Button>
              </form>
              {status === "error" && (
                <p className="text-xs text-red-200">{errorMessage}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main columns */}
      <div className="container grid grid-cols-2 gap-x-8 gap-y-10 py-14 lg:grid-cols-12">
        {/* Company information */}
        <div className="col-span-2 lg:col-span-4">
          <QuantaBadge />

          <p className="mt-4 max-w-sm text-sm text-[#F8F7F4]/80">
            Quanta Paper Corporation is a trusted Philippine manufacturer and
            distributor of quality tissue, paper, hygiene, and personal care
            products for homes, businesses, and institutions nationwide.
          </p>

          <div className="mt-5 space-y-3 text-sm text-[#F8F7F4]/80">
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#C6C8C5]" />
              <span>
                149-A Rt. Rev. G. Aglipay,
                <br />
                Mandaluyong City,
                <br />
                Metro Manila, Philippines
              </span>
            </div>
            <a
              href="tel:+639178417992"
              className="flex items-center gap-2 transition-colors hover:text-white"
            >
              <Phone className="h-4 w-4 text-[#C6C8C5]" />
              0917 841 7992
            </a>
            <a
              href="mailto:wecare@quantapaper.com"
              className="flex items-center gap-2 transition-colors hover:text-white"
            >
              <Mail className="h-4 w-4 text-[#C6C8C5]" />
              wecare@quantapaper.com
            </a>
          </div>

          <div className="mt-6 flex gap-3">
            {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="rounded-full bg-[#F8F7F4]/10 p-2 text-[#F8F7F4] transition-colors hover:bg-[#F8F7F4]/25"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        {/* Help */}
        <div className="col-span-1 lg:col-span-2">
          <h4 className="font-display text-sm font-bold uppercase tracking-wide text-[#F8F7F4]">
            Help
          </h4>
          <ul className="mt-4 space-y-2.5 text-sm text-[#F8F7F4]/80">
            {HELP_LINKS.map((link) => (
              <li key={link.label}>
                {link.href.startsWith("/") ? (
                  <Link
                    href={link.href}
                    className="transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a
                    href={link.href}
                    className="transition-colors hover:text-white"
                  >
                    {link.label}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Contact departments */}
        <div className="col-span-2 lg:col-span-4">
          <h4 className="font-display text-sm font-bold uppercase tracking-wide text-[#F8F7F4]">
            Contact
          </h4>
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 text-xs text-[#F8F7F4]/80">
            {DEPARTMENTS.map((dept) => (
              <div key={dept.label}>
                <p className="font-semibold text-[#F8F7F4]">{dept.label}</p>
                <a
                  href={`mailto:${dept.email}`}
                  className="break-all hover:text-white"
                >
                  {dept.email}
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[#C6C8C5]/25 py-5">
        <div className="container flex flex-col items-center justify-between gap-2 text-xs text-[#F8F7F4]/70 sm:flex-row">
          <p>
            © {new Date().getFullYear()} Quanta Paper Corporation. All rights
            reserved.
          </p>
          <p>Proudly serving Filipino homes and businesses since 1995.</p>
          <p>
            Powered by{" "}
            <a
              href="https://www.infinitechphil.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#F8F7F4] transition-colors hover:text-white"
            >
              Infinitech Advertising Corporation
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
