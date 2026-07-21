import { NextRequest, NextResponse } from 'next/server';
import {
  parseWorkbookRows,
  processInventoryRows,
  saveInventorySummary,
  type InventoryType,
  type SelectedFields,
} from '@/lib/updateInventory.server';

const ALLOWED_TYPES: InventoryType[] = [
  'tire',
  'wheel',
  'wireWheel',
  'boltOnWheel',
  'accessory',
];

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const selectedFieldsRaw = formData.get('selectedFields');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }
    if (typeof selectedFieldsRaw !== 'string') {
      return NextResponse.json({ error: 'selectedFields is required' }, { status: 400 });
    }

    let selectedFields: SelectedFields;
    try {
      selectedFields = JSON.parse(selectedFieldsRaw) as SelectedFields;
    } catch {
      return NextResponse.json({ error: 'Invalid selectedFields JSON' }, { status: 400 });
    }

    if (!selectedFields.SKU || !selectedFields.inventoryType || !selectedFields.source) {
      return NextResponse.json(
        { error: 'SKU, inventory type, and source are required' },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(selectedFields.inventoryType)) {
      return NextResponse.json({ error: 'Invalid inventory type' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const rows = parseWorkbookRows(buffer);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'File has no data rows' }, { status: 400 });
    }

    const { updatedProducts, notFoundProducts } = await processInventoryRows(
      rows,
      selectedFields
    );

    await saveInventorySummary(
      updatedProducts,
      notFoundProducts,
      selectedFields.inventoryType,
      null
    );

    const durationMs = Date.now() - startTime;
    console.log(
      `[Update Inventory] Completed in ${durationMs}ms. Updated: ${updatedProducts.length}, Skipped: ${notFoundProducts.length}, Type: ${selectedFields.inventoryType}`
    );

    return NextResponse.json({
      message: 'Inventory update completed',
      updatedCount: updatedProducts.length,
      notFoundCount: notFoundProducts.length,
      updatedProducts,
      notFoundProducts,
    });
  } catch (error: unknown) {
    const durationMs = Date.now() - startTime;
    const message = error instanceof Error ? error.message : 'An error occurred while processing the file';
    console.error(`[Update Inventory] Failed after ${durationMs}ms:`, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
