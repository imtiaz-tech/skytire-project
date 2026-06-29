import { PromoBarLinkType as PrismaLinkType } from '@prisma/client';

export type PromoBarLinkType = 'internal' | 'external';

const LINK_TYPE_MAP: Record<PromoBarLinkType, PrismaLinkType> = {
  internal: 'INTERNAL',
  external: 'EXTERNAL',
};

const REVERSE_LINK_TYPE: Record<PrismaLinkType, PromoBarLinkType> = {
  INTERNAL: 'internal',
  EXTERNAL: 'external',
};

export interface PromoBarInput {
  text: string;
  boldText: string;
  bgColor?: string;
  textColor?: string;
  boldColor?: string;
  link: string;
  linkType?: string;
  openInNewTab?: boolean;
  isActive?: boolean;
}

export function inferLinkType(link: string): PromoBarLinkType {
  const trimmed = link.trim();
  if (/^https?:\/\//i.test(trimmed)) return 'external';
  return 'internal';
}

export function toPrismaLinkType(value?: string): PrismaLinkType {
  if (value && LINK_TYPE_MAP[value as PromoBarLinkType]) {
    return LINK_TYPE_MAP[value as PromoBarLinkType];
  }
  return 'INTERNAL';
}

function parseBoolean(value: unknown, fallback = false): boolean {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return fallback;
}

export function validatePromoBarInput(body: PromoBarInput): string | null {
  if (!body.text?.trim()) return 'Text is required';
  if (!body.boldText?.trim()) return 'Bold text is required';
  if (!body.link?.trim()) return 'Link URL/Path is required';
  return null;
}

export function validateSettingsInput(autoplayDelay: unknown): string | null {
  const delay = Number(autoplayDelay);
  if (Number.isNaN(delay)) return 'Autoplay delay must be a number';
  if (delay < 500 || delay > 30000) {
    return 'Autoplay delay must be between 500 and 30000 milliseconds';
  }
  return null;
}

export function buildPromoBarData(body: PromoBarInput) {
  const link = body.link.trim();
  const linkType = body.linkType
    ? toPrismaLinkType(body.linkType)
    : toPrismaLinkType(inferLinkType(link));

  return {
    text: body.text.trim(),
    boldText: body.boldText.trim(),
    bgColor: body.bgColor?.trim() || '#f2f3ee',
    textColor: body.textColor?.trim() || 'black',
    boldColor: body.boldColor?.trim() || 'black',
    link,
    linkType,
    openInNewTab: parseBoolean(body.openInNewTab),
    isActive: parseBoolean(body.isActive, true),
  };
}

export function serializePromoBar(bar: {
  id: string;
  text: string;
  boldText: string;
  bgColor: string;
  textColor: string;
  boldColor: string;
  link: string;
  linkType: PrismaLinkType;
  openInNewTab: boolean;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...bar,
    linkType: REVERSE_LINK_TYPE[bar.linkType],
    createdAt: bar.createdAt.toISOString(),
    updatedAt: bar.updatedAt.toISOString(),
  };
}

export async function getOrCreatePromoBarSettings(prisma: {
  promoBarSettings: {
    upsert: (args: {
      where: { id: string };
      create: { id: string; autoplayDelay: number };
      update: Record<string, never>;
    }) => Promise<{ id: string; autoplayDelay: number; updatedAt: Date }>;
  };
}) {
  return prisma.promoBarSettings.upsert({
    where: { id: 'global' },
    create: { id: 'global', autoplayDelay: 3000 },
    update: {},
  });
}

export function resolveCssColor(color: string): string {
  const value = color.trim().toLowerCase();
  if (value === 'white') return '#ffffff';
  if (value === 'black') return '#000000';
  return color;
}
