"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type FieldErrors = Record<string, string[]>;

// Torn-edge clip path for the paper card — matches the login page so both
// forms read as the same sheet of paper resting on the background photo.
const TORN_EDGE =
  "[clip-path:polygon(0%_5%,3%_1%,7%_4%,11%_0%,15%_3%,19%_5%,23%_1%,27%_4%,31%_0%,35%_3%,39%_5%,43%_1%,47%_4%,51%_0%,55%_3%,59%_5%,63%_1%,67%_4%,71%_0%,75%_3%,79%_5%,83%_1%,87%_4%,91%_0%,95%_3%,100%_5%,100%_100%,0%_100%)]";

export default function RegisterPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);

    const payload = {
      first_name: formData.get("first_name"),
      last_name: formData.get("last_name"),
      email: formData.get("email"),
      password: formData.get("password"),
      password_confirmation: formData.get("password_confirmation"),
    };

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 422 && data.errors) {
          setFieldErrors(data.errors as FieldErrors);
        } else {
          setFormError(
            data.message ?? "Something went wrong. Please try again.",
          );
        }
        return;
      }

      router.push("/account");
      router.refresh();
    } catch {
      setFormError("Could not reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const error = (field: string) => fieldErrors[field]?.[0];

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-[#DCEFC0]">
      {/* Full-bleed background photo, same asset and treatment as the login page */}
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

      <section className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 pb-16">
        <div
          className={`relative bg-[#FBF7EC] px-8 pb-10 pt-14 shadow-[0_30px_60px_-20px_rgba(21,44,29,0.35)] sm:px-10 ${TORN_EDGE}`}
        >
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#2F5C41]">
            ₱100 off your first order
          </p>
          <h1 className="mt-2 font-serif text-4xl italic text-[#1F2A1B]">
            Create your account
          </h1>
          <p className="mt-3 text-sm text-[#1F2A1B]/70">
            Save your address, track orders, and manage subscriptions in one
            place.
          </p>

          {formError && (
            <p className="mt-6 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {formError}
            </p>
          )}

          <form
            className="mt-8 flex flex-col gap-5"
            onSubmit={handleSubmit}
            noValidate
          >
            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-2 text-sm font-medium text-[#1F2A1B]">
                First name
                <input
                  type="text"
                  name="first_name"
                  required
                  autoComplete="given-name"
                  className="border border-[#1F2A1B]/15 bg-white px-4 py-3 text-sm text-[#1F2A1B] outline-none transition focus:border-[#2F5C41] focus:ring-2 focus:ring-[#2F5C41]/20"
                />
                {error("first_name") && (
                  <span className="text-xs text-red-600">
                    {error("first_name")}
                  </span>
                )}
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-[#1F2A1B]">
                Last name
                <input
                  type="text"
                  name="last_name"
                  required
                  autoComplete="family-name"
                  className="border border-[#1F2A1B]/15 bg-white px-4 py-3 text-sm text-[#1F2A1B] outline-none transition focus:border-[#2F5C41] focus:ring-2 focus:ring-[#2F5C41]/20"
                />
                {error("last_name") && (
                  <span className="text-xs text-red-600">
                    {error("last_name")}
                  </span>
                )}
              </label>
            </div>

            <label className="flex flex-col gap-2 text-sm font-medium text-[#1F2A1B]">
              Email address
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="border border-[#1F2A1B]/15 bg-white px-4 py-3 text-sm text-[#1F2A1B] placeholder:text-[#1F2A1B]/30 outline-none transition focus:border-[#2F5C41] focus:ring-2 focus:ring-[#2F5C41]/20"
              />
              {error("email") && (
                <span className="text-xs text-red-600">{error("email")}</span>
              )}
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-[#1F2A1B]">
              Phone number
              <input
                type="tel"
                name="phone"
                required
                inputMode="numeric"
                autoComplete="tel"
                maxLength={15}
                placeholder="Digits only"
                onInput={(e) => {
                  const input = e.currentTarget;
                  input.value = input.value.replace(/\D/g, "").slice(0, 15);
                }}
                className="border border-[#1F2A1B]/15 bg-white px-4 py-3 text-sm text-[#1F2A1B] placeholder:text-[#1F2A1B]/30 outline-none transition focus:border-[#2F5C41] focus:ring-2 focus:ring-[#2F5C41]/20"
              />
              {error("phone") && (
                <span className="text-xs text-red-600">{error("phone")}</span>
              )}
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-[#1F2A1B]">
              Password
              <input
                type="password"
                name="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                className="border border-[#1F2A1B]/15 bg-white px-4 py-3 text-sm text-[#1F2A1B] placeholder:text-[#1F2A1B]/30 outline-none transition focus:border-[#2F5C41] focus:ring-2 focus:ring-[#2F5C41]/20"
              />
              {error("password") && (
                <span className="text-xs text-red-600">
                  {error("password")}
                </span>
              )}
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-[#1F2A1B]">
              Confirm password
              <input
                type="password"
                name="password_confirmation"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Re-enter your password"
                className="border border-[#1F2A1B]/15 bg-white px-4 py-3 text-sm text-[#1F2A1B] placeholder:text-[#1F2A1B]/30 outline-none transition focus:border-[#2F5C41] focus:ring-2 focus:ring-[#2F5C41]/20"
              />
            </label>

            <label className="flex items-start gap-2 text-sm text-[#1F2A1B]/70">
              <input
                type="checkbox"
                required
                className="mt-0.5 h-4 w-4 rounded-none border-[#1F2A1B]/30 text-[#2F5C41] focus:ring-[#2F5C41]/30"
              />
              I agree to the Terms of Service and Privacy Policy.
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 bg-[#2F5C41] py-3.5 text-sm font-medium tracking-wide text-[#F4EFE1] transition hover:bg-[#24462F] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-[#1F2A1B]/70">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-[#2F5C41] underline decoration-transparent underline-offset-4 transition hover:decoration-[#2F5C41]"
            >
              Log in
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
