import Image from "next/image";

// Adjust these filenames to match whatever's actually inside public/logo.
// `name` is only used for the alt attribute (screen readers) — it's never
// rendered as visible text.
const LOGOS = [
  { name: "Fresh Eco Hygiene", src: "/logo/FreshbyEcohygieneLogo.png" },
  { name: "Fresh Eco Pulp", src: "/logo/FreshEcopulp.png" },
  { name: "Fresh", src: "/logo/FreshLogo.png" },
  { name: "Kami", src: "/logo/Kami-Logo.png" },
  { name: "Smart Choice", src: "/logo/Smartchoice.png" },
  { name: "Vanitá", src: "/logo/NewVanita.png" },
  { name: "Harmony", src: "/logo/HarmonyLogo.png" },
  { name: "Sweetbaby", src: "/logo/sweetbaby.png" },
  { name: "PrimeCare", src: "/logo/Personal-Care.png" },
  { name: "Life Defender", src: "/logo/LifeDefender.png" },
  { name: "TeaBiotic", src: "/logo/teabiotic.png" },
  { name: "Fresh Toothbrush", src: "/logo/FreshToothbrush.png" },
  { name: "Eco Hygiene", src: "/logo/ECOHYGIENELOGO.png" },
];

export function BrandStrip() {
  return (
    <section
      id="brands"
      className="border-y border-moss-100 bg-moss-50/60 py-12"
    >
      <div className="container">
        <p className="mb-6 text-center text-xs font-semibold uppercase tracking-wide text-moss-500">
          Look for your favorite brands
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
          {LOGOS.map((brand) => (
            <div
              key={brand.name}
              className="relative h-14 w-32 sm:h-20 sm:w-44"
            >
              <Image
                src={brand.src}
                alt={brand.name}
                fill
                className="object-contain"
                sizes="176px"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
