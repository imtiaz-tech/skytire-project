import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getBannerImageUrl } from '@/lib/bannerImageUrl';
import { saveBannerImage } from '@/lib/bannerImage.server';
import { getOrCreateBannerSettings } from '@/lib/bannerValidation';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Image file is required' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Accepted formats: JPG, PNG, WEBP' },
        { status: 400 }
      );
    }

    const filename = await saveBannerImage(file);
    await getOrCreateBannerSettings(prisma);

    await prisma.bannerSettings.update({
      where: { id: 'global' },
      data: { backgroundImage: filename },
    });

    return NextResponse.json({
      backgroundImage: filename,
      imageUrl: getBannerImageUrl(filename),
    });
  } catch (error) {
    console.error('Error uploading banner image:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
