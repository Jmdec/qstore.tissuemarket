import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

export function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD) {
    throw new Error("SMTP environment variables are not fully configured.");
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465, // true for 465, false for 587 (STARTTLS)
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD,
    },
  });

  return transporter;
}
export async function fetchActiveSubscriberEmails(): Promise<string[]> {
  const base = process.env.LARAVEL_API_URL;
  const secret = process.env.INTERNAL_API_SECRET;

  if (!base || !secret) {
    throw new Error("Missing LARAVEL_API_URL or INTERNAL_API_SECRET env vars.");
  }

  const res = await fetch(`${base}/internal/subscribers/active-emails`, {
    headers: { "X-Internal-Secret": secret },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch subscribers (${res.status})`);
  }

  const json = await res.json();
  return Array.isArray(json?.data) ? json.data : [];
}
export async function sendMail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const transport = getTransporter();

  return transport.sendMail({
    from: `"Quanta Paper" <${process.env.SMTP_FROM}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });
}
