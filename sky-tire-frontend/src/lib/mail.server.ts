import nodemailer from 'nodemailer';
import { config } from 'dotenv';
import { existsSync } from 'fs';
import { join } from 'path';

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

function ensureSmtpEnv() {
  if (process.env.SMTP_HOST && process.env.SMTP_MAIL && process.env.SMTP_PASSWORD) {
    return;
  }

  const apiEnvPath = join(process.cwd(), '../sky-tire-api/.env');
  if (existsSync(apiEnvPath)) {
    config({ path: apiEnvPath });
  }
}

function getTransporter() {
  ensureSmtpEnv();

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const user = process.env.SMTP_MAIL;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass) {
    throw new Error(
      'Email service is not configured. Add SMTP_HOST, SMTP_MAIL, and SMTP_PASSWORD to sky-tire-frontend/.env or sky-tire-api/.env.'
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function buildPriceMatchReplyHtml(fullName: string, message: string) {
  const safeName = escapeHtml(fullName);
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br />');

  return `
    <div style="font-family: Arial, sans-serif; color: #1e2a4a; line-height: 1.6; max-width: 600px;">
      <p style="margin: 0 0 16px;">Hello ${safeName},</p>
      <div style="margin: 0 0 24px;">${safeMessage}</div>
      <p style="margin: 0;">Best regards,<br /><strong>Sky Tire Team</strong></p>
    </div>
  `;
}

export async function sendMail({ to, subject, html }: SendMailOptions) {
  ensureSmtpEnv();

  const from = process.env.SMTP_MAIL;
  const transporter = getTransporter();

  await transporter.verify();

  const info = await transporter.sendMail({
    from: `"Sky Tire" <${from}>`,
    to,
    subject,
    html,
  });

  const rejected = info.rejected ?? [];
  if (rejected.length > 0) {
    throw new Error(`Email was rejected for: ${rejected.join(', ')}`);
  }

  if (!info.messageId) {
    throw new Error('Email could not be delivered. No message ID was returned from the mail server.');
  }

  return info;
}
