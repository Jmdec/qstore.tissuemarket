"use client";

import * as React from "react";

type Tissue = {
  id: number;
  x: number;
  y: number;
  size: number;
  rotation: number;
  duration: number;
  drift: number;
  tone: "white" | "cream" | "sage";
};

const TISSUE_COLORS: Record<Tissue["tone"], { fill: string; fold: string }> = {
  white: { fill: "#ffffff", fold: "#e2e8f0" },
  cream: { fill: "#fdfaf3", fold: "#e9e0cc" },
  sage: { fill: "#f1f6ec", fold: "#d6e6c6" },
};

const TONE_WEIGHTS: Tissue["tone"][] = [
  "white",
  "white",
  "white",
  "cream",
  "sage",
];

// A soft, slightly-crumpled tissue sheet — rounded square with a wavy
// top edge (like it's being pulled from a box) and a couple of fold
// lines so it reads as fabric/paper rather than a plain square.
function TissueShape({
  size,
  fill,
  fold,
}: {
  size: number;
  fill: string;
  fold: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 10
           C 6 6, 9 6, 11 9
           C 13 6, 15 6, 16 9
           C 17 6, 19 6, 21 9
           C 23 6, 26 6, 28 10
           L 28 26
           C 28 27.5, 26.8 28.5, 25.2 28.3
           L 6.8 28.3
           C 5.2 28.5, 4 27.5, 4 26
           Z"
        fill={fill}
        stroke="rgba(0,0,0,0.08)"
        strokeWidth="0.6"
      />
      {/* soft fold creases */}
      <path
        d="M8 15 Q16 18 24 15"
        stroke={fold}
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity={0.8}
      />
      <path
        d="M8 20 Q16 23 24 20"
        stroke={fold}
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity={0.6}
      />
    </svg>
  );
}

let idCounter = 0;

/**
 * Renders a fixed, click-through overlay that spawns tissue-sheet
 * particles as the user moves their mouse. Each tissue drifts sideways
 * and falls slightly while fading out, then unmounts itself once its
 * animation finishes. Mount this once near the root of the app (e.g. in
 * the root layout) so it applies everywhere.
 *
 * Disabled automatically for touch-only devices and for users who've
 * requested reduced motion.
 */
export function CursorTissueTrail() {
  const [tissues, setTissues] = React.useState<Tissue[]>([]);
  const lastSpawnRef = React.useRef(0);
  const enabledRef = React.useRef(true);

  React.useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
    enabledRef.current = !prefersReducedMotion && !isCoarsePointer;
  }, []);

  React.useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (!enabledRef.current) return;

      // Throttle spawns so we get a trail, not a solid smear.
      const now = performance.now();
      if (now - lastSpawnRef.current < 70) return;
      lastSpawnRef.current = now;

      const tone =
        TONE_WEIGHTS[Math.floor(Math.random() * TONE_WEIGHTS.length)];

      const tissue: Tissue = {
        id: idCounter++,
        x: e.clientX,
        y: e.clientY,
        size: 24 + Math.random() * 16,
        rotation: Math.random() * 360,
        duration: 950 + Math.random() * 550,
        drift: (Math.random() - 0.5) * 80,
        tone,
      };

      setTissues((prev) => {
        // Cap concurrent particles so a fast mouse doesn't pile up nodes.
        const next = [...prev, tissue];
        return next.length > 35 ? next.slice(next.length - 35) : next;
      });
    }

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const removeTissue = (id: number) => {
    setTissues((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden"
    >
      <style>{`
        @keyframes tissue-fall {
          0% {
            transform: translate(0, 0) rotate(var(--tissue-rot)) scale(1);
            opacity: 0.95;
          }
          100% {
            transform: translate(var(--tissue-drift), 90px) rotate(calc(var(--tissue-rot) + 140deg)) scale(0.7);
            opacity: 0;
          }
        }
        .tissue-particle {
          position: absolute;
          will-change: transform, opacity;
          animation-name: tissue-fall;
          animation-timing-function: ease-out;
          animation-fill-mode: forwards;
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.12));
        }
      `}</style>

      {tissues.map((tissue) => {
        const colors = TISSUE_COLORS[tissue.tone];
        return (
          <span
            key={tissue.id}
            className="tissue-particle"
            style={
              {
                left: tissue.x - tissue.size / 2,
                top: tissue.y - tissue.size / 2,
                animationDuration: `${tissue.duration}ms`,
                "--tissue-rot": `${tissue.rotation}deg`,
                "--tissue-drift": `${tissue.drift}px`,
              } as React.CSSProperties
            }
            onAnimationEnd={() => removeTissue(tissue.id)}
          >
            <TissueShape
              size={tissue.size}
              fill={colors.fill}
              fold={colors.fold}
            />
          </span>
        );
      })}
    </div>
  );
}
