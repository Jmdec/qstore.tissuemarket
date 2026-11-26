import Link from "next/link";
import styles from "./not-found.module.css";

/**
 * 404 page for the Next.js App Router.
 * File location: app/not-found.tsx
 * Next.js automatically renders this whenever a route isn't matched,
 * or when you manually call notFound() from a route/page.
 */
export default function NotFound() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* header / logo */}
        <div className={styles.header}>
          <svg
            className={styles.logoMark}
            width="56"
            height="56"
            viewBox="0 0 56 56"
            fill="none"
          >
            <circle cx="28" cy="28" r="19" stroke="#4f8a2c" strokeWidth="7" />
            <path
              d="M38 38 C 44 42, 48 40, 50 44"
              stroke="#4f8a2c"
              strokeWidth="7"
              strokeLinecap="round"
              fill="none"
            />
            <ellipse
              cx="46"
              cy="41"
              rx="5"
              ry="3"
              fill="#6fae43"
              transform="rotate(35 46 41)"
            />
          </svg>
          <div className={styles.logoText}>QUANTA</div>
          <div className={styles.logoSub}>— PAPER —</div>
        </div>

        {/* main content */}
        <div className={styles.main}>
          <div>
            <div className={styles.codeRow}>
              <svg
                className={styles.sparkTop}
                width="26"
                height="40"
                viewBox="0 0 26 40"
                fill="none"
              >
                <path
                  d="M6 0 L9 12 M0 8 L10 16 M2 22 L11 20"
                  stroke="#6fae43"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
              <h1 className={styles.code}>404</h1>
            </div>

            <div className={styles.script}>Oops! Page not found</div>

            <div className={styles.divider}>
              <span />
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 21 C 6 15, 6 8, 12 3 C 18 8, 18 15, 12 21 Z"
                  fill="#6fae43"
                />
              </svg>
              <span />
            </div>

            <p className={styles.desc}>
              The page you&apos;re looking for doesn&apos;t exist or may have
              been moved.
            </p>

            <div className={styles.actions}>
              <Link href="/" className={styles.btn}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M3 11L12 4L21 11"
                    stroke="white"
                    strokeWidth={2.2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M5 10V19C5 19.55 5.45 20 6 20H9C9.55 20 10 19.55 10 19V15C10 14.45 10.45 14 11 14H13C13.55 14 14 14.45 14 15V19C14 19.55 14.45 20 15 20H18C18.55 20 19 19.55 19 19V10"
                    stroke="white"
                    strokeWidth={2.2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Back to Homepage
              </Link>
            </div>
          </div>

          <div className={styles.illustration}>
            <div className={styles.bubble}>
              Looks like this page went somewhere else
              <span className={styles.bubbleEmoji}>
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  style={{ display: "inline", verticalAlign: "middle" }}
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    fill="none"
                    stroke="#16401f"
                    strokeWidth="1.6"
                  />
                  <circle cx="8.5" cy="10" r="1.3" fill="#16401f" />
                  <circle cx="15.5" cy="10" r="1.3" fill="#16401f" />
                  <path
                    d="M8.5 16 Q12 13 15.5 16"
                    stroke="#16401f"
                    strokeWidth="1.4"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </div>
            <svg
              viewBox="0 0 480 560"
              width="100%"
              height="auto"
              xmlns="http://www.w3.org/2000/svg"
              role="img"
              aria-label="Illustration of a confused Quanta Paper tissue box character with a tissue popping out, next to a speech bubble that reads Looks like this page went somewhere else"
            >
              {/* background blobs */}
              <ellipse
                cx="330"
                cy="200"
                rx="150"
                ry="140"
                fill="#d8ecc0"
                opacity="0.5"
              />
              <ellipse
                cx="150"
                cy="420"
                rx="110"
                ry="90"
                fill="#d8ecc0"
                opacity="0.4"
              />

              {/* pedestal */}
              <ellipse
                cx="260"
                cy="500"
                rx="190"
                ry="26"
                fill="#f3f1e7"
                opacity="0.9"
              />
              <ellipse cx="260" cy="494" rx="190" ry="22" fill="#fbfaf5" />

              {/* leaves - left */}
              <g
                stroke="#4f8a2c"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
              >
                <path d="M90 480 C 78 430, 82 380, 110 340" />
                <path d="M98 400 C 78 396, 62 382, 56 364" />
                <path d="M100 440 C 80 438, 64 426, 58 410" />
              </g>
              <g fill="#7cbf4c">
                <ellipse
                  cx="58"
                  cy="363"
                  rx="13"
                  ry="7"
                  transform="rotate(-35 58 363)"
                />
                <ellipse
                  cx="59"
                  cy="409"
                  rx="14"
                  ry="8"
                  transform="rotate(-15 59 409)"
                />
              </g>

              {/* leaves - right, behind box */}
              <g
                stroke="#4f8a2c"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
              >
                <path d="M400 420 C 412 370, 408 330, 384 300" />
                <path d="M392 350 C 410 346, 424 334, 430 318" />
              </g>
              <g fill="#7cbf4c">
                <ellipse
                  cx="428"
                  cy="317"
                  rx="13"
                  ry="7"
                  transform="rotate(35 428 317)"
                />
              </g>

              {/* crumpled tissue ball, foreground right */}
              <g>
                <path
                  d="M400 460 C 392 450, 396 438, 408 434 C 412 424, 426 422, 432 430 C 444 428, 452 438, 448 448 C 456 456, 450 470, 438 470 C 434 478, 420 480, 414 472 C 402 474, 396 468, 400 460 Z"
                  fill="#ffffff"
                  stroke="#e7e4d6"
                  strokeWidth="1.5"
                />
                <path
                  d="M410 442 L420 450 M424 436 L430 448 M416 458 L428 460"
                  stroke="#e7e4d6"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </g>

              {/* small leaf resting on box */}
              <g transform="translate(330,300) rotate(20)">
                <path
                  d="M0 20 C -14 12, -14 -6, 0 -18 C 14 -6, 14 12, 0 20 Z"
                  fill="#7cbf4c"
                />
                <line
                  x1="0"
                  y1="20"
                  x2="0"
                  y2="-16"
                  stroke="#4f8a2c"
                  strokeWidth="1.5"
                />
              </g>

              {/* question mark */}
              <text
                className={styles.question}
                x="425"
                y="220"
                fontFamily="Baloo 2, sans-serif"
                fontWeight={800}
                fontSize="46"
                fill="#6fae43"
                textAnchor="middle"
              >
                ?
              </text>

              {/* tissue popping out */}
              <g className={styles.tissue}>
                <path
                  d="M240 285 C 238 250, 244 218, 262 190 C 268 216, 270 240, 266 264 L266 285 Z"
                  fill="#f4f2e9"
                />
                <path
                  d="M266 285 C 262 246, 270 208, 296 178 C 300 210, 300 240, 292 268 L292 285 Z"
                  fill="#ffffff"
                  stroke="#e9e6d8"
                  strokeWidth="1.5"
                />
                <path
                  d="M292 285 C 296 252, 310 226, 332 212 C 332 236, 326 258, 312 278 L306 285 Z"
                  fill="#f4f2e9"
                />
                <path
                  d="M262 220 L258 250"
                  stroke="#e0ddce"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                />
                <path
                  d="M283 205 L279 240"
                  stroke="#dcd8c8"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                />
              </g>

              {/* tissue box */}
              <g>
                {/* box top */}
                <path
                  d="M195 275 L365 275 L340 300 L220 300 Z"
                  fill="var(--box-dark)"
                />
                {/* opening slot */}
                <ellipse cx="280" cy="288" rx="30" ry="9" fill="#8fac66" />
                {/* box front */}
                <path
                  d="M195 275 L220 300 L220 420 L195 400 Z"
                  fill="var(--box-side)"
                />
                <path
                  d="M365 275 L340 300 L340 420 L365 400 Z"
                  fill="var(--box-side)"
                />
                <rect
                  x="220"
                  y="300"
                  width="120"
                  height="120"
                  fill="var(--box)"
                />

                {/* face */}
                <path
                  d="M242 350 q10 -12 20 -2"
                  stroke="#16401f"
                  strokeWidth="3.5"
                  fill="none"
                  strokeLinecap="round"
                />
                <ellipse cx="250" cy="372" rx="7" ry="10" fill="#16401f" />
                <path
                  d="M282 368 l14 8 l-14 8"
                  stroke="#16401f"
                  strokeWidth="3.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M244 398 Q262 388 282 396"
                  stroke="#16401f"
                  strokeWidth="3.5"
                  fill="none"
                  strokeLinecap="round"
                />

                {/* decorative leaves printed on box side */}
                <g stroke="#8fac66" strokeWidth="2" fill="none" opacity="0.6">
                  <path d="M348 320 C 358 330, 358 345, 348 355" />
                  <path d="M352 335 C 360 333, 366 328, 368 320" />
                </g>
              </g>
            </svg>
          </div>
        </div>

        {/* footer tagline */}
        <div className={styles.footer}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="#4f8a2c">
            <path d="M12 21 C 5 15, 2 10, 2 6.5 C 2 3.5, 4.5 1.5, 7.5 1.5 C 9.5 1.5, 11 2.5, 12 4 C 13 2.5, 14.5 1.5, 16.5 1.5 C 19.5 1.5, 22 3.5, 22 6.5 C 22 10, 19 15, 12 21 Z" />
          </svg>
          Every sheet, we care.
        </div>
      </div>
    </div>
  );
}
