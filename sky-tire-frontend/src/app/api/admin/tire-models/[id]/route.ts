import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

const UPLOAD_DIR = join(process.cwd(), '../sky-tire-api/uploads');

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params;

  try {
    const tireModel = await prisma.tireModel.findUnique({
      where: { id },
      include: {
        brand: true,
      },
    });

    if (!tireModel) {
      return NextResponse.json({ error: 'Tire model not found' }, { status: 404 });
    }

    return NextResponse.json(tireModel);
  } catch (error) {
    console.error('Error fetching tire model:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params;

  try {
    const formData = await request.formData();
    
    const brandId = formData.get('brandId') as string;
    const modelName = formData.get('modelName') as string;
    const description = formData.get('description') as string;
    const season = formData.get('season') as string;
    const performance = formData.get('performance') as string;
    const treadDesign = formData.get('treadDesign') as string;
    const runFlat = formData.get('runFlat') === 'true';
    const threePMS = formData.get('threePMS') === 'true';
    const warranty = formData.get('warranty') as string;
    const treadLife = formData.get('treadLife') as string;
    
    // Parse existing images that were kept
    const existingImagesRaw = formData.get('existingImages') as string;
    let existingImages: string[] = [];
    try {
      existingImages = JSON.parse(existingImagesRaw || '[]');
    } catch (e) {
      console.error('Error parsing existing images:', e);
    }

    const newImageFiles = formData.getAll('images') as File[];

    // Ensure upload directory exists
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    const newSavedImageNames: string[] = [];

    // Save new files
    for (const file of newImageFiles) {
      if (file.size === 0) continue;
      
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const filename = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
      const path = join(UPLOAD_DIR, filename);
      
      await writeFile(path, buffer);
      newSavedImageNames.push(filename);
    }

    // Combine existing and new image names
    const allImages = [...existingImages, ...newSavedImageNames];

    const updatedModel = await prisma.tireModel.update({
      where: { id },
      data: {
        brandId,
        modelName,
        images: allImages,
        description,
        season,
        performance,
        treadDesign,
        runFlat,
        threePMS,
        warranty,
        treadLife,
      },
      include: {
        brand: true,
      },
    });

    return NextResponse.json(updatedModel);
  } catch (error) {
    console.error('Error updating tire model:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params;

  try {
    await prisma.tireModel.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Tire model deleted successfully' });
  } catch (error) {
    console.error('Error deleting tire model:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
