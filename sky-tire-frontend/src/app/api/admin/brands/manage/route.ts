import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

const UPLOAD_DIR = join(process.cwd(), '../sky-tire-api/uploads');

// GET: List all brands for a given category
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'wire_wheel';

    const brands = await prisma.brand.findMany({
      where: { category: category as any },
      select: {
        id: true,
        brandName: true,
        category: true,
      },
      orderBy: { brandName: 'asc' },
    });

    return NextResponse.json(brands);
  } catch (error) {
    console.error('Error fetching brands:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Create a new brand with optional logo
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const brandName = formData.get('brandName') as string;
    const category = formData.get('category') as string;
    const imageFile = formData.get('brandLogo') as File | null;

    if (!brandName) {
      return NextResponse.json({ message: 'Brand name is required' }, { status: 400 });
    }
    if (!category) {
      return NextResponse.json({ message: 'Category is required' }, { status: 400 });
    }

    let savedImageName = 'placeholder-brand-logo.png';

    if (imageFile && imageFile.size > 0) {
      // Ensure upload directory exists
      if (!existsSync(UPLOAD_DIR)) {
        await mkdir(UPLOAD_DIR, { recursive: true });
      }

      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filename = `${Date.now()}-brand-${imageFile.name.replace(/\\s+/g, '-')}`;
      const path = join(UPLOAD_DIR, filename);
      await writeFile(path, buffer);
      savedImageName = filename;
    }

    const newBrand = await prisma.brand.create({
      data: {
        brandName,
        category: category as any,
        brandLogo: savedImageName,
      },
    });

    return NextResponse.json(newBrand);
  } catch (error: any) {
    console.error('Error creating brand:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ message: 'Brand already exists' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
