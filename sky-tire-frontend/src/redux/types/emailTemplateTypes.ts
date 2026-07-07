export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html: string;
  designJson: Record<string, unknown>;
  createdById: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmailTemplatesState {
  templates: EmailTemplate[];
  selectedTemplate: EmailTemplate | null;
  loading: boolean;
  saving: boolean;
  sending: boolean;
  error: string | null;
}
