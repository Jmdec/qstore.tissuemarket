"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

/* Tissue-unrolling loader, new version based on the Quanta reference:
   a white roll rolls left to right on a plain green background, laying a
   perforated strip behind it, then the white Quanta logo appears
   underneath. Everything is centered, and the roll + strip are
   positioned so their combined width is centered once the roll finishes.

   - plays on every full page load / refresh (not on in-app navigation,
     because the root layout does not remount)
   - skipped for people who prefer reduced motion
   - the page renders underneath the overlay, so it is never kept waiting

   FIX: the laid strip used to be revealed by a CSS animation on a <clipPath>
   child. Browsers don't repaint that smoothly, so the strip showed up in
   choppy pieces. Now one requestAnimationFrame loop moves the roll and
   widens the strip's clip rect with the SAME value every frame, so the strip
   always grows continuously and is exactly as long as the roll has travelled. */
const CYCLE_MS = 1600;
/* logo + text appear as the roll finishes and stay until the page shows */
const LOGO_DELAY_MS = 500;
const TOTAL_MS = 2000;
const FADE_OUT_MS = 300;

/* Plain green from the brand palette (Heritage Forest). */
const BG = "#006B3F";

const R = 48; // face radius
const BX = -20; // back disc offset (up-left of the face)
const BY = -10.5;
const FACE_Y = 133; // face centre y
const STRIP_LEFT = 88;
const END_X = 344; // face centre x at the end of the roll
const RAMP = 66; // length of the part of the strip lifting into the roll
const START_X = STRIP_LEFT + RAMP; // face centre x at the start
const TRAVEL = END_X - START_X;
const FLAT_MAX = END_X - RAMP - STRIP_LEFT;
/* roll + strip span STRIP_LEFT .. END_X + R, which is centered on x = 240 */

/* tangent points joining the back disc to the face */
const len = Math.hypot(BX, BY);
const nx = -BY / len;
const ny = BX / len;
const T = [
  [nx * R, ny * R], // face, one side
  [BX + nx * R, BY + ny * R], // back, same side
  [BX - nx * R, BY - ny * R], // back, other side
  [-nx * R, -ny * R], // face, other side
];

type Phase = "pending" | "play" | "done";

export default function LoadingAnimated({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [phase, setPhase] = useState<Phase>("pending");
  const [fading, setFading] = useState(false);
  const rollRef = useRef<SVGGElement>(null);
  const clipRef = useRef<SVGRectElement>(null);

  // Decide once on mount whether the loader should play. It now plays on
  // every full load/refresh; the only reason to skip it is reduced motion.
  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    setPhase(reduceMotion ? "done" : "play");
  }, []);

  // Run the timers only while the loader is playing.
  useEffect(() => {
    if (phase !== "play") return;

    const fadeTimer = setTimeout(() => setFading(true), TOTAL_MS);
    const doneTimer = setTimeout(
      () => setPhase("done"),
      TOTAL_MS + FADE_OUT_MS,
    );

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [phase]);

  // Roll + strip animation: one loop, one distance value per frame.
  useEffect(() => {
    if (phase !== "play") return;

    let raf = 0;
    const startedAt = performance.now();

    const frame = (now: number) => {
      const t = Math.min(1, (now - startedAt) / CYCLE_MS);
      const eased = 0.5 - 0.5 * Math.cos(Math.PI * t); // ease-in-out
      const distance = TRAVEL * eased;

      // the roll (with its shadow and the strip lifting into it)
      rollRef.current?.setAttribute(
        "transform",
        `translate(${START_X + distance} ${FACE_Y})`,
      );
      // the flat strip is exactly as long as the roll has travelled
      // (+1px overlap hides any hairline seam under the lifting part)
      clipRef.current?.setAttribute("width", String(distance + 1));

      if (t < 1) raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  return (
    <>
      {phase === "play" &&
        createPortal(
          <div
            role="status"
            aria-label="Loading"
            style={{ backgroundColor: BG }}
            className={cn(
              "fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden transition-opacity duration-300",
              fading ? "opacity-0 pointer-events-none" : "opacity-100",
            )}
          >
            <div className="flex w-full flex-col items-center px-6">
              <svg
                viewBox="0 66 480 148"
                className="h-auto w-[min(92vw,560px)] overflow-visible"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="qp-face" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#ffffff" />
                    <stop offset="1" stopColor="#e9eeea" />
                  </linearGradient>
                  <linearGradient id="qp-core" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#a88a5e" />
                    <stop offset="1" stopColor="#7d6340" />
                  </linearGradient>
                  <pattern
                    id="qp-dots"
                    width="4"
                    height="4"
                    patternUnits="userSpaceOnUse"
                  >
                    <circle cx="2" cy="2" r="0.7" fill="#c5cfc7" />
                  </pattern>
                  <filter
                    id="qp-blur"
                    x="-50%"
                    y="-300%"
                    width="200%"
                    height="700%"
                  >
                    <feGaussianBlur stdDeviation="5" />
                  </filter>
                  {/* Width is set every frame by the animation loop above. */}
                  <clipPath id="qp-strip-clip">
                    <rect
                      ref={clipRef}
                      x={STRIP_LEFT}
                      y={FACE_Y}
                      width={0}
                      height={80}
                    />
                  </clipPath>
                </defs>

                <g className="cycle">
                  {/* flat perforated strip: one straight, continuous piece,
                      revealed left to right as the roll advances */}
                  <g clipPath="url(#qp-strip-clip)">
                    <rect
                      x={STRIP_LEFT}
                      y={FACE_Y + R - 12}
                      width={FLAT_MAX + 2}
                      height={14}
                      fill="#ffffff"
                    />
                    <rect
                      x={STRIP_LEFT}
                      y={FACE_Y + R - 12}
                      width={FLAT_MAX + 2}
                      height={14}
                      fill="url(#qp-dots)"
                    />
                  </g>

                  {/* the roll: shadow + lifting strip + body, moved together */}
                  <g
                    ref={rollRef}
                    transform={`translate(${START_X} ${FACE_Y})`}
                  >
                    {/* soft shadow on the ground, offset to the right */}
                    <ellipse
                      cx={14}
                      cy={R + 8}
                      rx={68}
                      ry={8}
                      fill="#00140b"
                      opacity={0.45}
                      filter="url(#qp-blur)"
                    />

                    {/* strip lifting into the bottom of the roll */}
                    <polygon
                      points={`${-RAMP},${R - 12} -6,${R - 14} 8,${R - 14} 8,${
                        R - 2
                      } -6,${R - 2} ${-RAMP},${R + 2}`}
                      fill="#ffffff"
                    />

                    {/* back disc + body */}
                    <circle
                      cx={BX}
                      cy={BY}
                      r={R}
                      fill="#e4e9e5"
                      stroke="#cdd6cf"
                      strokeWidth={0.9}
                    />
                    <polygon
                      points={T.map((p) => p.join(",")).join(" ")}
                      fill="#e4e9e5"
                    />
                    <line
                      x1={T[0][0]}
                      y1={T[0][1]}
                      x2={T[1][0]}
                      y2={T[1][1]}
                      stroke="#cdd6cf"
                      strokeWidth={0.9}
                    />
                    <line
                      x1={T[2][0]}
                      y1={T[2][1]}
                      x2={T[3][0]}
                      y2={T[3][1]}
                      stroke="#cdd6cf"
                      strokeWidth={0.9}
                    />

                    {/* front face */}
                    <circle
                      r={R}
                      fill="url(#qp-face)"
                      stroke="#d5ddd7"
                      strokeWidth={1}
                    />
                    <circle
                      r={R - 4}
                      fill="none"
                      stroke="#e6ebe7"
                      strokeWidth={1.2}
                    />

                    {/* cardboard core: static, nothing moves inside it */}
                    <circle
                      r={18}
                      fill="url(#qp-core)"
                      stroke="#6f5736"
                      strokeWidth={0.6}
                    />
                    <circle r={14} fill="#3b3d3c" />
                  </g>
                </g>
              </svg>

              {/* white logo, centered under the roll */}
              <div className="brand mt-8 flex flex-col items-center">
                <Image
                  src="/q-logo-no-bg.png"
                  alt="Quanta Paper Corporation"
                  width={480}
                  height={100}
                  priority
                  className="h-auto w-[200px] mix-blend-lighten sm:w-[240px]"
                />
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Hidden only for the instant before we know whether to play the
          loader. Otherwise the page is always rendered under the overlay. */}
      <div
        className={cn(
          "transition-opacity duration-300",
          phase === "pending" ? "opacity-0" : "opacity-100",
          className,
        )}
      >
        {children}
      </div>

      <style jsx>{`
        .cycle {
          animation: fade ${CYCLE_MS}ms ease-in-out forwards;
        }
        .brand {
          opacity: 0;
          animation: fade-in 500ms ease-out ${LOGO_DELAY_MS}ms forwards;
        }

        @keyframes fade {
          0% {
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          100% {
            opacity: 1;
          }
        }
        @keyframes fade-in {
          to {
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
