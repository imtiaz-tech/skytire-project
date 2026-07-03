import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  buildBannerData,
  getOrCreateBannerSettings,
  serializeBanner,
  validateBannerInput,
} from '@/lib/bannerValidation';

export async function GET() {
  try {
    const settings = await getOrCreateBannerSettings(prisma);
    const { updatedAt: _updatedAt, ...banner } = serializeBanner(settings);
    return NextResponse.json(banner);
  } catch (error) {
    console.error('Error fetching banner:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validationError = validateBannerInput(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const data = buildBannerData(body);
    await getOrCreateBannerSettings(prisma);

    const settings = await prisma.bannerSettings.update({
      where: { id: 'global' },
      data: {
        backgroundImage: data.backgroundImage,
        countdownEndDate: data.countdownEndDate ? new Date(data.countdownEndDate) : null,
        countdownText: data.countdownText,
        headlineSegments: data.headlineSegments,
        subheadlineSegments: data.subheadlineSegments,
        buttonColor: data.buttonColor,
        buttonText: data.buttonText,
        ratingValue: data.ratingValue,
        ratingText: data.ratingText,
        ratingTextColor: data.ratingTextColor,
        ratingBgColor: data.ratingBgColor,
      },
    });

    return NextResponse.json((() => {
      const { updatedAt: _u, ...banner } = serializeBanner(settings);
      return banner;
    })());
  } catch (error) {
    console.error('Error saving banner:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
