import nodemailer from "nodemailer";

/**
 * Central Gmail SMTP helper used by every Route Handler that sends email.
 *
 * Why this file exists: order receipts and newsletter confirmations must all
 * come from the same Gmail account, so the transport setup lives here instead
 * of being duplicated (and drifting) across endpoints.
 *
 * Required environment variables (see .env.local.example):
 * - GMAIL_SMTP_USER          -> Gmail address that sends the mail
 * - GMAIL_SMTP_APP_PASSWORD  -> 16-character Google App Password (not your login password)
 * - GMAIL_FROM_NAME          -> optional display name, defaults to "Shop"
 */

interface GmailConfig {
  user: string;
  appPassword: string;
  fromName: string;
}

/** Returns the Gmail credentials, or null when any of them are missing. */
function getGmailConfig(): GmailConfig | null {
  const user = process.env.GMAIL_SMTP_USER;
  const appPassword = process.env.GMAIL_SMTP_APP_PASSWORD;

  if (!user || !appPassword) {
    return null;
  }

  return {
    user,
    appPassword,
    fromName: process.env.GMAIL_FROM_NAME || "Shop",
  };
}

/**
 * True when Gmail SMTP credentials are present.
 * Useful for skipping expensive HTML rendering before we know an email can go out.
 */
export function isEmailConfigured(): boolean {
  return getGmailConfig() !== null;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Escapes text before it is interpolated into an HTML email body.
 * Every dynamic value in an email comes from user input (names, addresses),
 * so this keeps a stray `<` or `"` from breaking the markup.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Sends a single HTML email through Gmail SMTP.
 *
 * Behaviour:
 * - Missing credentials -> logs a warning and returns (local dev often has none).
 * - Send failure -> throws, so the caller decides whether it is fatal.
 *   Emails are usually "best effort" and must never break the main request.
 */
export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<void> {
  const config = getGmailConfig();

  if (!config) {
    console.warn("Gmail SMTP not configured, skipping email to:", to);
    return;
  }

  // `service: "gmail"` makes Nodemailer use smtp.gmail.com:465 with TLS.
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: config.user,
      pass: config.appPassword,
    },
  });

  await transporter.sendMail({
    from: `"${config.fromName}" <${config.user}>`,
    to,
    subject,
    html,
  });
}
