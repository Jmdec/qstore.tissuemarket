"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type Slide = {
  id: number;
  src: string;
  alt: string;
};

// Raw shape returned by /api/banners (a thin passthrough of the Laravel
// API — see app/api/banners/route.ts).
type RawBanner = {
  id: number;
  image: string;
  image_url: string;
  sort_order: number;
};

const AUTO_SLIDE_INTERVAL = 5000;
// Fallback ratio used only until the first banner image finishes loading
// and reports its real dimensions.
const FALLBACK_ASPECT_RATIO = 2.4;

// Organic two-tone green wave, sampled from the reference image
// (light mint top, deeper green wave beneath).
function HeroWaveBackground() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 -z-10 h-full w-full"
      viewBox="0 0 1440 400"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <rect width="1440" height="400" fill="#D6F5B4" />
      <path
        d="M0,235 C120,255 220,268 340,262 C470,256 560,232 680,238
           C790,243 860,268 960,266 C1080,263 1150,225 1260,205
           C1330,193 1390,160 1440,120 L1440,400 L0,400 Z"
        fill="#83CF7B"
      />
    </svg>
  );
}

function HeroCarousel({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  // Measured from the actual banner image once it loads, so the container
  // matches the image's real proportions — no letterboxing, no cropping.
  const [aspectRatio, setAspectRatio] = React.useState<number | null>(null);

  const goTo = React.useCallback(
    (i: number) => {
      setIndex(((i % slides.length) + slides.length) % slides.length);
    },
    [slides.length],
  );

  const next = React.useCallback(() => {
    setIndex((i) => (i + 1) % slides.length);
  }, [slides.length]);

  const prev = React.useCallback(() => {
    setIndex((i) => (i - 1 + slides.length) % slides.length);
  }, [slides.length]);

  React.useEffect(() => {
    // Clamp index if the slide list shrinks (e.g. a banner gets deleted).
    if (index >= slides.length) setIndex(0);
  }, [slides.length, index]);

  React.useEffect(() => {
    if (paused || slides.length <= 1) return;
    const id = window.setInterval(next, AUTO_SLIDE_INTERVAL);
    return () => window.clearInterval(id);
  }, [paused, next, slides.length]);

  if (slides.length === 0) return null;

  return (
    <div
      className="group relative w-full overflow-hidden rounded-2xl shadow-lg"
      style={{ aspectRatio: aspectRatio ?? FALLBACK_ASPECT_RATIO }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((slide, i) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-700 ease-out ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            priority={i === 0}
            sizes="100vw"
            unoptimized
            className="object-contain"
            onLoadingComplete={(img) => {
              // Only lock the ratio once, off the first slide that loads.
              // Assumes banner uploads share a consistent aspect ratio,
              // which is the typical case for this admin-managed slot.
              if (
                aspectRatio === null &&
                img.naturalWidth &&
                img.naturalHeight
              ) {
                setAspectRatio(img.naturalWidth / img.naturalHeight);
              }
            }}
          />
        </div>
      ))}

      {slides.length > 1 && (
        <>
          <button
            aria-label="Previous image"
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 text-moss-900 opacity-0 transition group-hover:opacity-100 hover:bg-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            aria-label="Next image"
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 text-moss-900 opacity-0 transition group-hover:opacity-100 hover:bg-white"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => goTo(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-5 bg-white" : "w-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function HeroCarouselSkeleton() {
  return (
    <Skeleton
      className="w-full rounded-2xl"
      style={{ aspectRatio: FALLBACK_ASPECT_RATIO }}
    />
  );
}

export function Hero() {
  const [slides, setSlides] = React.useState<Slide[] | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    fetch("/api/banners")
      .then((res) => res.json())
      .then((data: RawBanner[]) => {
        if (cancelled) return;
        const mapped: Slide[] = [...data]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((banner) => ({
            id: banner.id,
            src: banner.image_url,
            alt: "Banner image",
          }));
        setSlides(mapped);
      })
      .catch(() => {
        if (!cancelled) setSlides([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="relative w-full overflow-hidden">
      <HeroWaveBackground />
      {/* Wider than the default .container so the image has more room to
          grow — was capped by the site's standard max-width before. */}
      <div className="mx-auto flex w-full max-w-[1600px] flex-col items-center gap-6 px-4 py-6 sm:px-6 sm:py-10 lg:flex-row lg:items-center lg:gap-8 lg:px-8">
        {/* Tagline — 24% column so the carousel gets more space. */}
        <div className="hidden w-full flex-shrink-0 lg:block lg:w-[24%]">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-forest shadow-sm">
            <ShieldCheck className="h-3.5 w-3.5" />
            Fast Delivery
          </span>

          {/* Logo replaces the old text headline. The h1 stays for SEO and
              screen readers, but is visually hidden. */}
          <h1 className="mt-4">
            <span className="sr-only">Q-Store</span>
            <Image
              src="/q-store-logo-no-bg.png"
              alt="Q-Store"
              width={480}
              height={160}
              priority
              className="h-auto w-full max-w-[280px]"
            />
          </h1>

          <p className="mt-4 max-w-sm text-sm font-medium leading-relaxed text-[#252927]">
            Shop your everyday essentials from your trusted brands. Find
            products that are eco-friendly, affordable, and reliable.
          </p>

          <Button asChild variant="gradient" size="lg" className="mt-5 gap-2">
            <Link href="/#shop">
              Start Shopping
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Carousel — takes 76% */}
        <div className="w-full lg:w-[76%]">
          {slides === null ? (
            <HeroCarouselSkeleton />
          ) : (
            <HeroCarousel slides={slides} />
          )}
        </div>
      </div>
    </section>
  );
}
