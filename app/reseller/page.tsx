"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  UploadCloud,
  X,
  Check,
  AlertCircle,
  Plus,
  Trash2,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STEPS = [
  "Account",
  "General",
  "Data",
  "References",
  "Signatories",
] as const;

// Matches the `address_type` enum validated on the backend
// (StoreResellerRequest::rules -> address_type -> Rule::in([...])).
const ADDRESS_TYPE_OPTIONS = ["Home", "Business", "Billing", "Shipping"];

const MAX_FILES = 6;
const MAX_FILE_SIZE_MB = 200;

// --- Validation patterns ---
// Letters (incl. accented), spaces, hyphens, apostrophes, periods only.
const NAME_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ'.\- ]{2,}$/;
// Philippine mobile: 09 followed by 9 digits = 11 digits total.
const PH_MOBILE_REGEX = /^09\d{9}$/;
// Philippine landline, with or without dashes, e.g. 02-8123-4567 / 082-123-4567.
const PH_TELEPHONE_REGEX = /^0\d{1,2}-?\d{3}-?\d{4}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// TIN: 123-456-789 or 123-456-789-000
const TIN_REGEX = /^\d{3}-?\d{3}-?\d{3}(-?\d{3,5})?$/;
// SSS: 12-3456789-0
const SSS_REGEX = /^\d{2}-?\d{7}-?\d{1}$/;
const URL_REGEX = /^https?:\/\/\S+$/i;

function TornDivider() {
  return (
    <div className="relative">
      {/* Notch circles use the Paper White page background */}
      <div className="absolute -left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-[#F8F7F4] sm:-left-6" />
      <div className="absolute -right-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-[#F8F7F4] sm:-right-6" />
      <div className="border-t border-dashed border-[#C6C8C5]" />
    </div>
  );
}

function StepProgress({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-semibold transition-colors",
                done && "bg-[#006B3F] text-white",
                active && "border-2 border-[#006B3F] bg-white text-[#006B3F]",
                !done &&
                  !active &&
                  "border border-[#C6C8C5] bg-white text-[#252927]/50",
              )}
            >
              {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
            </div>
            <span
              className={cn(
                "hidden text-xs font-medium sm:block",
                active ? "text-[#252927]" : "text-[#252927]/50",
              )}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-px flex-1",
                  done ? "bg-[#006B3F]" : "bg-[#C6C8C5]",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

type CharacterReference = {
  id: string;
  name: string;
  position: string;
  contact: string;
  email: string;
};

function newReference(): CharacterReference {
  return {
    id: Math.random().toString(36).slice(2),
    name: "",
    position: "",
    contact: "",
    email: "",
  };
}

function passwordStrength(pw: string): { score: number; label: string } {
  if (!pw) return { score: 0, label: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ["Very weak", "Weak", "Fair", "Good", "Strong"];
  return { score, label: labels[score] };
}

export default function ResellerRegisterPage() {
  const [step, setStep] = React.useState(0);

  // --- Account information ---
  const [email, setEmail] = React.useState("");
  const [confirmEmail, setConfirmEmail] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  // --- General information ---
  const [addressType, setAddressType] = React.useState("");
  const [age, setAge] = React.useState("");
  const [cellphone, setCellphone] = React.useState("");
  const [completeAddress, setCompleteAddress] = React.useState("");
  const [facebook, setFacebook] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [instagram, setInstagram] = React.useState("");
  const [telephone, setTelephone] = React.useState("");
  const [twitter, setTwitter] = React.useState("");

  // --- Data ---
  const [tin, setTin] = React.useState("");
  const [birthday, setBirthday] = React.useState("");
  const [sssNumber, setSssNumber] = React.useState("");

  // --- Character references ---
  const [references, setReferences] = React.useState<CharacterReference[]>([
    newReference(),
  ]);

  const addReference = () => setReferences((prev) => [...prev, newReference()]);

  const removeReference = (id: string) => {
    setReferences((prev) =>
      prev.length === 1 ? prev : prev.filter((r) => r.id !== id),
    );
  };

  const updateReference = (
    id: string,
    field: keyof Omit<CharacterReference, "id">,
    value: string,
  ) => {
    setReferences((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    );
  };

  // --- Authorized signatories ---
  const [signatory1, setSignatory1] = React.useState("");
  const [signatory2, setSignatory2] = React.useState("");
  const [applicantName, setApplicantName] = React.useState("");
  const [position, setPosition] = React.useState("");
  const [files, setFiles] = React.useState<File[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const incoming = Array.from(fileList);

    const tooBig = incoming.find(
      (f) => f.size > MAX_FILE_SIZE_MB * 1024 * 1024,
    );
    if (tooBig) {
      toast.error(`"${tooBig.name}" exceeds the ${MAX_FILE_SIZE_MB}MB limit.`);
      return;
    }

    setFiles((prev) => {
      const combined = [...prev, ...incoming];
      if (combined.length > MAX_FILES) {
        toast.error(`You can upload a maximum of ${MAX_FILES} files.`);
        return prev;
      }
      return combined;
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // --- Validation, per step ---
  const [errors, setErrors] = React.useState<string[]>([]);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const errorRef = React.useRef<HTMLDivElement>(null);

  const validateStep = (index: number): string[] => {
    const errs: string[] = [];

    if (index === 0) {
      if (!email.trim()) errs.push("Email address is required.");
      else if (!EMAIL_REGEX.test(email.trim()))
        errs.push("Enter a valid email address (e.g., yourname@email.com).");

      if (!confirmEmail.trim()) errs.push("Please confirm your email address.");
      else if (email.trim() && confirmEmail.trim() !== email.trim())
        errs.push("Email addresses do not match.");

      if (!username.trim()) errs.push("Username is required.");
      else if (!/^[A-Za-z0-9 .\-'_@]+$/.test(username.trim()))
        errs.push(
          "Username may only contain letters, numbers, spaces, and . - ' _ @",
        );

      if (!password) errs.push("Password is required.");
      else if (password.length < 8)
        errs.push("Password must be at least 8 characters.");

      if (!confirmPassword) errs.push("Please confirm your password.");
      else if (password && confirmPassword !== password)
        errs.push("Passwords do not match.");
    }

    if (index === 1) {
      if (!addressType) errs.push("Please select an address type.");

      if (!age.trim()) errs.push("Age is required.");
      else if (!/^\d+$/.test(age.trim()))
        errs.push("Age must be a whole number, with no letters or symbols.");
      else {
        const ageNum = Number(age);
        if (ageNum < 18)
          errs.push("You must be at least 18 years old to register.");
        else if (ageNum > 100) errs.push("Please enter a valid age.");
      }

      if (!cellphone.trim()) errs.push("Cellphone number is required.");
      else if (!PH_MOBILE_REGEX.test(cellphone.trim().replace(/[\s-]/g, "")))
        errs.push(
          "Cellphone number must start with 09 and have 11 digits (e.g., 09171234567).",
        );

      if (telephone.trim() && !PH_TELEPHONE_REGEX.test(telephone.trim()))
        errs.push(
          "Telephone number format is invalid (e.g., 02-8123-4567 or 082-123-4567).",
        );

      if (!completeAddress.trim())
        errs.push("Complete address (delivery) is required.");

      if (!fullName.trim()) errs.push("Full name is required.");
      else if (!NAME_REGEX.test(fullName.trim()))
        errs.push(
          "Full name must contain letters only (no numbers or symbols).",
        );

      if (!facebook.trim()) errs.push("Facebook account is required.");
      else if (!URL_REGEX.test(facebook.trim()))
        errs.push(
          "Facebook account must be a valid link (e.g., https://facebook.com/yourname).",
        );

      if (instagram.trim() && !URL_REGEX.test(instagram.trim()))
        errs.push(
          "Instagram account must be a valid link (e.g., https://instagram.com/yourname).",
        );

      if (twitter.trim() && !URL_REGEX.test(twitter.trim()))
        errs.push(
          "Twitter account must be a valid link (e.g., https://twitter.com/yourname).",
        );
    }

    if (index === 2) {
      if (!tin.trim()) errs.push("BIR registration / TIN is required.");
      else if (!TIN_REGEX.test(tin.trim()))
        errs.push("TIN must look like 123-456-789 or 123-456-789-000.");

      if (!sssNumber.trim()) errs.push("SSS number is required.");
      else if (!SSS_REGEX.test(sssNumber.trim()))
        errs.push("SSS number must look like 12-3456789-0.");

      if (birthday.trim()) {
        const bday = new Date(birthday);
        if (Number.isNaN(bday.getTime()) || bday > new Date())
          errs.push("Birthday must be a valid date that is not in the future.");
      }
    }

    if (index === 3) {
      references.forEach((ref, i) => {
        const label = `Character reference #${i + 1}`;

        if (!ref.name.trim()) errs.push(`${label}: name is required.`);
        else if (!NAME_REGEX.test(ref.name.trim()))
          errs.push(`${label}: name must contain letters only.`);

        if (!ref.position.trim()) errs.push(`${label}: position is required.`);
        else if (!NAME_REGEX.test(ref.position.trim()))
          errs.push(`${label}: position must contain letters only.`);

        if (!ref.contact.trim())
          errs.push(`${label}: contact number is required.`);
        else if (
          !PH_MOBILE_REGEX.test(ref.contact.trim().replace(/[\s-]/g, ""))
        )
          errs.push(
            `${label}: contact number must start with 09 and have 11 digits (e.g., 09171234567).`,
          );

        if (!ref.email.trim())
          errs.push(`${label}: email address is required.`);
        else if (!EMAIL_REGEX.test(ref.email.trim()))
          errs.push(`${label}: enter a valid email address.`);
      });
    }

    if (index === 4) {
      if (!signatory1.trim()) errs.push("Signatory 1 is required.");
      else if (!NAME_REGEX.test(signatory1.trim()))
        errs.push("Signatory 1 must contain letters only.");

      if (!signatory2.trim()) errs.push("Signatory 2 is required.");
      else if (!NAME_REGEX.test(signatory2.trim()))
        errs.push("Signatory 2 must contain letters only.");

      if (!applicantName.trim()) errs.push("Applicant name is required.");
      else if (!NAME_REGEX.test(applicantName.trim()))
        errs.push("Applicant name must contain letters only.");

      if (!position.trim()) errs.push("Position is required.");
      else if (!NAME_REGEX.test(position.trim()))
        errs.push("Position must contain letters only.");
    }

    return errs;
  };

  const scrollToTop = () => {
    requestAnimationFrame(() => {
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const goNext = () => {
    const stepErrors = validateStep(step);
    if (stepErrors.length > 0) {
      setErrors(stepErrors);
      toast.error("Please fix the highlighted fields");
      scrollToTop();
      return;
    }
    setErrors([]);
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goBack = () => {
    setErrors([]);
    if (step > 0) {
      setStep((s) => s - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = async () => {
    const stepErrors = validateStep(step);
    if (stepErrors.length > 0) {
      setErrors(stepErrors);
      toast.error("Please fix the highlighted fields");
      scrollToTop();
      return;
    }

    setErrors([]);
    setSubmitting(true);

    try {
      const form = new FormData();
      form.append("email", email);
      form.append("username", username);
      form.append("password", password);
      // Laravel's `confirmed` rule expects `{field}_confirmation`.
      form.append("password_confirmation", confirmPassword);
      form.append("address_type", addressType);
      form.append("age", age);
      form.append("cellphone", cellphone);
      form.append("telephone", telephone);
      form.append("complete_address", completeAddress);
      form.append("full_name", fullName);
      form.append("facebook", facebook);
      form.append("instagram", instagram);
      form.append("twitter", twitter);
      form.append("tin", tin);
      form.append("birthday", birthday);
      form.append("sss_number", sssNumber);
      form.append(
        "character_references",
        JSON.stringify(
          references.map(({ name, position, contact, email }) => ({
            name,
            position,
            contact,
            email,
          })),
        ),
      );
      form.append("signatory_1", signatory1);
      form.append("signatory_2", signatory2);
      form.append("applicant_name", applicantName);
      form.append("position", position);
      files.forEach((file) => form.append("files[]", file));

      const res = await fetch("/api/reseller/register", {
        method: "POST",
        body: form,
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 422 && data.errors) {
          const messages = Object.values(
            data.errors as Record<string, string[]>,
          ).flat();
          setErrors(messages);
          toast.error("Please fix the highlighted fields");
        } else {
          const message =
            data.message ??
            "Something went wrong submitting your application. Please try again.";
          setErrors([message]);
          toast.error("Submission failed", { description: message });
        }
        scrollToTop();
        return;
      }

      toast.success("Application submitted!", {
        description:
          "We'll review your reseller application and get back to you.",
      });
      setSubmitted(true);
    } catch {
      const message =
        "Something went wrong submitting your application. Please try again.";
      setErrors([message]);
      toast.error("Submission failed", { description: message });
    } finally {
      setSubmitting(false);
    }
  };

  const strength = passwordStrength(password);
  const isLastStep = step === STEPS.length - 1;

  return (
    <>
      {/* Paper White (#F8F7F4) page background from the brand palette.
          Quanta Green is reserved for the hero banner. */}
      <div aria-hidden className="fixed inset-0 -z-10 bg-[#F8F7F4]" />

      <Navbar />
      <main className="flex-1">
        {/* Hero banner — Quanta Green (#00A552) */}
        <section className="bg-[#00A552]">
          <div className="container max-w-3xl pt-6 sm:pt-8">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#006B3F] hover:text-[#00A552]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to shop
            </Link>

            <h1 className="mt-3 font-display text-2xl font-medium italic text-[#252927] sm:text-3xl">
              Become a reseller
            </h1>
            <div className="mt-3 h-1 w-12 rounded-full bg-[#00A552]" />
          </div>
        </section>

        <div className="container max-w-3xl py-6 sm:py-8">
          {!submitted && (
            <div className="rounded-2xl border border-[#C6C8C5] bg-white p-4 shadow-sm sm:p-5">
              <StepProgress current={step} />
            </div>
          )}

          {submitted ? (
            <div className="rounded-2xl border border-[#C6C8C5] bg-white p-10 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F8F7F4]">
                <Check className="h-7 w-7 text-[#006B3F]" strokeWidth={3} />
              </div>
              <p className="mt-4 font-display text-xl font-medium italic text-[#252927]">
                Application submitted!
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                We&apos;ll review your reseller application and reach out by
                email.
              </p>
              <Button asChild variant="gradient" className="mt-5">
                <Link href="/">Back to home</Link>
              </Button>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-[#C6C8C5] bg-white shadow-sm">
              {errors.length > 0 && (
                <div
                  ref={errorRef}
                  className="m-5 flex flex-col gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4"
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    Please fix the following before continuing:
                  </div>
                  <ul className="ml-6 list-disc space-y-0.5 text-sm text-destructive">
                    {errors.map((err) => (
                      <li key={err}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Step 1: Account information */}
              {step === 0 && (
                <section className="p-5">
                  <h2 className="font-display text-lg font-semibold italic text-[#252927]">
                    Account information
                  </h2>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="email" className="text-xs text-moss-500">
                        Email address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@email.com"
                        className="mt-1"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        All emails from the system will be sent to this address.
                      </p>
                    </div>
                    <div>
                      <Label
                        htmlFor="confirmEmail"
                        className="text-xs text-moss-500"
                      >
                        Confirm e-mail address
                      </Label>
                      <Input
                        id="confirmEmail"
                        type="email"
                        className="mt-1"
                        value={confirmEmail}
                        onChange={(e) => setConfirmEmail(e.target.value)}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label
                        htmlFor="username"
                        className="text-xs text-moss-500"
                      >
                        Username
                      </Label>
                      <Input
                        id="username"
                        className="mt-1"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Special characters allowed: space, period (.), hyphen
                        (-), apostrophe (&apos;), underscore (_), and @.
                      </p>
                    </div>
                    <div>
                      <Label
                        htmlFor="password"
                        className="text-xs text-moss-500"
                      >
                        Password
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        className="mt-1"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#C6C8C5]/50">
                        <div
                          className="h-full bg-[#006B3F] transition-all"
                          style={{ width: `${(strength.score / 4) * 100}%` }}
                        />
                      </div>
                      {strength.label && (
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          Password strength: {strength.label}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label
                        htmlFor="confirmPassword"
                        className="text-xs text-moss-500"
                      >
                        Confirm password
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        className="mt-1"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>
                </section>
              )}

              {/* Step 2: General information */}
              {step === 1 && (
                <section className="p-5">
                  <h2 className="font-display text-lg font-semibold italic text-[#252927]">
                    General information
                  </h2>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <Label
                        htmlFor="addressType"
                        className="text-xs text-moss-500"
                      >
                        Address type
                      </Label>
                      <select
                        id="addressType"
                        className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-ring"
                        value={addressType}
                        onChange={(e) => setAddressType(e.target.value)}
                      >
                        <option value="">- Select a value -</option>
                        {ADDRESS_TYPE_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="age" className="text-xs text-moss-500">
                        Age
                      </Label>
                      <Input
                        id="age"
                        type="number"
                        min={18}
                        max={100}
                        className="mt-1"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="cellphone"
                        className="text-xs text-moss-500"
                      >
                        Cellphone no.
                      </Label>
                      <Input
                        id="cellphone"
                        placeholder="09171234567"
                        inputMode="numeric"
                        className="mt-1"
                        value={cellphone}
                        onChange={(e) => setCellphone(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="telephone"
                        className="text-xs text-moss-500"
                      >
                        Telephone no.
                      </Label>
                      <Input
                        id="telephone"
                        placeholder="02-8123-4567"
                        className="mt-1"
                        value={telephone}
                        onChange={(e) => setTelephone(e.target.value)}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label
                        htmlFor="completeAddress"
                        className="text-xs text-moss-500"
                      >
                        Complete address (delivery)
                      </Label>
                      <Input
                        id="completeAddress"
                        className="mt-1"
                        value={completeAddress}
                        onChange={(e) => setCompleteAddress(e.target.value)}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label
                        htmlFor="fullName"
                        className="text-xs text-moss-500"
                      >
                        Full name
                      </Label>
                      <Input
                        id="fullName"
                        className="mt-1"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="facebook"
                        className="text-xs text-moss-500"
                      >
                        Facebook account
                      </Label>
                      <Input
                        id="facebook"
                        placeholder="https://facebook.com/..."
                        className="mt-1"
                        value={facebook}
                        onChange={(e) => setFacebook(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="instagram"
                        className="text-xs text-moss-500"
                      >
                        Instagram account
                      </Label>
                      <Input
                        id="instagram"
                        placeholder="https://instagram.com/..."
                        className="mt-1"
                        value={instagram}
                        onChange={(e) => setInstagram(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="twitter"
                        className="text-xs text-moss-500"
                      >
                        Twitter account
                      </Label>
                      <Input
                        id="twitter"
                        placeholder="https://twitter.com/..."
                        className="mt-1"
                        value={twitter}
                        onChange={(e) => setTwitter(e.target.value)}
                      />
                    </div>
                  </div>
                </section>
              )}

              {/* Step 3: Data */}
              {step === 2 && (
                <section className="p-5">
                  <h2 className="font-display text-lg font-semibold italic text-[#252927]">
                    Data
                  </h2>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Label htmlFor="tin" className="text-xs text-moss-500">
                        BIR registration / TIN
                      </Label>
                      <Input
                        id="tin"
                        placeholder="123-456-789"
                        className="mt-1"
                        value={tin}
                        onChange={(e) => setTin(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="birthday"
                        className="text-xs text-moss-500"
                      >
                        Birthday
                      </Label>
                      <Input
                        id="birthday"
                        type="date"
                        max={new Date().toISOString().split("T")[0]}
                        className="mt-1"
                        value={birthday}
                        onChange={(e) => setBirthday(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="sssNumber"
                        className="text-xs text-moss-500"
                      >
                        SSS number
                      </Label>
                      <Input
                        id="sssNumber"
                        placeholder="12-3456789-0"
                        className="mt-1"
                        value={sssNumber}
                        onChange={(e) => setSssNumber(e.target.value)}
                      />
                    </div>
                  </div>
                </section>
              )}

              {/* Step 4: Character references */}
              {step === 3 && (
                <section className="p-5">
                  <h2 className="font-display text-lg font-semibold italic text-[#252927]">
                    Character references
                  </h2>
                  <div className="mt-3 flex flex-col gap-3">
                    {references.map((ref, i) => (
                      <div
                        key={ref.id}
                        className="rounded-xl border border-[#C6C8C5] bg-[#F8F7F4] p-4"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-widest2 text-moss-500">
                            Reference {i + 1}
                          </span>
                          {references.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeReference(ref.id)}
                              aria-label="Remove reference"
                              className="rounded-full p-1.5 text-muted-foreground hover:bg-white hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div>
                            <Label className="text-xs text-moss-500">
                              Name
                            </Label>
                            <Input
                              className="mt-1 bg-white"
                              value={ref.name}
                              onChange={(e) =>
                                updateReference(ref.id, "name", e.target.value)
                              }
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-moss-500">
                              Position
                            </Label>
                            <Input
                              className="mt-1 bg-white"
                              value={ref.position}
                              onChange={(e) =>
                                updateReference(
                                  ref.id,
                                  "position",
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-moss-500">
                              Contact number
                            </Label>
                            <Input
                              placeholder="09171234567"
                              inputMode="numeric"
                              className="mt-1 bg-white"
                              value={ref.contact}
                              onChange={(e) =>
                                updateReference(
                                  ref.id,
                                  "contact",
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-moss-500">
                              E-mail address
                            </Label>
                            <Input
                              type="email"
                              className="mt-1 bg-white"
                              value={ref.email}
                              onChange={(e) =>
                                updateReference(ref.id, "email", e.target.value)
                              }
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      className="w-fit gap-1.5"
                      onClick={addReference}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add character reference
                    </Button>
                  </div>
                </section>
              )}

              {/* Step 5: Authorized signatories */}
              {step === 4 && (
                <section className="p-5">
                  <h2 className="font-display text-lg font-semibold italic text-[#252927]">
                    Authorized signatories
                  </h2>
                  <ul className="ml-5 mt-2 list-disc space-y-0.5 text-xs text-muted-foreground">
                    <li>
                      To accept deliveries and sign invoice/s in behalf of
                      customer
                    </li>
                    <li>
                      To effect change in trade name and/or type of
                      organization; billing and shipping address; request for
                      increase in credit limit
                    </li>
                  </ul>

                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <Label
                        htmlFor="signatory1"
                        className="text-xs text-moss-500"
                      >
                        Signatory 1
                      </Label>
                      <Input
                        id="signatory1"
                        placeholder="Full name"
                        className="mt-1"
                        value={signatory1}
                        onChange={(e) => setSignatory1(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="signatory2"
                        className="text-xs text-moss-500"
                      >
                        Signatory 2
                      </Label>
                      <Input
                        id="signatory2"
                        placeholder="Full name"
                        className="mt-1"
                        value={signatory2}
                        onChange={(e) => setSignatory2(e.target.value)}
                      />
                    </div>
                  </div>

                  <p className="mt-4 text-xs text-muted-foreground">
                    The undersigned, duly authorized to sign in behalf of you
                    hereby declares that the foregoing are true and correct.
                  </p>

                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <Label
                        htmlFor="applicantName"
                        className="text-xs text-moss-500"
                      >
                        Applicant name
                      </Label>
                      <Input
                        id="applicantName"
                        placeholder="Full name"
                        className="mt-1"
                        value={applicantName}
                        onChange={(e) => setApplicantName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="position"
                        className="text-xs text-moss-500"
                      >
                        Position
                      </Label>
                      <Input
                        id="position"
                        placeholder="Enter here"
                        className="mt-1"
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <TornDivider />
                  </div>

                  <p className="mt-4 text-xs font-semibold uppercase tracking-widest2 text-moss-500">
                    Required documents
                  </p>
                  <div className="mt-2 grid grid-cols-1 gap-x-6 gap-y-0.5 text-xs text-muted-foreground sm:grid-cols-2">
                    <p>Signature of Signatory 1</p>
                    <p>Barangay Clearance / Police Clearance</p>
                    <p>Signature of Signatory 2</p>
                    <p>One (1) valid government ID</p>
                    <p>Signature of Applicant</p>
                    <p>TIN ID</p>
                  </div>

                  <div className="mt-4">
                    {files.length === 0 ? (
                      <label
                        htmlFor="signatoryFiles"
                        className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-[#C6C8C5] bg-[#F8F7F4] px-4 py-6 text-center hover:border-[#006B3F]"
                      >
                        <UploadCloud className="h-5 w-5 text-[#006B3F]" />
                        <span className="text-xs font-medium text-[#252927]">
                          Choose files to upload
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          pdf, jpeg, jpg, png, docx, doc — up to{" "}
                          {MAX_FILE_SIZE_MB}MB each, max {MAX_FILES} files
                        </span>
                        <input
                          id="signatoryFiles"
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept=".pdf,.jpeg,.jpg,.png,.docx,.doc"
                          className="hidden"
                          onChange={(e) => handleFiles(e.target.files)}
                        />
                      </label>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {files.map((file, i) => (
                          <div
                            key={`${file.name}-${i}`}
                            className="flex items-center gap-3 rounded-xl border border-[#C6C8C5] bg-white p-2.5"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-medium text-[#252927]">
                                {file.name}
                              </p>
                              <p className="text-[11px] text-moss-500">
                                {(file.size / (1024 * 1024)).toFixed(1)} MB
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(i)}
                              aria-label="Remove file"
                              className="rounded-full p-1.5 text-muted-foreground hover:bg-[#F8F7F4] hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        {files.length < MAX_FILES && (
                          <label
                            htmlFor="signatoryFiles"
                            className="flex w-fit cursor-pointer items-center gap-1.5 text-xs font-medium text-[#006B3F] hover:text-[#00A552]"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Add more files
                            <input
                              id="signatoryFiles"
                              ref={fileInputRef}
                              type="file"
                              multiple
                              accept=".pdf,.jpeg,.jpg,.png,.docx,.doc"
                              className="hidden"
                              onChange={(e) => handleFiles(e.target.files)}
                            />
                          </label>
                        )}
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between border-t border-[#C6C8C5] p-5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goBack}
                  disabled={step === 0}
                  className="gap-1.5"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>

                {isLastStep ? (
                  <Button
                    variant="gradient"
                    size="lg"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="gap-1.5"
                  >
                    {submitting ? "Submitting..." : "Submit application"}
                  </Button>
                ) : (
                  <Button
                    variant="gradient"
                    onClick={goNext}
                    className="gap-1.5"
                  >
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
