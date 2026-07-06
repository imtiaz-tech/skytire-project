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

export function buildPriceMatchReplyText(fullName: string, message: string) {
  return `Hello ${fullName},\n\n${message}\n\nBest regards,\nSky Tire Team`;
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const COMMON_DOMAIN_TYPOS: Record<string, string> = {
  'gamil.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gnail.com': 'gmail.com',
};

export function getEmailTypoSuggestion(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  const atIndex = trimmed.lastIndexOf('@');
  if (atIndex === -1) return null;

  const local = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex + 1);
  const suggestion = COMMON_DOMAIN_TYPOS[domain];
  if (!suggestion) return null;
  return `${local}@${suggestion}`;
}
