export interface EmailTemplateData {
  name: string;
  subject: string;
  html: string;
  designJson: Record<string, unknown>;
  createdById?: number | null;
}

export function validateEmailTemplateInput(body: Partial<EmailTemplateData>): string | null {
  if (!body.name?.trim()) return 'Template name is required';
  if (!body.subject?.trim()) return 'Email subject is required';
  if (!body.html?.trim()) return 'Template HTML is required';
  if (!body.designJson || typeof body.designJson !== 'object') {
    return 'Template design JSON is required';
  }
  return null;
}

export function buildEmailTemplateData(body: Partial<EmailTemplateData>): EmailTemplateData {
  return {
    name: body.name?.trim() ?? '',
    subject: body.subject?.trim() ?? '',
    html: body.html ?? '',
    designJson: (body.designJson as Record<string, unknown>) ?? {},
    createdById: body.createdById ?? null,
  };
}

export function serializeEmailTemplate(template: {
  id: string;
  name: string;
  subject: string;
  html: string;
  designJson: unknown;
  createdById: number | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: template.id,
    name: template.name,
    subject: template.subject,
    html: template.html,
    designJson: template.designJson as Record<string, unknown>,
    createdById: template.createdById,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
  };
}

export function formatEmailTemplateDate(date: string | Date) {
  const d = new Date(date);
  const day = d.getDate();
  const month = d.toLocaleString('en-GB', { month: 'short' });
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year} ${hours}:${minutes}`;
}
