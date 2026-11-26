"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Torn-edge clip path for the paper card — a hand-set jagged top so the
// form reads as a sheet of paper resting on the background photo.
const TORN_EDGE =
  "[clip-path:polygon(0%_5%,3%_1%,7%_4%,11%_0%,15%_3%,19%_5%,23%_1%,27%_4%,31%_0%,35%_3%,39%_5%,43%_1%,47%_4%,51%_0%,55%_3%,59%_5%,63%_1%,67%_4%,71%_0%,75%_3%,79%_5%,83%_1%,87%_4%,91%_0%,95%_3%,100%_5%,100%_100%,0%_100%)]";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.message || "Invalid email or password.");
        return;
      }

      const role = data?.user?.role;

      if (role === "admin") {
        router.push("/admin");
      } else {
        router.push("/");
      }
      router.refresh();
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-[#DCEFC0]">
      {/* Full-bleed background photo, full opacity */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/login-background.png"
        alt=""
        aria-hidden="true"
        className="fixed inset-0 h-full w-full object-cover"
      />

      <header className="relative z-10 flex items-center justify-between px-6 py-8 sm:px-10">
        <Link href="/" className="font-serif text-xl italic text-[#1F2A1B]">
          Quanta Paper
        </Link>
        <p className="hidden font-mono text-xs uppercase tracking-[0.2em] text-[#1F2A1B]/70 sm:block">
          Fine paper goods
        </p>
      </header>

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-96px)] w-full max-w-md flex-1 flex-col justify-center px-4 pb-16">
        <div
          className={`relative bg-[#FBF7EC] px-8 pb-10 pt-14 shadow-[0_30px_60px_-20px_rgba(21,44,29,0.35)] sm:px-10 ${TORN_EDGE}`}
        >
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#1F2A1B]/50">
            Account
          </p>
          <h1 className="mt-2 font-serif text-4xl italic text-[#1F2A1B]">
            Welcome back
          </h1>
          <p className="mt-3 text-sm text-[#1F2A1B]/70">
            Log in to track orders, manage subscriptions, and check out faster.
          </p>

          {error && (
            <p className="mt-6 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
            <label className="flex flex-col gap-2 text-sm font-medium text-[#1F2A1B]">
              Email address
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border border-[#1F2A1B]/15 bg-white px-4 py-3 text-sm text-[#1F2A1B] placeholder:text-[#1F2A1B]/30 outline-none transition focus:border-[#2F5C41] focus:ring-2 focus:ring-[#2F5C41]/20"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-[#1F2A1B]">
              Password
              <input
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border border-[#1F2A1B]/15 bg-white px-4 py-3 text-sm text-[#1F2A1B] placeholder:text-[#1F2A1B]/30 outline-none transition focus:border-[#2F5C41] focus:ring-2 focus:ring-[#2F5C41]/20"
              />
            </label>

            <div className="flex items-center justify-between text-sm">
              {/* <label className="flex items-center gap-2 text-[#1F2A1B]/70">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded-none border-[#1F2A1B]/30 text-[#2F5C41] focus:ring-[#2F5C41]/30"
                />
                Remember me
              </label> */}
              {/* <a
                href="#"
                className="font-medium text-[#2F5C41] underline decoration-transparent underline-offset-4 transition hover:decoration-[#2F5C41]"
              >
                Forgot password?
              </a> */}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 bg-[#2F5C41] py-3.5 text-sm font-medium tracking-wide text-[#F4EFE1] transition hover:bg-[#24462F] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Logging in..." : "Log in"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-[#1F2A1B]/70">
            New to Quanta Paper?{" "}
            <Link
              href="/register"
              className="font-medium text-[#2F5C41] underline decoration-transparent underline-offset-4 transition hover:decoration-[#2F5C41]"
            >
              Create an account
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
