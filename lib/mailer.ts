// lib/mailer.ts
import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

export function getMailer() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD) {
    throw new Error("Missing SMTP configuration in environment variables.");
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

export const MAIL_FROM = process.env.SMTP_FROM || process.env.SMTP_USER || "";
