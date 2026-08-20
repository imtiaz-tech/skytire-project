import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateTireNetCostPricing, isSalePriceBelowRecommended } from '@/utils/pricing';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { isAllowedWireWheelVideoFile, isValidYouTubeUrl } from '@/lib/youtube';
import { attachSourceInventories } from '@/lib/sourceInventory.server';

const UPLOAD_DIR = join(process.cwd(), '../sky-tire-api/uploads');

async function saveUploadedVideo(file: File): Promise<string> {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const filename = `${Date.now()}-video-${file.name.replace(/\s+/g, '-')}`;
  const path = join(UPLOAD_DIR, filename);
  await writeFile(path, buffer);
  return filename;
}

async function parseTireRequest(request: NextRequest) {
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('multipart/form-data')) {
    const body = await request.json();
    const hasYoutubeUrl = Object.prototype.hasOwnProperty.call(body, 'youtubeUrl');
    const youtubeUrlRaw = hasYoutubeUrl ? String(body.youtubeUrl || '').trim() : undefined;
    if (youtubeUrlRaw && !isValidYouTubeUrl(youtubeUrlRaw)) {
      throw new Error('Please enter a valid YouTube Video URL');
    }
    return {
      ...body,
      video: Object.prototype.hasOwnProperty.call(body, 'video')
        ? body.video ? String(body.video).trim() : null
        : undefined,
      youtubeUrl: hasYoutubeUrl ? youtubeUrlRaw || null : undefined,
    };
  }

  const formData = await request.formData();
  const payloadRaw = formData.get('payload') as string;
  const body = payloadRaw ? JSON.parse(payloadRaw) : {};
  const existingVideo = ((formData.get('existingVideo') as string) || '').trim() || null;
  const youtubeUrlRaw = ((formData.get('youtubeUrl') as string) || body.youtubeUrl || '').trim();

  if (youtubeUrlRaw && !isValidYouTubeUrl(youtubeUrlRaw)) {
    throw new Error('Please enter a valid YouTube Video URL');
  }

  let videoFilename: string | null = existingVideo;
  const videoFile = formData.get('video') as File | null;
  if (videoFile && typeof videoFile === 'object' && 'size' in videoFile && videoFile.size > 0) {
    if (!isAllowedWireWheelVideoFile(videoFile)) {
      throw new Error('Video must be an mp4, mov, or webm file');
    }
    videoFilename = await saveUploadedVideo(videoFile);
  }

  return {
    ...body,
    video: videoFilename,
    youtubeUrl: youtubeUrlRaw || null,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const tire = await prisma.tire.findUnique({
      where: { id },
      include: {
        model: {
          include: {
            brand: true,
          },
        },
        sources: true,
      },
    });

    if (!tire) {
      return NextResponse.json({ error: 'Tire not found' }, { status: 404 });
    }

    const withInventory = await attachSourceInventories('tire', tire);
    return NextResponse.json(withInventory);
  } catch (error) {
    console.error('Error fetching tire:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await parseTireRequest(request);
    const {
      modelId,
      sku,
      alternatePartNumber,
      upcNo,
      stock,
      cost,
      internalShipping,
      processingCharges,
      margin,
      processingAmount,
      marginAmount,
      netCost,
      minimumSalePrice,
      salePrice,
      regularPrice,
      mapPrice,
      shippingCost,
      handlingFee,
      freightCharges,
      video,
      youtubeUrl,
      rebateAvailable,
      mileageScore,
      tractionScore,
      stabilityScore,
      feedbackScore,
      sourceIds,
      
      // Fields from TireSize
      tireSize,
      tireWidth,
      aspectRatio,
      rimDiameter,
      loadIndex,
      speedRating,
      loadRange,
      inflationPressure,
      tireWeight,
      shippingDimensions,
      utqg,
      seoTitle,
      metaDescription,
      status,
      vehicleType,
      keywords,
      features,
      faqs,
      tags,
      alsoFoundIn,
      sidewallCategory,
      sidewallDetail,
      publishStatus,
    } = body;

    // Get current sources to handle disconnects
    const currentTire = await prisma.tire.findUnique({
      where: { id },
      include: { sources: true },
    });

    if (!currentTire) {
      return NextResponse.json({ error: 'Tire not found' }, { status: 404 });
    }

    if (publishStatus === 'DRAFT') {
      if (!modelId) {
        return NextResponse.json({ error: 'Model must be selected' }, { status: 400 });
      }
    } else {
      // Required Fields Validation
      if (!modelId) return NextResponse.json({ error: 'Model must be selected' }, { status: 400 });
      if (!tireSize) return NextResponse.json({ error: 'Tire Size is required' }, { status: 400 });
      if (!vehicleType) return NextResponse.json({ error: 'Vehicle Type is required' }, { status: 400 });
      if (!sidewallCategory) return NextResponse.json({ error: 'Sidewall Category is required' }, { status: 400 });
      if (!sku) return NextResponse.json({ error: 'SKU is required' }, { status: 400 });
      if (!sourceIds || !Array.isArray(sourceIds) || sourceIds.length === 0) {
        return NextResponse.json({ error: 'Inventory Source is required' }, { status: 400 });
      }
      
      const costNum = parseFloat(cost) || 0;
      const regularNum = parseFloat(regularPrice) || 0;
      const saleNum = parseFloat(salePrice) || 0;
      const mapNum = parseFloat(mapPrice) || 0;
      const stockNum = parseInt(stock) || 0;
      const tirePricing = calculateTireNetCostPricing(
        costNum,
        parseFloat(internalShipping) || 0,
        parseFloat(processingCharges) || 0,
        parseFloat(margin) || 0
      );

      if (stockNum <= 0) return NextResponse.json({ error: 'Stock must be greater than 0' }, { status: 400 });
      if (costNum <= 0) return NextResponse.json({ error: 'Cost Price is required' }, { status: 400 });
      if (saleNum <= 0) return NextResponse.json({ error: 'Sale Price is required' }, { status: 400 });
      if (regularNum <= 0) return NextResponse.json({ error: 'Regular Price is required' }, { status: 400 });
      if (mapNum <= 0) return NextResponse.json({ error: 'MAP Price is required' }, { status: 400 });

      if (isSalePriceBelowRecommended(saleNum, tirePricing.minimumSalePrice)) {
        return NextResponse.json(
          { error: 'Sale Price cannot be lower than the Recommended Sale Price.' },
          { status: 400 }
        );
      }

      // Price Logic Validations
      if (saleNum <= costNum) {
        return NextResponse.json({ error: 'Sale price must be greater than cost' }, { status: 400 });
      }
      if (regularNum <= saleNum) {
        return NextResponse.json({ error: 'Regular price must be greater than sale price' }, { status: 400 });
      }
      if (saleNum < mapNum) {
        return NextResponse.json({ error: 'Sale price must be greater than or equal to MAP price' }, { status: 400 });
      }
    }

    const updatedTire = await prisma.tire.update({
      where: { id },
      data: {
        modelId,
        sku: sku || null,
        alternatePartNumber,
        upcNo,
        stock: parseInt(stock) || 0,
        cost: Math.round(parseFloat(cost) * 100) / 100 || 0,
        internalShipping: Math.round(parseFloat(internalShipping) * 100) / 100 || 0,
        processingCharges: parseFloat(processingCharges) || 0,
        margin: parseFloat(margin) || 0,
        processingAmount: Math.round(parseFloat(processingAmount) * 100) / 100 || 0,
        marginAmount: Math.round(parseFloat(marginAmount) * 100) / 100 || 0,
        netCost: Math.round(parseFloat(netCost) * 100) / 100 || 0,
        minimumSalePrice: Math.round(parseFloat(minimumSalePrice) * 100) / 100 || 0,
        salePrice: Math.round(parseFloat(salePrice) * 100) / 100 || 0,
        regularPrice: Math.round(parseFloat(regularPrice) * 100) / 100 || 0,
        mapPrice: Math.round(parseFloat(mapPrice) * 100) / 100 || 0,
        shippingCost: Math.round(parseFloat(shippingCost) * 100) / 100 || 0,
        handlingFee: Math.round(parseFloat(handlingFee) * 100) / 100 || 0,
        freightCharges: Math.round(parseFloat(freightCharges) * 100) / 100 || 0,
        video: video === undefined ? currentTire.video : video || null,
        youtubeUrl: youtubeUrl === undefined ? currentTire.youtubeUrl : youtubeUrl || null,
        rebateAvailable: !!rebateAvailable,
        mileageScore: parseInt(mileageScore) || 0,
        tractionScore: parseInt(tractionScore) || 0,
        stabilityScore: parseInt(stabilityScore) || 0,
        feedbackScore: parseInt(feedbackScore) || 0,
        
        tireSize: tireSize || null,
        tireWidth,
        aspectRatio,
        rimDiameter,
        loadIndex,
        speedRating,
        loadRange,
        inflationPressure,
        tireWeight,
        shippingDimensions,
        utqg,
        seoTitle,
        metaDescription,
        status: status || 'ACTIVE',
        vehicleType: vehicleType || null,
        keywords,
        features: Array.isArray(features) ? features : [],
        faqs: typeof faqs === 'string' ? faqs : faqs || null,
        tags: Array.isArray(tags) ? tags : [],
        alsoFoundIn: Array.isArray(alsoFoundIn) ? alsoFoundIn : [],
        sidewallCategory: sidewallCategory || null,
        sidewallDetail,
        publishStatus: publishStatus || 'PUBLISHED',

        sources: {
          set: sourceIds ? sourceIds.map((id: string) => ({ id })) : [],
        },
      },
      include: {
        model: {
          include: {
            brand: true,
          },
        },
        sources: true,
      },
    });

    return NextResponse.json(updatedTire);
  } catch (error) {
    console.error('Error updating tire:', error);
    if (
      error instanceof Error &&
      ['Please enter a valid YouTube Video URL', 'Video must be an mp4, mov, or webm file'].includes(error.message)
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if ((error as any).code === 'P2002') {
      return NextResponse.json({ error: 'SKU already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.tire.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Tire deleted successfully' });
  } catch (error) {
    console.error('Error deleting tire:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
