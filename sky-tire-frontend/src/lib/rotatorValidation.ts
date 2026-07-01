export const DEFAULT_ROTATOR_COLORS = {
  bgGradientStart: '#1a1d22',
  bgGradientMiddle: '#777c8e',
  bgGradientEnd: '#1a1d22',
  borderColor: '#0552c0',
  textColor: '#ffffff',
  glowColor: '#d1d8f1',
} as const;

export const DEFAULT_ROTATOR_ANIMATION = {
  animationDuration: 1,
  animationCurve: '0.68, -0.55, 0.265, 1.55',
  stayDuration: 3.8,
} as const;

export interface RotatorColorsInput {
  bgGradientStart?: string;
  bgGradientMiddle?: string;
  bgGradientEnd?: string;
  borderColor?: string;
  textColor?: string;
  glowColor?: string;
}

export interface RotatorAnimationInput {
  animationDuration?: number | string;
  animationCurve?: string;
  stayDuration?: number | string;
}

export interface RotatorHeadlineInput {
  title: string;
  isActive?: boolean;
}

export function resolveCssColor(color: string): string {
  const value = color.trim().toLowerCase();
  if (value === 'white') return '#ffffff';
  if (value === 'black') return '#000000';
  return color;
}

export function validateHeadlineInput(body: RotatorHeadlineInput): string | null {
  if (!body.title?.trim()) return 'Headline title is required';
  return null;
}

export function validateColorsInput(body: RotatorColorsInput): string | null {
  const fields: (keyof RotatorColorsInput)[] = [
    'bgGradientStart',
    'bgGradientMiddle',
    'bgGradientEnd',
    'borderColor',
    'textColor',
    'glowColor',
  ];
  for (const field of fields) {
    if (body[field] !== undefined && !String(body[field]).trim()) {
      return `${field} is required`;
    }
  }
  return null;
}

export function validateAnimationInput(body: RotatorAnimationInput): string | null {
  const duration = Number(body.animationDuration);
  if (Number.isNaN(duration) || duration < 0.1 || duration > 10) {
    return 'Animation duration must be between 0.1 and 10 seconds';
  }

  const curve = body.animationCurve?.trim() ?? '';
  const parts = curve.split(',').map((p) => p.trim());
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(Number(p)))) {
    return 'Animation curve must be four comma-separated numbers (cubic-bezier)';
  }

  const stay = Number(body.stayDuration);
  if (Number.isNaN(stay) || stay < 0.5 || stay > 30) {
    return 'Stay duration must be between 0.5 and 30 seconds';
  }

  return null;
}

export function buildColorsData(body: RotatorColorsInput) {
  return {
    bgGradientStart: body.bgGradientStart?.trim() || DEFAULT_ROTATOR_COLORS.bgGradientStart,
    bgGradientMiddle: body.bgGradientMiddle?.trim() || DEFAULT_ROTATOR_COLORS.bgGradientMiddle,
    bgGradientEnd: body.bgGradientEnd?.trim() || DEFAULT_ROTATOR_COLORS.bgGradientEnd,
    borderColor: body.borderColor?.trim() || DEFAULT_ROTATOR_COLORS.borderColor,
    textColor: body.textColor?.trim() || DEFAULT_ROTATOR_COLORS.textColor,
    glowColor: body.glowColor?.trim() || DEFAULT_ROTATOR_COLORS.glowColor,
  };
}

export function buildAnimationData(body: RotatorAnimationInput) {
  return {
    animationDuration: Number(body.animationDuration),
    animationCurve: body.animationCurve?.trim() || DEFAULT_ROTATOR_ANIMATION.animationCurve,
    stayDuration: Number(body.stayDuration),
  };
}

export function buildHeadlineData(body: RotatorHeadlineInput) {
  return {
    title: body.title.trim(),
    isActive: body.isActive !== false,
  };
}

export function serializeRotatorSettings(settings: {
  bgGradientStart: string;
  bgGradientMiddle: string;
  bgGradientEnd: string;
  borderColor: string;
  textColor: string;
  glowColor: string;
  animationDuration: number;
  animationCurve: string;
  stayDuration: number;
  updatedAt: Date;
}) {
  return {
    colors: {
      bgGradientStart: settings.bgGradientStart,
      bgGradientMiddle: settings.bgGradientMiddle,
      bgGradientEnd: settings.bgGradientEnd,
      borderColor: settings.borderColor,
      textColor: settings.textColor,
      glowColor: settings.glowColor,
    },
    animation: {
      animationDuration: settings.animationDuration,
      animationCurve: settings.animationCurve,
      stayDuration: settings.stayDuration,
    },
    updatedAt: settings.updatedAt.toISOString(),
  };
}

export function serializeRotatorHeadline(headline: {
  id: string;
  title: string;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...headline,
    createdAt: headline.createdAt.toISOString(),
    updatedAt: headline.updatedAt.toISOString(),
  };
}

export async function getOrCreateRotatorSettings(prisma: {
  rotatorSettings: {
    upsert: (args: {
      where: { id: string };
      create: { id: string };
      update: Record<string, never>;
    }) => Promise<{
      id: string;
      bgGradientStart: string;
      bgGradientMiddle: string;
      bgGradientEnd: string;
      borderColor: string;
      textColor: string;
      glowColor: string;
      animationDuration: number;
      animationCurve: string;
      stayDuration: number;
      updatedAt: Date;
    }>;
  };
}) {
  return prisma.rotatorSettings.upsert({
    where: { id: 'global' },
    create: { id: 'global' },
    update: {},
  });
}
