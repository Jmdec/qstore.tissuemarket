// lib/emails/subscribe-confirmation.ts
export function subscribeConfirmationEmail(email: string) {
  const subject = "You're subscribed to Quanta Paper 🌿";

  const html = `
  <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; background: #ffffff;">
    <div style="background: #1a2e1a; padding: 32px 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 20px;">Quanta Paper Corporation</h1>
    </div>
    <div style="padding: 32px 24px;">
      <h2 style="color: #1a2e1a; margin-top: 0;">You're on the list!</h2>
      <p style="color: #4b5b4b; font-size: 14px; line-height: 1.6;">
       Thanks for subscribing with <strong>${email}</strong>. Stay informed with our latest products, exclusive offers, company updates, and special promotions—delivered directly to your inbox.
      </p>
      <p style="color: #4b5b4b; font-size: 14px; line-height: 1.6;">
        Didn't sign up for this? You can safely ignore this email.
      </p>
    </div>
    <div style="padding: 16px 24px; border-top: 1px solid #eee; text-align: center;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
        © ${new Date().getFullYear()} Quanta Paper Corporation
      </p>
    </div>
  </div>
  `;

  const text = `You're subscribed to Quanta Paper updates with ${email}. We'll notify you about new promotions.`;

  return { subject, html, text };
}
