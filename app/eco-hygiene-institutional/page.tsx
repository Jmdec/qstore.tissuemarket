"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Hotel,
  UtensilsCrossed,
  Hospital,
  GraduationCap,
  Building2,
  ShoppingBag,
  Factory,
  Plane,
  Dumbbell,
  Scissors,
  PartyPopper,
  Home,
  ArrowUpRight,
  Search,
  X,
  type LucideIcon,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { CategoryStrip } from "@/components/category-strip";
const IMAGE_BASE_URL = (
  process.env.NEXT_PUBLIC_IMAGES_URL ??
  process.env.NEXT_PUBLIC_IMAGE_URL ??
  ""
).replace(/\/$/, "");

function getImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^(https?:|blob:|data:)/.test(path)) return path;
  // Static Next.js assets belong to the frontend, not the Laravel origin.
  if (/^\/(brands|images|institutional)\//.test(path)) return path;
  return `${IMAGE_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

// ============================================================
// CONTENT CONFIGURATION
// ============================================================

const SECTORS: {
  icon: LucideIcon;
  title: string;
  text: string;
}[] = [
  {
    icon: Hotel,
    title: "Hotels",
    text: "Guest rooms, lobbies, and hospitality facilities.",
  },
  {
    icon: UtensilsCrossed,
    title: "Restaurants",
    text: "Dining spaces, kitchens, and food service areas.",
  },
  {
    icon: Hospital,
    title: "Healthcare",
    text: "Clinics, hospitals, and patient care facilities.",
  },
  {
    icon: GraduationCap,
    title: "Education",
    text: "Schools, campuses, and learning institutions.",
  },
  {
    icon: Building2,
    title: "Corporate Offices",
    text: "Workplaces, pantries, and shared facilities.",
  },
  {
    icon: ShoppingBag,
    title: "Retail & Malls",
    text: "Commercial spaces and public washrooms.",
  },
  {
    icon: Factory,
    title: "Manufacturing",
    text: "Factories, warehouses, and production facilities.",
  },
  {
    icon: Plane,
    title: "Transportation",
    text: "Airports, terminals, and transport hubs.",
  },
  {
    icon: Home,
    title: "Residential",
    text: "Condominiums and property developments.",
  },
  {
    icon: Dumbbell,
    title: "Fitness Centers",
    text: "Gyms, locker rooms, and wellness facilities.",
  },
  {
    icon: Scissors,
    title: "Salons & Spas",
    text: "Personal care, treatment, and relaxation spaces.",
  },
  {
    icon: PartyPopper,
    title: "Events & Venues",
    text: "Function halls, catering, and event facilities.",
  },
];

// ------------------------------------------------------------
// Customers. Place logo files in /public/customers/.
// If a file is missing, the customer name is shown instead.
// ------------------------------------------------------------
const CUSTOMERS: { name: string; src: string }[] = [
  { name: "ABS-CBN", src: "/customers/abs-cbn.png" },
  { name: "Accenture", src: "/customers/accenture.png" },
  { name: "Araneta Center", src: "/customers/araneta-center.png" },
  { name: "Ayala", src: "/customers/ayala.png" },
  { name: "City of Dreams Manila", src: "/customers/city-of-dreams.png" },
  { name: "Concentrix", src: "/customers/concentrix.png" },
  { name: "DoubleDragon Properties Corp", src: "/customers/doubledragon.png" },
  { name: "Globe", src: "/customers/globe.png" },
  {
    name: "Manila International Airport Authority",
    src: "/customers/miaa.png",
  },
  { name: "Megaworld", src: "/customers/megaworld.png" },
  { name: "PAGCOR", src: "/customers/pagcor.png" },
  { name: "Resorts World Manila", src: "/customers/resorts-world.png" },
  { name: "Seda", src: "/customers/seda.png" },
  { name: "Shakey's", src: "/customers/shakeys.png" },
  { name: "Shangri-La Hotels and Resorts", src: "/customers/shangri-la.png" },
  { name: "St. Luke's Medical Center", src: "/customers/st-lukes.png" },
  { name: "Teleperformance", src: "/customers/teleperformance.png" },
  { name: "TELUS", src: "/customers/telus.png" },
  { name: "The Ascott Limited", src: "/customers/ascott.png" },
  { name: "The Peninsula Manila", src: "/customers/peninsula.png" },
  { name: "Vikings", src: "/customers/vikings.png" },
];

// ------------------------------------------------------------
// Institutional showcase: contacts & links
// ------------------------------------------------------------
const CONTACT_PAGE_URL = "/contact";
const INSTITUTIONAL_HERO_IMAGE = "/products/eco-hygiene-dispenser.jpg";

// The hero banner is always this file (public/banner2.png). Nothing else.
const INSTITUTIONAL_BANNER = "/banner2.png";

const INSTITUTIONAL_CONTACTS = {
  landline: {
    label: "Landline",
    value: "(02) 8533 9250",
    href: "tel:+63285339250",
  },
  mobile: {
    label: "Mobile",
    value: "+63 917 564 9961",
    href: "tel:+639175649961",
  },
  email: {
    label: "Email",
    value: "quanta.institutionals@quantapaper.com",
    href: "mailto:quanta.institutionals@quantapaper.com",
  },
  website: {
    label: "Website",
    value: "www.quantapapercorporation.com",
    href: "https://www.quantapapercorporation.com",
  },
} as const;

const pad = (n: number) => String(n).padStart(2, "0");
const mailto = (subject: string) =>
  `${INSTITUTIONAL_CONTACTS.email.href}?subject=${encodeURIComponent(subject)}`;

// ============================================================
// INSTITUTIONAL PRODUCTS: types, fallback data, grouping
// ============================================================

interface InstitutionalProduct {
  id: string;
  name: string;
  image: string | null; // run through getImageUrl() before rendering
  family?: string | null; // optional: if the API returns one, it wins
}

interface ProductFamily {
  title: string;
  description: string;
  items: { product: InstitutionalProduct; itemNumber: number }[];
}

const FALLBACK_INSTITUTIONAL_PRODUCTS: InstitutionalProduct[] = [
  ["Jumbo Roll Tissue Dispenser", "jumbo-roll-tissue-dispenser"],
  ["Jumbo Coreless Tissue Roll", "jumbo-coreless-tissue-roll"],
  [
    "Centerpull Square Plastic Dispenser",
    "centerpull-square-plastic-dispenser",
  ],
  ["Jumbo Tissue Roll", "jumbo-tissue-roll"],
  ["Center Pull Stainless Dispenser", "center-pull-stainless-dispenser"],
  ["Interfolded Paper Towel Dispenser", "interfolded-paper-towel-dispenser"],
  ["Interfolded Paper Towel – Wrapped", "interfolded-paper-towel-wrapped"],
  ["Interfolded Paper Towel – Boxed", "interfolded-paper-towel-boxed"],
  ["Upright Facial Tissue Box", "upright-facial-tissue-box"],
  ["Flat Facial Tissue Dispenser", "flat-facial-tissue-dispenser"],
  ["Facial Tissue", "facial-tissue"],
  ["Interleaved Tissue Dispenser", "interleaved-tissue-dispenser"],
  ["Interleaved Table Napkin", "interleaved-table-napkin"],
  ["Table Napkin", "table-napkin"],
  ["Handroll Tissue Dispenser", "handroll-tissue-dispenser"],
  ["Handroll Tissue Dispenser Auto Cut", "handroll-tissue-dispenser-auto-cut"],
  ["Handroll Tissue", "handroll-tissue"],
  ["Bathroom Tissue Roll", "bathroom-tissue-roll"],
  ["Manual Hand Soap Dispenser 300 ml", "manual-hand-soap-dispenser-300ml"],
  ["Manual Hand Soap Dispenser 1000 ml", "manual-hand-soap-dispenser-1000ml"],
  ["Automatic Hand Soap Dispenser", "automatic-hand-soap-dispenser"],
  ["Strawberry Scent", "strawberry-scent"],
  ["Peppermint Scent", "peppermint-scent"],
  ["Apple Scent Sanitizer", "apple-scent-sanitizer"],
].map(([name, imageName], index) => ({
  id: `eco-hygiene-${index + 1}`,
  name,
  image: `/institutional/${imageName}.png`,
}));

const FALLBACK_IMAGE_BY_NAME = new Map(
  FALLBACK_INSTITUTIONAL_PRODUCTS.map((product) => [
    product.name.trim().toLowerCase(),
    product.image,
  ]),
);

function getFallbackProductImage(name: string): string | null {
  return FALLBACK_IMAGE_BY_NAME.get(name.trim().toLowerCase()) ?? null;
}

function handleProductImageError(
  event: React.SyntheticEvent<HTMLImageElement>,
  fallbackSrc: string | null,
) {
  const image = event.currentTarget;
  if (fallbackSrc && image.getAttribute("src") !== fallbackSrc) {
    image.src = fallbackSrc;
  } else {
    image.hidden = true;
  }
}

function mergeFallbackInstitutionalImages(
  products: InstitutionalProduct[],
): InstitutionalProduct[] {
  return products.map((product) => ({
    ...product,
    image:
      product.image?.trim() || getFallbackProductImage(product.name) || null,
  }));
}

const FAMILIES: { title: string; description: string; match: RegExp }[] = [
  {
    title: "Jumbo Roll Dispensers",
    description:
      "Reliable dispensing solutions for high-traffic facilities. Designed to provide convenient, controlled tissue dispensing while supporting cleanliness and efficiency.",
    match: /jumbo|center ?pull/i,
  },
  {
    title: "Interfolded Paper Towel",
    description:
      "Efficient hand-drying for everyday facility needs, with convenient one-at-a-time dispensing.",
    match: /interfold|paper towel|hand towel/i,
  },
  {
    title: "Facial Tissue",
    description:
      "Soft and accessible facial tissue solutions for offices, hospitality spaces, and other facilities.",
    match: /facial/i,
  },
  {
    title: "Table Napkin Dispensers",
    description:
      "Convenient dispensing options paired with table napkins for a cleaner, more efficient dining experience.",
    match: /napkin|interleaved/i,
  },
  {
    title: "Handroll Dispensers",
    description:
      "Controlled dispensing and practical hand-drying solutions for high-traffic areas.",
    match: /hand ?roll/i,
  },
  {
    title: "Bathroom Tissue",
    description: "Bathroom tissue rolls for everyday facilities.",
    match: /bathroom/i,
  },
  {
    title: "Hand Soap Dispensers",
    description:
      "Manual and automatic handwashing solutions, plus fragrance and sanitizer options.",
    match: /soap|sanitizer|scent/i,
  },
];

const OTHER_FAMILY = {
  title: "More products",
  description: "Additional hygiene essentials for your facility.",
};

function groupInstitutionalProducts(
  products: InstitutionalProduct[],
  query = "",
): ProductFamily[] {
  const q = query.trim().toLowerCase();
  const buckets = new Map<string, ProductFamily>();

  products.forEach((product, index) => {
    // Item numbers come from the original order so they stay stable while searching.
    const itemNumber = index + 1;
    if (q && !product.name.toLowerCase().includes(q)) return;

    const known =
      FAMILIES.find((f) => f.title === product.family) ??
      FAMILIES.find((f) => f.match.test(product.name));
    const meta = known ?? {
      ...OTHER_FAMILY,
      title: product.family || OTHER_FAMILY.title,
    };

    const bucket = buckets.get(meta.title) ?? {
      title: meta.title,
      description: meta.description,
      items: [],
    };
    bucket.items.push({ product, itemNumber });
    buckets.set(meta.title, bucket);
  });

  const order = [...FAMILIES.map((f) => f.title), OTHER_FAMILY.title];
  return [...buckets.values()].sort((a, b) => {
    const ai = order.indexOf(a.title);
    const bi = order.indexOf(b.title);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
}

// Client-side fetch. Starts with the fallback list so the range is always
// visible, then swaps in the API data when it arrives.
function useInstitutionalProducts(): InstitutionalProduct[] {
  const [products, setProducts] = React.useState<InstitutionalProduct[]>(
    FALLBACK_INSTITUTIONAL_PRODUCTS,
  );

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/institutional-products`,
        );
        if (!res.ok) return;

        const body: {
          success: boolean;
          data: InstitutionalProduct[];
        } = await res.json();

        if (!cancelled && body.success && body.data.length > 0) {
          setProducts(mergeFallbackInstitutionalImages(body.data));
        }
      } catch {
        // The institutional range must remain visible during API outages.
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return products;
}

// ============================================================
// SECTION LABEL
// ============================================================

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center text-xs font-bold uppercase tracking-[0.18em] text-[#087443]">
      {children}
    </span>
  );
}

// ============================================================
// HERO BANNER (banner2.png only)
// ============================================================

function Hero() {
  return (
    <section className="w-full overflow-hidden bg-[#F1F8EE]">
      <div className="w-full">
        <a
          href="#institutional-range"
          aria-label="Explore Eco-Hygiene institutional products"
          className="block w-full"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={INSTITUTIONAL_BANNER}
            alt="Q-STORE - Everyday essentials. Quality you can trust. Your one-stop-store for hygiene, cleaning and institutional supplies."
            className="block h-auto w-full object-contain"
            fetchPriority="high"
          />
        </a>
      </div>
    </section>
  );
}

// ============================================================
// INDUSTRIES WE SERVE
// ============================================================

function Industries() {
  return (
    <section className="bg-[#F3F8F5] py-16 sm:py-24 border-b border-[#E4ECE7]">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <SectionLabel>INDUSTRY SOLUTIONS</SectionLabel>

          <h2 className="mt-4 font-display text-3xl font-semibold leading-tight text-[#103B2A] sm:text-4xl">
            Solutions for every kind of facility.
          </h2>

          <p className="mt-4 text-base leading-7 text-[#64756B]">
            Every industry has different hygiene requirements. We help
            businesses find the right essentials for their everyday operations.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {SECTORS.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="group rounded-xl border border-[#E4ECE7] bg-white p-4 transition-all duration-300 hover:border-[#10A45A] hover:shadow-lg hover:shadow-[#103B2A]/5 sm:p-6"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#EAF5EE] text-[#087443] transition-colors group-hover:bg-[#087443] group-hover:text-white">
                <Icon size={21} />
              </div>

              <h3 className="mt-4 text-sm font-bold text-[#103B2A] sm:text-base">
                {title}
              </h3>

              <p className="mt-2 text-xs leading-6 text-[#64756B] sm:text-sm">
                {text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// INSTITUTIONAL PRODUCTS SHOWCASE
// ============================================================

function InstitutionalProductsShowcase({
  products,
}: {
  products: InstitutionalProduct[];
}) {
  const [query, setQuery] = React.useState("");
  const [selected, setSelected] = React.useState<{
    product: InstitutionalProduct;
    itemNumber: number;
    description: string;
  } | null>(null);

  const families = React.useMemo(
    () => groupInstitutionalProducts(products, query),
    [products, query],
  );

  // Close the viewer with Escape
  React.useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  if (products.length === 0) return null;

  return (
    <section className="bg-[#F3F8F5] px-6 py-20 md:py-24">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* ── Eco Hygiene feature card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          viewport={{ once: true, amount: 0.2 }}
          className="grid items-center gap-10 rounded-[32px] bg-[#00673c] p-8 text-white shadow-[0_24px_60px_-24px_rgba(0,80,45,0.6)] md:grid-cols-[1.1fr_0.9fr] md:p-12"
        >
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/90">
              Eco Hygiene • Institutional Sales Corp.
            </p>
            <h2 className="mt-6 text-4xl font-bold leading-[1.05] tracking-[-0.045em] md:text-5xl">
              Everyday hygiene.
              <br />
              Built for busy spaces.
            </h2>
            <p className="mt-6 max-w-lg text-sm leading-[1.9] text-white/85">
              Explore Eco Hygiene&rsquo;s complete flyer selection—from washroom
              tissue systems and paper essentials to napkin solutions, hand soap
              dispensers, and hygiene supplies for your facility.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="#institutional-range"
                className="inline-flex items-center gap-4 rounded-full bg-[#00a651] px-6 py-3.5 text-xs font-bold hover:bg-[#009447]"
              >
                Explore full range <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
              <a
                href={mailto("Request a quotation")}
                className="inline-flex items-center gap-2 rounded-full border border-white/60 px-6 py-3.5 text-xs font-bold hover:bg-white/10"
              >
                Request a quotation <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          <div className="relative aspect-[1.2/1] overflow-hidden rounded-[28px] border-[5px] border-white shadow-xl">
            <Image
              src={INSTITUTIONAL_HERO_IMAGE}
              alt="Eco Hygiene wall-mounted tissue dispenser in a washroom"
              fill
              sizes="(min-width: 768px) 40vw, 90vw"
              className="object-cover"
            />
          </div>
        </motion.div>

        {/* ── Product range ── */}
        <div
          id="institutional-range"
          className="scroll-mt-24 rounded-[28px] bg-white p-6 shadow-[0_12px_40px_-24px_rgba(15,74,44,0.4)] md:p-10"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#0f4a2c]">
            Our institutional range
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-[#12392a] md:text-5xl">
            Explore our institutional product range.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-[1.9] text-[#5b6460]">
            Browse Eco Hygiene products by family, or search for a specific
            item. Select any product photo to see a larger view and request
            information.
          </p>

          <label className="relative mt-7 block max-w-lg">
            <span className="sr-only">Search institutional products</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#5b6460]" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search institutional products"
              className="w-full rounded-full border border-black/10 bg-white py-3.5 pl-10 pr-4 text-xs outline-none placeholder:text-[#7a847f] focus:border-[#00a651] focus:ring-2 focus:ring-[#00a651]/20"
            />
          </label>

          <div className="mt-6 border-t border-black/10" />

          {families.length === 0 && (
            <p className="py-12 text-center text-sm text-[#5b6460]">
              No products match &ldquo;{query}&rdquo;. Try a shorter search, or
              clear it to see the full range.
            </p>
          )}

          {families.map((family) => (
            <div key={family.title} className="mt-10">
              <h3 className="text-2xl font-medium tracking-[-0.02em] text-[#12392a]">
                {family.title}
              </h3>
              <p className="mt-2 max-w-2xl text-xs leading-[1.8] text-[#5b6460]">
                {family.description}
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {family.items.map(({ product, itemNumber }) => {
                  const src = getImageUrl(product.image);
                  const fallbackSrc = getImageUrl(
                    getFallbackProductImage(product.name),
                  );
                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() =>
                        setSelected({
                          product,
                          itemNumber,
                          description: family.description,
                        })
                      }
                      className="group overflow-hidden rounded-2xl border border-black/[0.08] bg-white text-left transition-shadow hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00a651]"
                    >
                      <div className="flex aspect-[1.1/1] items-center justify-center bg-white p-6">
                        {src ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={src}
                            alt={product.name}
                            className="max-h-full max-w-full object-contain transition-transform duration-200 group-hover:scale-105"
                            draggable={false}
                            onError={(event) =>
                              handleProductImageError(event, fallbackSrc)
                            }
                          />
                        ) : (
                          <span className="text-4xl font-bold text-[#0f4a2c]/30">
                            {product.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="border-t border-black/5 bg-[#f6f9f6] px-4 pb-4 pt-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#0b7a43]">
                          Item {pad(itemNumber)}
                        </p>
                        <p className="mt-2 text-[13px] font-bold text-[#12392a]">
                          {product.name}
                        </p>
                        <p className="mt-5 flex items-center justify-between text-[11px] font-bold text-[#0b7a43]">
                          View details <ArrowUpRight className="h-3 w-3" />
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="mt-10 flex flex-col gap-4 border-t border-black/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-[#5b6460]">
              Product availability, variants, and specifications can be
              confirmed with Eco Hygiene Institutional Sales.
            </p>
            <a
              href={mailto("Inquiry: complete institutional range")}
              className="inline-flex items-center gap-2 self-start rounded-full bg-[#00a651] px-6 py-3.5 text-xs font-bold text-white hover:bg-[#009447] sm:self-auto"
            >
              Ask about the complete range{" "}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* ── Contacts ── */}
        <div className="grid gap-8 rounded-[28px] border border-[#cfe3d3] bg-gradient-to-br from-[#e7f2e9] to-[#f1f6ee] p-8 md:grid-cols-2 md:p-10">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#0f4a2c]">
              Institutional sales contacts
            </p>
            <h2 className="mt-4 text-3xl font-bold leading-tight tracking-[-0.04em] text-[#12392a] md:text-4xl">
              Let&rsquo;s find the right solution for your facility.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-[1.9] text-[#5b6460]">
              We offer customized hygiene solutions designed to align with your
              facility&rsquo;s operational needs. Reach out to request a quote
              or confirm availability.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {Object.values(INSTITUTIONAL_CONTACTS).map((c) => (
              <a
                key={c.label}
                href={c.href}
                {...(c.href.startsWith("http")
                  ? { target: "_blank", rel: "noreferrer" }
                  : {})}
                className="group rounded-2xl border border-black/[0.08] bg-white p-4 transition-shadow hover:shadow-md"
              >
                <span className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.15em] text-[#0b7a43]">
                  {c.label}
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
                <span className="mt-3 block break-words text-xs font-bold text-[#12392a]">
                  {c.value}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ── Product preview ── */}
      {selected && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-preview-title"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0f2a1d]/60 p-4 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative grid max-h-[90vh] w-full max-w-4xl gap-6 overflow-y-auto rounded-[32px] bg-white p-6 shadow-2xl sm:p-9 md:grid-cols-[0.9fr_1.1fr] md:items-center md:gap-9"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelected(null)}
              aria-label="Close preview"
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[#e8f2ea] text-[#12392a] transition-colors hover:bg-[#d6e8da] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00a651]"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex aspect-square max-h-[380px] w-full items-center justify-center rounded-3xl border border-black/10 bg-white p-8">
              {getImageUrl(selected.product.image) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={getImageUrl(selected.product.image)!}
                  alt={selected.product.name}
                  className="max-h-full max-w-full object-contain"
                  onError={(event) =>
                    handleProductImageError(
                      event,
                      getImageUrl(
                        getFallbackProductImage(selected.product.name),
                      ),
                    )
                  }
                />
              )}
            </div>

            <div className="md:pr-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#0b7a43]">
                Eco Hygiene • Product preview
              </p>
              <h3
                id="product-preview-title"
                className="mt-4 text-3xl font-bold leading-tight tracking-[-0.035em] text-[#12392a] sm:text-4xl"
              >
                {selected.product.name}
              </h3>
              <p className="mt-4 text-sm leading-[1.8] text-[#5b6460]">
                {selected.description}
              </p>
              <p className="mt-5 border-l-[3px] border-[#c9dccd] pl-4 text-xs leading-[1.9] text-[#6b756f]">
                For product specifications, variants, and availability, please
                contact our institutional sales team.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href={`${CONTACT_PAGE_URL}?${new URLSearchParams({
                    subject: `Inquiry: ${selected.product.name}`,
                    product: selected.product.name,
                  }).toString()}`}
                  onClick={() => setSelected(null)}
                  className="inline-flex items-center gap-2 rounded-full bg-[#00a651] px-6 py-3.5 text-xs font-bold text-white transition-colors hover:bg-[#009447]"
                >
                  Ask about this product{" "}
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="rounded-full border border-[#cfe3d3] bg-[#eef5ef] px-6 py-3.5 text-xs font-bold text-[#0f4a2c] transition-colors hover:bg-[#e1eee4]"
                >
                  Continue browsing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// ============================================================
// OUR CUSTOMERS
// ============================================================

function CustomerLogo({ name, src }: { name: string; src: string }) {
  const [failed, setFailed] = React.useState(false);

  return (
    <div className="flex h-14 items-center justify-center rounded-xl bg-[#E4F0E0] p-2 sm:h-20 sm:p-3 md:h-24">
      {failed ? (
        <span className="text-center text-[9px] font-semibold leading-3 text-[#103B2A] sm:text-xs sm:leading-4">
          {name}
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          loading="lazy"
          onError={() => setFailed(true)}
          style={{ filter: "contrast(1.1) brightness(1.05)" }}
          className="max-h-8 w-auto max-w-full object-contain mix-blend-multiply sm:max-h-12 md:max-h-14"
        />
      )}
    </div>
  );
}

function Customers() {
  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="container">
        <div className="text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#64756B]">
            Trusted by
          </p>

          <h2 className="mt-2 font-display text-3xl font-semibold text-[#103B2A]">
            Our Customers
          </h2>

          <div className="mx-auto mt-4 h-px w-14 bg-[#C9D8CE]" />
        </div>

        <div className="mx-auto mt-10 grid max-w-5xl grid-cols-4 gap-2 sm:gap-4">
          {CUSTOMERS.map((customer) => (
            <CustomerLogo
              key={customer.name}
              name={customer.name}
              src={customer.src}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function EcoHygieneInstitutionalPage() {
  const products = useInstitutionalProducts();

  return (
    <>
      <Navbar />
      <React.Suspense fallback={null}>
        <CategoryStrip />
      </React.Suspense>
      <main className="min-h-screen bg-white">
        <Hero />

        <Industries />

        <InstitutionalProductsShowcase products={products} />

        <Customers />
      </main>

      <Footer />
    </>
  );
}
