// lib/send-announcement-emails.ts
import { getMailer, MAIL_FROM } from "@/lib/mailer";
import { fetchActiveSubscriberEmails } from "@/lib/subscriber";
import { buildAnnouncementEmail } from "@/lib/emails/announcement-email";

const BATCH_SIZE = 40; // keep BCC lists modest; Gmail SMTP throttles aggressively
const BATCH_DELAY_MS = 1000;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sendAnnouncementEmails(announcement: {
  title: string;
  body: string;
  url?: string | null;
}) {
  const emails = await fetchActiveSubscriberEmails();
  if (emails.length === 0) return { sent: 0, batches: 0 };

  const { subject, html, text } = buildAnnouncementEmail(announcement);
  const transporter = getMailer();
  const batches = chunk(emails, BATCH_SIZE);

  let sent = 0;
  for (const [i, batch] of batches.entries()) {
    try {
      await transporter.sendMail({
        from: MAIL_FROM,
        to: MAIL_FROM, // real recipients stay hidden in bcc
        bcc: batch,
        subject,
        html,
        text,
      });
      sent += batch.length;
    } catch (err) {
      console.error(`[mail] batch ${i + 1}/${batches.length} failed:`, err);
      // keep going — one failed batch shouldn't block the rest
    }
    if (i < batches.length - 1) await sleep(BATCH_DELAY_MS);
  }

  return { sent, batches: batches.length };
}
