// lib/emails/announcement-email.ts
type AnnouncementEmailInput = {
  title: string;
  body: string;
  url?: string | null;
};

export function buildAnnouncementEmail({
  title,
  body,
  url,
}: AnnouncementEmailInput) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const fullUrl = url
    ? url.startsWith("http")
      ? url
      : `${siteUrl}${url}`
    : null;

  const html = `
    <div style="font-family: -apple-system, Segoe UI, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #1c3a2e; margin-bottom: 8px;">${escapeHtml(title)}</h2>
      <p style="color: #444; line-height: 1.5;">${escapeHtml(body)}</p>
      ${
        fullUrl
          ? `<a href="${fullUrl}" style="display: inline-block; margin-top: 16px; padding: 10px 18px; background: #16a34a; color: #fff; text-decoration: none; border-radius: 8px;">View more</a>`
          : ""
      }
      <p style="margin-top: 32px; font-size: 12px; color: #999;">
        You're receiving this because you subscribed to Quanta Paper announcements.
      </p>
    </div>
  `;

  const text = `${title}\n\n${body}${fullUrl ? `\n\n${fullUrl}` : ""}`;

  return { subject: title, html, text };
}

function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
