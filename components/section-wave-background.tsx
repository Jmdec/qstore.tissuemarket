"use client";

export function SectionWaveBackground({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      className={`pointer-events-none absolute inset-0 -z-10 h-full w-full ${className}`}
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

// Paper-toned neutral with a fine dot-grain texture — nods to "Quanta Paper"
// without a literal tissue photo. Backdrop recedes so the colorful category
// tiles stay the visual focus.
export function SectionPaperBackground({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 -z-10 bg-[#F4F6EF] ${className}`}
      style={{
        backgroundImage:
          "radial-gradient(circle, rgba(60,90,50,0.07) 1px, transparent 1px)",
        backgroundSize: "18px 18px",
      }}
    />
  );
}

// Soft sage-to-mint gradient — stays in the same nature/green family as the
// rest of the site, just a touch richer than the neutral paper section so
// "Special Promos" still reads as its own moment.
export function SectionPromoBackground({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-moss-50 via-lime-50 to-moss-100 ${className}`}
    />
  );
}
export function SectionCleanBackground({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-moss-50/30 to-white ${className}`}
    />
  );
}
