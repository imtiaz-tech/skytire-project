export interface BannerSegment {
  text: string;
  color: string;
}

export interface BannerData {
  backgroundImage: string;
  countdownEndDate: string | null;
  countdownText: string;
  headlineSegments: BannerSegment[];
  subheadlineSegments: BannerSegment[];
  buttonColor: string;
  buttonText: string;
  ratingValue: number;
  ratingText: string;
  ratingTextColor: string;
  ratingBgColor: string;
}

export const DEFAULT_HEADLINE_SEGMENTS: BannerSegment[] = [
  { text: '4th of JULY', color: '#ffffff' },
  { text: 'SAVINGS', color: '#ffffff' },
];

export const DEFAULT_SUBHEADLINE_SEGMENTS: BannerSegment[] = [
  { text: 'UPTO', color: '#FB5607' },
  { text: '63% OFF', color: '#FFB703' },
];

export const DEFAULT_BANNER: BannerData = {
  backgroundImage: '',
  countdownEndDate: null,
  countdownText: 'ENDS IN...',
  headlineSegments: DEFAULT_HEADLINE_SEGMENTS,
  subheadlineSegments: DEFAULT_SUBHEADLINE_SEGMENTS,
  buttonColor: '#184b99',
  buttonText: 'Shop Tires and Wheels',
  ratingValue: 4.8,
  ratingText: 'Rated by verified customers',
  ratingTextColor: '#ffffff',
  ratingBgColor: 'rgba(0, 0, 0, 0.6)',
};

function parseSegments(value: unknown): BannerSegment[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const seg = item as { text?: unknown; color?: unknown };
      const text = String(seg.text ?? '').trim();
      if (!text) return null;
      return {
        text,
        color: String(seg.color ?? '#ffffff'),
      };
    })
    .filter((item): item is BannerSegment => item != null);
}

export function validateBannerInput(body: Partial<BannerData>): string | null {
  const headlineSegments = parseSegments(body.headlineSegments);
  const subheadlineSegments = parseSegments(body.subheadlineSegments);

  if (headlineSegments.length === 0) {
    return 'At least one main headline segment is required';
  }
  if (subheadlineSegments.length === 0) {
    return 'At least one subheadline segment is required';
  }
  if (!body.buttonText?.trim()) return 'Button text is required';
  if (!body.buttonColor?.trim()) return 'Button color is required';

  const rating = Number(body.ratingValue);
  if (Number.isNaN(rating) || rating < 0 || rating > 5) {
    return 'Rating value must be between 0 and 5';
  }

  if (body.countdownEndDate) {
    const end = new Date(body.countdownEndDate);
    if (Number.isNaN(end.getTime())) return 'Invalid countdown end date';
  }

  return null;
}

export function buildBannerData(body: Partial<BannerData>): BannerData {
  const headlineSegments = parseSegments(body.headlineSegments);
  const subheadlineSegments = parseSegments(body.subheadlineSegments);

  return {
    backgroundImage: body.backgroundImage?.trim() ?? '',
    countdownEndDate: body.countdownEndDate ?? null,
    countdownText: body.countdownText?.trim() || 'ENDS IN...',
    headlineSegments:
      headlineSegments.length > 0 ? headlineSegments : DEFAULT_HEADLINE_SEGMENTS,
    subheadlineSegments:
      subheadlineSegments.length > 0 ? subheadlineSegments : DEFAULT_SUBHEADLINE_SEGMENTS,
    buttonColor: body.buttonColor?.trim() || '#184b99',
    buttonText: body.buttonText?.trim() || 'Shop Tires and Wheels',
    ratingValue: Number(body.ratingValue ?? 4.8),
    ratingText: body.ratingText?.trim() || 'Rated by verified customers',
    ratingTextColor: body.ratingTextColor?.trim() || '#ffffff',
    ratingBgColor: body.ratingBgColor?.trim() || 'rgba(0, 0, 0, 0.6)',
  };
}

export function serializeBanner(settings: {
  backgroundImage: string;
  countdownEndDate: Date | null;
  countdownText: string;
  headlineSegments: unknown;
  subheadlineSegments: unknown;
  buttonColor: string;
  buttonText: string;
  ratingValue: number;
  ratingText: string;
  ratingTextColor: string;
  ratingBgColor: string;
  updatedAt: Date;
}): BannerData & { updatedAt: string } {
  const headlineSegments = parseSegments(settings.headlineSegments);
  const subheadlineSegments = parseSegments(settings.subheadlineSegments);

  return {
    backgroundImage: settings.backgroundImage,
    countdownEndDate: settings.countdownEndDate?.toISOString() ?? null,
    countdownText: settings.countdownText,
    headlineSegments:
      headlineSegments.length > 0 ? headlineSegments : DEFAULT_HEADLINE_SEGMENTS,
    subheadlineSegments:
      subheadlineSegments.length > 0 ? subheadlineSegments : DEFAULT_SUBHEADLINE_SEGMENTS,
    buttonColor: settings.buttonColor,
    buttonText: settings.buttonText,
    ratingValue: settings.ratingValue,
    ratingText: settings.ratingText,
    ratingTextColor: settings.ratingTextColor,
    ratingBgColor: settings.ratingBgColor,
    updatedAt: settings.updatedAt.toISOString(),
  };
}

export async function getOrCreateBannerSettings(prisma: {
  bannerSettings: {
    upsert: (args: {
      where: { id: string };
      create: {
        id: string;
        headlineSegments: BannerSegment[];
        subheadlineSegments: BannerSegment[];
      };
      update: Record<string, never>;
    }) => Promise<{
      backgroundImage: string;
      countdownEndDate: Date | null;
      countdownText: string;
      headlineSegments: unknown;
      subheadlineSegments: unknown;
      buttonColor: string;
      buttonText: string;
      ratingValue: number;
      ratingText: string;
      ratingTextColor: string;
      ratingBgColor: string;
      updatedAt: Date;
    }>;
  };
}) {
  return prisma.bannerSettings.upsert({
    where: { id: 'global' },
    create: {
      id: 'global',
      headlineSegments: DEFAULT_HEADLINE_SEGMENTS,
      subheadlineSegments: DEFAULT_SUBHEADLINE_SEGMENTS,
    },
    update: {},
  });
}

export function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromDatetimeLocalValue(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}
