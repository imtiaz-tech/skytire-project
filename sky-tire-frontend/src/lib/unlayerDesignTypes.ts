/**
 * Minimal TypeScript types for Unlayer design JSON produced by our importer.
 * Compatible with editor.loadDesign() / exportHtml().design
 */

export type UnlayerTextAlign = 'left' | 'center' | 'right' | 'justify';

export type UnlayerContentType =
  | 'text'
  | 'heading'
  | 'image'
  | 'button'
  | 'divider'
  | 'html';

export interface UnlayerMeta {
  htmlID: string;
  htmlClassNames: string;
}

export interface UnlayerContentBlock {
  id: string;
  type: UnlayerContentType;
  values: Record<string, unknown>;
}

export interface UnlayerColumn {
  id: string;
  contents: UnlayerContentBlock[];
  values: Record<string, unknown>;
}

export interface UnlayerRow {
  id: string;
  cells: number[];
  columns: UnlayerColumn[];
  values: Record<string, unknown>;
}

export interface UnlayerBody {
  id: string;
  rows: UnlayerRow[];
  values: Record<string, unknown>;
}

export interface UnlayerDesign {
  counters: Record<string, number>;
  body: UnlayerBody;
  schemaVersion: number;
}
