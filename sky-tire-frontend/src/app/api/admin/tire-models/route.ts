import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

const UPLOAD_DIR = join(process.cwd(), '../sky-tire-api/uploads');

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const isDropdown = searchParams.get('dropdown') === 'true';

  if (isDropdown) {
    try {
      const models = await prisma.tireModel.findMany({
        select: {
          id: true,
          modelName: true,
          brand: {
            select: {
              brandName: true,
            },
          },
        },
        orderBy: {
          modelName: 'asc',
        },
      });
      return NextResponse.json(models);
    } catch (error) {
      console.error('Error fetching tire models dropdown:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }

  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';

  const skip = (page - 1) * limit;

  try {
    const where = search
      ? {
          OR: [
            { modelName: { contains: search, mode: 'insensitive' as const } },
            { brand: { brandName: { contains: search, mode: 'insensitive' as const } } },
          ],
        }
      : {};

    const [tireModels, total] = await Promise.all([
      prisma.tireModel.findMany({
        where,
        skip,
        take: limit,
        include: {
          brand: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.tireModel.count({ where }),
    ]);

    const pages = Math.ceil(total / limit);

    return NextResponse.json({
      tireModels,
      total,
      pages,
      currentPage: page,
    });
  } catch (error) {
    console.error('Error fetching tire models:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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
    const imageFiles = formData.getAll('images') as File[];
    
    if (!brandId || !modelName) {
      return NextResponse.json({ error: 'brandId and modelName are required' }, { status: 400 });
    }

    // Ensure upload directory exists
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    const savedImageNames: string[] = [];

    // Save files
    for (const file of imageFiles) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const filename = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
      const path = join(UPLOAD_DIR, filename);
      
      await writeFile(path, buffer);
      savedImageNames.push(filename);
    }

    const newModel = await prisma.tireModel.create({
      data: {
        brandId,
        modelName,
        images: savedImageNames,
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

    return NextResponse.json(newModel);
  } catch (error) {
    console.error('Error creating tire model:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
