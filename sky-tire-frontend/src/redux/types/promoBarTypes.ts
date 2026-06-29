export type PromoBarLinkType = 'internal' | 'external';

export interface PromoBar {
  id: string;
  text: string;
  boldText: string;
  bgColor: string;
  textColor: string;
  boldColor: string;
  link: string;
  linkType: PromoBarLinkType;
  openInNewTab: boolean;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface PromoBarSettings {
  autoplayDelay: number;
}

export interface PromoBarsState {
  promoBars: PromoBar[];
  settings: PromoBarSettings;
  loading: boolean;
  savingSettings: boolean;
  error: string | null;
}

export interface PromoBarFormData {
  text: string;
  boldText: string;
  bgColor: string;
  textColor: string;
  boldColor: string;
  link: string;
  openInNewTab: boolean;
  isActive: boolean;
}
