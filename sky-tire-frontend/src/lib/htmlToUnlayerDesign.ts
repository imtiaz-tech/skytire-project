/**
 * Convert email HTML (Gmail/Yahoo/etc.) into Unlayer design JSON for loadDesign().
 *
 * Uses browser DOMParser (no extra npm package). Unsupported markup falls back
 * to Unlayer `html` blocks so content is never silently dropped.
 */

import type {
  UnlayerColumn,
  UnlayerContentBlock,
  UnlayerDesign,
  UnlayerRow,
  UnlayerTextAlign,
} from '@/lib/unlayerDesignTypes';

const HEADING_SIZES: Record<string, string> = {
  h1: '32px',
  h2: '28px',
  h3: '24px',
  h4: '20px',
  h5: '18px',
  h6: '16px',
};

const ALLOWED_TEXT_TAGS = new Set([
  'A',
  'B',
  'BR',
  'EM',
  'I',
  'SPAN',
  'STRONG',
  'U',
  'S',
  'STRIKE',
  'SUB',
  'SUP',
  'FONT',
]);

class IdFactory {
  private counters: Record<string, number> = {
    u_row: 0,
    u_column: 0,
    u_content_text: 0,
    u_content_heading: 0,
    u_content_image: 0,
    u_content_button: 0,
    u_content_divider: 0,
    u_content_html: 0,
  };

  next(kind: keyof IdFactory['counters']): string {
    this.counters[kind] += 1;
    return `${kind}_${this.counters[kind]}`;
  }

  snapshot(): Record<string, number> {
    return { ...this.counters };
  }
}

function parseStyleMap(el: Element): Record<string, string> {
  const map: Record<string, string> = {};
  const style = el.getAttribute('style') || '';
  style.split(';').forEach((part) => {
    const idx = part.indexOf(':');
    if (idx < 0) return;
    const key = part.slice(0, idx).trim().toLowerCase();
    const value = part.slice(idx + 1).trim();
    if (key && value) map[key] = value;
  });
  return map;
}

function getStyle(el: Element, prop: string): string {
  return parseStyleMap(el)[prop.toLowerCase()] || '';
}

function parseColor(value: string): string {
  if (!value) return '';
  const v = value.trim();
  if (v.startsWith('#') || v.startsWith('rgb') || v.startsWith('hsl')) return v;
  return v;
}

function parsePx(value: string): number | null {
  if (!value) return null;
  const m = value.trim().match(/^(-?\d+(?:\.\d+)?)(px)?$/i);
  if (!m) return null;
  return Number(m[1]);
}

function resolveAlign(el: Element): UnlayerTextAlign {
  const styleAlign = getStyle(el, 'text-align').toLowerCase();
  if (
    styleAlign === 'left' ||
    styleAlign === 'center' ||
    styleAlign === 'right' ||
    styleAlign === 'justify'
  ) {
    return styleAlign;
  }
  const attr = (el.getAttribute('align') || '').toLowerCase();
  if (attr === 'left' || attr === 'center' || attr === 'right' || attr === 'justify') {
    return attr;
  }
  return 'left';
}

function isHidden(el: Element): boolean {
  const display = getStyle(el, 'display').toLowerCase();
  const visibility = getStyle(el, 'visibility').toLowerCase();
  return display === 'none' || visibility === 'hidden';
}

function isEmptyText(text: string): boolean {
  return !text.replace(/\u00a0/g, ' ').replace(/\s+/g, '').length;
}

function sanitizeHtmlString(html: string): string {
  if (typeof DOMParser === 'undefined') {
    throw new Error('HTML conversion requires a browser environment');
  }
  const doc = new DOMParser().parseFromString(html, 'text/html');

  doc.querySelectorAll('script, iframe, object, embed, form, input, button, textarea, select, meta, link, base').forEach((n) =>
    n.remove()
  );

  doc.querySelectorAll('*').forEach((el) => {
    [...el.attributes].forEach((attr) => {
      const name = attr.name.toLowerCase();
      const value = attr.value || '';
      if (name.startsWith('on')) el.removeAttribute(attr.name);
      if (
        (name === 'href' || name === 'src' || name === 'xlink:href') &&
        /^\s*javascript:/i.test(value)
      ) {
        el.removeAttribute(attr.name);
      }
    });
  });

  return doc.body.innerHTML;
}

function serializeElement(el: Element): string {
  return (el as HTMLElement).outerHTML || '';
}

function sanitizeInlineHtml(root: Element): string {
  const clone = root.cloneNode(true) as Element;

  const walk = (node: Node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as Element;
    const tag = el.tagName.toUpperCase();

    if (!ALLOWED_TEXT_TAGS.has(tag) && tag !== 'P' && !/^H[1-6]$/.test(tag)) {
      // unwrap disallowed tags but keep children
      const parent = el.parentNode;
      if (parent) {
        while (el.firstChild) parent.insertBefore(el.firstChild, el);
        parent.removeChild(el);
      }
      return;
    }

    [...el.attributes].forEach((attr) => {
      const name = attr.name.toLowerCase();
      if (name.startsWith('on')) el.removeAttribute(attr.name);
      if (name === 'href' && /^\s*javascript:/i.test(attr.value)) {
        el.removeAttribute('href');
      }
      // keep style, href, target, class, color, size, face for basic formatting
      if (
        ![
          'style',
          'href',
          'target',
          'rel',
          'class',
          'color',
          'size',
          'face',
          'align',
        ].includes(name)
      ) {
        if (name !== 'href') el.removeAttribute(attr.name);
      }
    });

    [...el.childNodes].forEach(walk);
  };

  [...clone.childNodes].forEach(walk);

  // Prefer inner HTML for block wrappers
  const tag = root.tagName.toUpperCase();
  if (tag === 'P' || /^H[1-6]$/.test(tag) || tag === 'DIV' || tag === 'TD' || tag === 'TH') {
    return clone.innerHTML.trim();
  }
  return (clone as HTMLElement).outerHTML;
}

function looksLikeButton(anchor: HTMLAnchorElement): boolean {
  const style = parseStyleMap(anchor);
  const className = (anchor.getAttribute('class') || '').toLowerCase();
  if (/\b(btn|button|cta)\b/.test(className)) return true;

  const bg = (style['background-color'] || style.background || '').toLowerCase();
  const hasBg =
    !!bg &&
    bg !== 'transparent' &&
    bg !== 'rgba(0, 0, 0, 0)' &&
    bg !== 'inherit' &&
    bg !== 'none';

  const padding = style.padding || '';
  const display = (style.display || '').toLowerCase();
  const borderRadius = style['border-radius'] || '';
  const border = style.border || style['border-color'] || '';

  const hasPadding = !!padding && padding !== '0' && padding !== '0px';
  const isBlockish =
    display.includes('inline-block') ||
    display === 'block' ||
    display === 'inline-flex' ||
    display === 'flex';

  // Button-like if it has a background + (padding or block display)
  if (hasBg && (hasPadding || isBlockish || borderRadius || border)) return true;
  if (hasBg && hasPadding) return true;
  return false;
}

function isSpacerElement(el: Element): boolean {
  const tag = el.tagName.toUpperCase();
  if (!['DIV', 'TD', 'TH', 'P', 'SPAN'].includes(tag)) return false;
  const text = (el.textContent || '').replace(/\u00a0/g, ' ').trim();
  if (text.length > 0) return false;
  if (el.querySelector('img, table, a, h1, h2, h3, h4, h5, h6')) return false;

  const height = parsePx(getStyle(el, 'height'));
  const minHeight = parsePx(getStyle(el, 'min-height'));
  const paddingTop = parsePx(getStyle(el, 'padding-top')) || 0;
  const paddingBottom = parsePx(getStyle(el, 'padding-bottom')) || 0;
  const lineHeight = parsePx(getStyle(el, 'line-height'));

  const spacerPx = height || minHeight || paddingTop + paddingBottom || lineHeight;
  return !!spacerPx && spacerPx >= 8;
}

function spacerHeight(el: Element): number {
  return (
    parsePx(getStyle(el, 'height')) ||
    parsePx(getStyle(el, 'min-height')) ||
    (parsePx(getStyle(el, 'padding-top')) || 0) +
      (parsePx(getStyle(el, 'padding-bottom')) || 0) ||
    parsePx(getStyle(el, 'line-height')) ||
    20
  );
}

function isDividerElement(el: Element): boolean {
  const tag = el.tagName.toUpperCase();
  if (tag === 'HR') return true;
  const text = (el.textContent || '').replace(/\u00a0/g, ' ').trim();
  if (text) return false;
  if (el.querySelector('img, table, a')) return false;
  const borderBottom = getStyle(el, 'border-bottom') || getStyle(el, 'border-top');
  const border = getStyle(el, 'border');
  if (/(\d+px|\.\d+px)/.test(borderBottom) || /(\d+px|\.\d+px)/.test(border)) {
    return true;
  }
  return false;
}

function directChildElements(el: Element): Element[] {
  return [...el.children].filter((c) => c.nodeType === Node.ELEMENT_NODE);
}

function tableRows(table: HTMLTableElement): HTMLTableRowElement[] {
  return [...table.rows];
}

function rowCells(tr: HTMLTableRowElement): Element[] {
  return [...tr.cells];
}

function createTextBlock(
  ids: IdFactory,
  html: string,
  opts: {
    align?: UnlayerTextAlign;
    fontSize?: string;
    color?: string;
    fontFamily?: string;
    fontWeight?: string;
    lineHeight?: string;
    padding?: string;
  } = {}
): UnlayerContentBlock {
  const id = ids.next('u_content_text');
  return {
    id,
    type: 'text',
    values: {
      containerPadding: opts.padding || '10px',
      anchor: '',
      textAlign: opts.align || 'left',
      lineHeight: opts.lineHeight || '140%',
      linkStyle: {
        inherit: true,
        linkColor: '#0000ee',
        linkHoverColor: '#0000ee',
        linkUnderline: true,
        linkHoverUnderline: true,
      },
      hideDesktop: false,
      hideMobile: false,
      text: html || '<p style="margin:0"> </p>',
      _meta: { htmlID: id, htmlClassNames: 'u_content_text' },
      selectable: true,
      draggable: true,
      duplicatable: true,
      deletable: true,
    },
  };
}

function createHeadingBlock(
  ids: IdFactory,
  html: string,
  level: string,
  opts: { align?: UnlayerTextAlign; color?: string; fontSize?: string } = {}
): UnlayerContentBlock {
  const id = ids.next('u_content_heading');
  const headingType = level.toLowerCase() as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  return {
    id,
    type: 'heading',
    values: {
      containerPadding: '10px',
      anchor: '',
      headingType,
      fontSize: opts.fontSize || HEADING_SIZES[headingType] || '24px',
      textAlign: opts.align || 'left',
      lineHeight: '140%',
      linkStyle: {
        inherit: true,
        linkColor: '#0000ee',
        linkHoverColor: '#0000ee',
        linkUnderline: true,
        linkHoverUnderline: true,
      },
      color: opts.color || '#000000',
      hideDesktop: false,
      hideMobile: false,
      text: html || 'Heading',
      _meta: { htmlID: id, htmlClassNames: 'u_content_heading' },
      selectable: true,
      draggable: true,
      duplicatable: true,
      deletable: true,
    },
  };
}

function createImageBlock(
  ids: IdFactory,
  src: string,
  opts: {
    alt?: string;
    href?: string;
    align?: UnlayerTextAlign;
    width?: string;
  } = {}
): UnlayerContentBlock {
  const id = ids.next('u_content_image');
  const widthNum = opts.width ? parsePx(opts.width) : null;
  return {
    id,
    type: 'image',
    values: {
      containerPadding: '10px',
      anchor: '',
      src: { url: src, width: widthNum || undefined, height: undefined },
      textAlign: opts.align || 'center',
      altText: opts.alt || '',
      action: opts.href
        ? { name: 'web', values: { href: opts.href, target: '_blank' } }
        : { name: 'web', values: { href: '', target: '_blank' } },
      hideDesktop: false,
      hideMobile: false,
      _meta: { htmlID: id, htmlClassNames: 'u_content_image' },
      selectable: true,
      draggable: true,
      duplicatable: true,
      deletable: true,
    },
  };
}

function createButtonBlock(
  ids: IdFactory,
  text: string,
  href: string,
  el: HTMLAnchorElement
): UnlayerContentBlock {
  const id = ids.next('u_content_button');
  const style = parseStyleMap(el);
  const bg =
    parseColor(style['background-color'] || style.background) || '#1e2a4a';
  const color = parseColor(style.color) || '#ffffff';
  const borderRadius = style['border-radius'] || '4px';
  const padding = style.padding || '12px 24px';
  const align = resolveAlign(el);

  return {
    id,
    type: 'button',
    values: {
      containerPadding: '10px',
      anchor: '',
      href: { name: 'web', values: { href: href || '#', target: '_blank' } },
      buttonColors: {
        color,
        backgroundColor: bg,
        hoverColor: color,
        hoverBackgroundColor: bg,
      },
      size: { autoWidth: true, width: '100%' },
      textAlign: align === 'justify' ? 'center' : align,
      padding,
      border: {},
      borderRadius,
      buttonType: 'button',
      fontWeight: style['font-weight'] || '700',
      fontSize: style['font-size'] || '14px',
      hideDesktop: false,
      hideMobile: false,
      text: text || 'Button',
      _meta: { htmlID: id, htmlClassNames: 'u_content_button' },
      selectable: true,
      draggable: true,
      duplicatable: true,
      deletable: true,
    },
  };
}

function createDividerBlock(ids: IdFactory): UnlayerContentBlock {
  const id = ids.next('u_content_divider');
  return {
    id,
    type: 'divider',
    values: {
      containerPadding: '10px',
      anchor: '',
      border: {
        borderTopWidth: '1px',
        borderTopStyle: 'solid',
        borderTopColor: '#cccccc',
      },
      textAlign: 'center',
      width: '100%',
      hideDesktop: false,
      hideMobile: false,
      _meta: { htmlID: id, htmlClassNames: 'u_content_divider' },
      selectable: true,
      draggable: true,
      duplicatable: true,
      deletable: true,
    },
  };
}

function createHtmlBlock(ids: IdFactory, html: string): UnlayerContentBlock {
  const id = ids.next('u_content_html');
  return {
    id,
    type: 'html',
    values: {
      html,
      containerPadding: '0px',
      anchor: '',
      hideDesktop: false,
      hideMobile: false,
      _meta: { htmlID: id, htmlClassNames: 'u_content_html' },
      selectable: true,
      draggable: true,
      duplicatable: true,
      deletable: true,
    },
  };
}

function createSpacerAsText(ids: IdFactory, height: number): UnlayerContentBlock {
  return createTextBlock(ids, `<p style="margin:0;line-height:${height}px;">&nbsp;</p>`, {
    padding: '0px',
    lineHeight: `${height}px`,
  });
}

function defaultColumnValues(id: string) {
  return {
    backgroundColor: '',
    padding: '0px',
    border: {},
    _meta: { htmlID: id, htmlClassNames: 'u_column' },
  };
}

function defaultRowValues(id: string) {
  return {
    displayCondition: null,
    columns: false,
    backgroundColor: '',
    columnsBackgroundColor: '',
    backgroundImage: {
      url: '',
      fullWidth: true,
      repeat: false,
      center: true,
      cover: false,
    },
    padding: '0px',
    anchor: '',
    hideDesktop: false,
    hideMobile: false,
    noStackMobile: false,
    _meta: { htmlID: id, htmlClassNames: 'u_row' },
    selectable: true,
    draggable: true,
    duplicatable: true,
    deletable: true,
  };
}

function makeSingleColumnRow(
  ids: IdFactory,
  contents: UnlayerContentBlock[]
): UnlayerRow {
  const rowId = ids.next('u_row');
  const colId = ids.next('u_column');
  return {
    id: rowId,
    cells: [1],
    columns: [
      {
        id: colId,
        contents,
        values: defaultColumnValues(colId),
      },
    ],
    values: defaultRowValues(rowId),
  };
}

function makeMultiColumnRow(
  ids: IdFactory,
  columnsContents: UnlayerContentBlock[][]
): UnlayerRow {
  const rowId = ids.next('u_row');
  const n = Math.max(columnsContents.length, 1);
  const cellSize = 1;
  const columns: UnlayerColumn[] = columnsContents.map((contents) => {
    const colId = ids.next('u_column');
    return {
      id: colId,
      contents: contents.length ? contents : [createTextBlock(ids, '<p style="margin:0">&nbsp;</p>')],
      values: defaultColumnValues(colId),
    };
  });

  return {
    id: rowId,
    cells: Array.from({ length: n }, () => cellSize),
    columns,
    values: { ...defaultRowValues(rowId), columns: n > 1 },
  };
}

/** Convert a list of sibling nodes into content blocks (single column flow). */
function convertNodesToContents(
  nodes: Node[],
  ids: IdFactory,
  depth: number
): UnlayerContentBlock[] {
  const contents: UnlayerContentBlock[] = [];
  for (const node of nodes) {
    contents.push(...convertNodeToContents(node, ids, depth));
  }
  return contents;
}

function convertNodeToContents(
  node: Node,
  ids: IdFactory,
  depth: number
): UnlayerContentBlock[] {
  if (depth > 40) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      return [createHtmlBlock(ids, serializeElement(node as Element))];
    }
    return [];
  }

  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent || '';
    if (isEmptyText(text)) return [];
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return [createTextBlock(ids, `<p style="margin:0">${escaped}</p>`)];
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return [];
  const el = node as Element;
  if (isHidden(el)) return [];

  const tag = el.tagName.toUpperCase();

  if (tag === 'STYLE' || tag === 'SCRIPT' || tag === 'NOSCRIPT' || tag === 'META') {
    return [];
  }

  if (isDividerElement(el)) {
    return [createDividerBlock(ids)];
  }

  if (isSpacerElement(el)) {
    return [createSpacerAsText(ids, spacerHeight(el))];
  }

  if (tag === 'IMG') {
    const img = el as HTMLImageElement;
    const src = img.getAttribute('src') || '';
    if (!src) return [];
    return [
      createImageBlock(ids, src, {
        alt: img.getAttribute('alt') || '',
        align: resolveAlign(img),
        width: getStyle(img, 'width') || img.getAttribute('width') || '',
      }),
    ];
  }

  if (tag === 'A') {
    const a = el as HTMLAnchorElement;
    const href = a.getAttribute('href') || '';
    const img = a.querySelector('img');
    if (img) {
      const src = img.getAttribute('src') || '';
      if (!src) return [createHtmlBlock(ids, serializeElement(el))];
      return [
        createImageBlock(ids, src, {
          alt: img.getAttribute('alt') || '',
          href,
          align: resolveAlign(a),
          width: getStyle(img, 'width') || img.getAttribute('width') || '',
        }),
      ];
    }
    if (looksLikeButton(a)) {
      return [createButtonBlock(ids, (a.textContent || '').trim() || 'Button', href, a)];
    }
    const inner = sanitizeInlineHtml(a);
    if (!inner && !href) return [];
    return [
      createTextBlock(ids, `<p style="margin:0"><a href="${href}">${inner || href}</a></p>`, {
        align: resolveAlign(a),
        color: parseColor(getStyle(a, 'color')) || undefined,
        fontSize: getStyle(a, 'font-size') || undefined,
      }),
    ];
  }

  if (/^H[1-6]$/.test(tag)) {
    const inner = sanitizeInlineHtml(el) || (el.textContent || '').trim();
    if (!inner) return [];
    return [
      createHeadingBlock(ids, inner, tag, {
        align: resolveAlign(el),
        color: parseColor(getStyle(el, 'color') || el.getAttribute('color') || '') || undefined,
        fontSize: getStyle(el, 'font-size') || HEADING_SIZES[tag.toLowerCase()],
      }),
    ];
  }

  if (tag === 'P' || tag === 'SPAN' || tag === 'FONT' || tag === 'LABEL') {
    const childEls = directChildElements(el);
    if (tag === 'SPAN' && childEls.length === 1 && childEls[0].tagName === 'IMG') {
      return convertNodeToContents(childEls[0], ids, depth + 1);
    }
    if (tag === 'SPAN' && childEls.length === 1 && childEls[0].tagName === 'A') {
      return convertNodeToContents(childEls[0], ids, depth + 1);
    }

    const hasBlockChildren = childEls.some((c) =>
      ['TABLE', 'DIV', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL'].includes(
        c.tagName.toUpperCase()
      )
    );
    if (hasBlockChildren) {
      return convertNodesToContents([...el.childNodes], ids, depth + 1);
    }

    const inner = sanitizeInlineHtml(el);
    if (isEmptyText(el.textContent || '') && !inner.includes('<img')) return [];
    return [
      createTextBlock(ids, `<p style="margin:0">${inner}</p>`, {
        align: resolveAlign(el),
        color: parseColor(getStyle(el, 'color') || el.getAttribute('color') || '') || undefined,
        fontSize: getStyle(el, 'font-size') || undefined,
        fontFamily: getStyle(el, 'font-family') || undefined,
        fontWeight: getStyle(el, 'font-weight') || undefined,
        lineHeight: getStyle(el, 'line-height') || undefined,
      }),
    ];
  }

  if (tag === 'UL' || tag === 'OL') {
    const inner = sanitizeInlineHtml(el);
    // Keep list markup inside a text block (Unlayer text supports limited HTML)
    const html = tag === 'UL' ? `<ul>${el.innerHTML}</ul>` : `<ol>${el.innerHTML}</ol>`;
    // Re-sanitize by wrapping
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    const cleaned = sanitizeInlineHtml(tmp);
    if (!cleaned && isEmptyText(el.textContent || '')) return [];
    return [createTextBlock(ids, cleaned || inner, { align: resolveAlign(el) })];
  }

  if (tag === 'BR') {
    return [createTextBlock(ids, '<p style="margin:0"><br></p>', { padding: '0px' })];
  }

  if (tag === 'HR') {
    return [createDividerBlock(ids)];
  }

  if (tag === 'TABLE') {
    const rows = convertTableToRows(el as HTMLTableElement, ids, depth + 1);
    const allSingle = rows.every((r) => r.columns.length === 1);
    if (allSingle) {
      return rows.flatMap((r) => r.columns[0]?.contents || []);
    }
    // Multi-column table inside a content stream — preserve visually
    return [createHtmlBlock(ids, serializeElement(el))];
  }

  if (tag === 'DIV' || tag === 'SECTION' || tag === 'ARTICLE' || tag === 'CENTER' || tag === 'TD' || tag === 'TH') {
    const childEls = directChildElements(el);
    // Single child passthrough
    if (childEls.length === 1 && isEmptyText(
      [...el.childNodes]
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => n.textContent || '')
        .join('')
    )) {
      return convertNodeToContents(childEls[0], ids, depth + 1);
    }

    // If only inline-ish content, make one text block
    const hasComplex = childEls.some((c) =>
      ['TABLE', 'DIV', 'SECTION', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'IMG', 'HR'].includes(
        c.tagName.toUpperCase()
      )
    );
    if (!hasComplex && (el.textContent || '').trim()) {
      const inner = sanitizeInlineHtml(el);
      if (inner) {
        return [
          createTextBlock(ids, `<p style="margin:0">${inner}</p>`, {
            align: resolveAlign(el) || (tag === 'CENTER' ? 'center' : 'left'),
            color: parseColor(getStyle(el, 'color')) || undefined,
            fontSize: getStyle(el, 'font-size') || undefined,
          }),
        ];
      }
    }

    return convertNodesToContents([...el.childNodes], ids, depth + 1);
  }

  // Unknown element — preserve as HTML block
  const html = serializeElement(el).trim();
  if (!html) return [];
  return [createHtmlBlock(ids, html)];
}

function convertTableToRows(
  table: HTMLTableElement,
  ids: IdFactory,
  depth: number
): UnlayerRow[] {
  const rows: UnlayerRow[] = [];
  const trs = tableRows(table);

  for (const tr of trs) {
    if (isHidden(tr)) continue;
    const cells = rowCells(tr).filter((c) => !isHidden(c));
    if (cells.length === 0) continue;

    if (cells.length === 1) {
      const cellContents = convertNodesToContents([...cells[0].childNodes], ids, depth + 1);
      if (cellContents.length === 0) continue;
      // If the only cell wraps another layout table, convert that table to rows
      const onlyTable = directChildElements(cells[0]).filter((c) => c.tagName === 'TABLE');
      if (
        onlyTable.length === 1 &&
        directChildElements(cells[0]).length === 1 &&
        isEmptyText(
          [...cells[0].childNodes]
            .filter((n) => n.nodeType === Node.TEXT_NODE)
            .map((n) => n.textContent || '')
            .join('')
        )
      ) {
        rows.push(...convertTableToRows(onlyTable[0] as HTMLTableElement, ids, depth + 1));
        continue;
      }
      rows.push(makeSingleColumnRow(ids, cellContents));
      continue;
    }

    // Multi-column row
    const columnsContents = cells.map((cell) =>
      convertNodesToContents([...cell.childNodes], ids, depth + 1)
    );
    // If conversion produced nothing useful, fall back to HTML for this row
    const allEmpty = columnsContents.every((c) => c.length === 0);
    if (allEmpty) {
      rows.push(
        makeSingleColumnRow(ids, [createHtmlBlock(ids, `<table><tr>${tr.innerHTML}</tr></table>`)])
      );
    } else {
      rows.push(makeMultiColumnRow(ids, columnsContents));
    }
  }

  return rows;
}

function convertElementToRows(
  el: Element,
  ids: IdFactory,
  depth: number
): UnlayerRow[] {
  if (depth > 40) {
    return [makeSingleColumnRow(ids, [createHtmlBlock(ids, serializeElement(el))])];
  }
  if (isHidden(el)) return [];

  const tag = el.tagName.toUpperCase();

  if (tag === 'TABLE') {
    return convertTableToRows(el as HTMLTableElement, ids, depth + 1);
  }

  // Block containers: recurse children into rows
  if (['DIV', 'SECTION', 'ARTICLE', 'CENTER', 'BODY', 'MAIN'].includes(tag)) {
    const childEls = directChildElements(el);
    const textOnly =
      childEls.length === 0 ||
      childEls.every((c) =>
        ['SPAN', 'A', 'B', 'I', 'STRONG', 'EM', 'U', 'BR', 'FONT'].includes(c.tagName)
      );

    if (textOnly && (el.textContent || '').trim()) {
      const contents = convertNodeToContents(el, ids, depth + 1);
      return contents.length ? [makeSingleColumnRow(ids, contents)] : [];
    }

    const rows: UnlayerRow[] = [];
    for (const child of [...el.childNodes]) {
      if (child.nodeType === Node.TEXT_NODE) {
        const t = child.textContent || '';
        if (!isEmptyText(t)) {
          rows.push(
            makeSingleColumnRow(ids, convertNodeToContents(child, ids, depth + 1))
          );
        }
        continue;
      }
      if (child.nodeType !== Node.ELEMENT_NODE) continue;
      const childEl = child as Element;
      const childTag = childEl.tagName.toUpperCase();
      if (childTag === 'TABLE') {
        rows.push(...convertTableToRows(childEl as HTMLTableElement, ids, depth + 1));
      } else if (['DIV', 'SECTION', 'ARTICLE', 'CENTER'].includes(childTag)) {
        rows.push(...convertElementToRows(childEl, ids, depth + 1));
      } else {
        const contents = convertNodeToContents(childEl, ids, depth + 1);
        if (contents.length) rows.push(makeSingleColumnRow(ids, contents));
      }
    }
    return rows;
  }

  const contents = convertNodeToContents(el, ids, depth + 1);
  return contents.length ? [makeSingleColumnRow(ids, contents)] : [];
}

function buildDesign(ids: IdFactory, rows: UnlayerRow[]): UnlayerDesign {
  const safeRows =
    rows.length > 0
      ? rows
      : [
          makeSingleColumnRow(ids, [
            createTextBlock(ids, '<p style="margin:0">Empty email</p>'),
          ]),
        ];

  return {
    counters: ids.snapshot(),
    body: {
      id: 'u_body',
      rows: safeRows,
      values: {
        textColor: '#000000',
        backgroundColor: '#ffffff',
        backgroundImage: {
          url: '',
          fullWidth: true,
          repeat: false,
          center: true,
          cover: false,
        },
        contentWidth: '600px',
        contentAlign: 'center',
        fontFamily: {
          label: 'Arial',
          value: 'arial,helvetica,sans-serif',
        },
        preheaderText: '',
        linkStyle: {
          body: true,
          linkColor: '#0000ee',
          linkHoverColor: '#0000ee',
          linkUnderline: true,
          linkHoverUnderline: true,
        },
        _meta: { htmlID: 'u_body', htmlClassNames: 'u_body' },
      },
    },
    schemaVersion: 16,
  };
}

/**
 * Convert sanitized email HTML into Unlayer design JSON.
 * Never drops content: unknown structures become `html` blocks.
 */
export function htmlToUnlayerDesign(html: string): UnlayerDesign {
  if (typeof DOMParser === 'undefined') {
    throw new Error('HTML-to-Unlayer conversion requires a browser environment');
  }

  const sanitized = sanitizeHtmlString(html);
  if (!sanitized.trim()) {
    throw new Error('HTML content is empty after sanitization');
  }

  const doc = new DOMParser().parseFromString(sanitized, 'text/html');
  const ids = new IdFactory();

  try {
    const body = doc.body;
    const rows = convertElementToRows(body, ids, 0);
    const design = buildDesign(ids, rows);

    // If we somehow produced no meaningful content blocks, fall back to full HTML
    const contentCount = design.body.rows.reduce(
      (sum, r) => sum + r.columns.reduce((s, c) => s + c.contents.length, 0),
      0
    );
    if (contentCount === 0) {
      return buildDesign(ids, [
        makeSingleColumnRow(ids, [createHtmlBlock(ids, sanitized)]),
      ]);
    }
    return design;
  } catch {
    // Absolute fallback — never lose the email
    return buildDesign(ids, [
      makeSingleColumnRow(ids, [createHtmlBlock(ids, sanitized)]),
    ]);
  }
}

/** Stats helper for UI toasts */
export function summarizeConvertedDesign(design: UnlayerDesign): {
  rows: number;
  blocks: number;
  htmlFallbacks: number;
} {
  let blocks = 0;
  let htmlFallbacks = 0;
  for (const row of design.body.rows) {
    for (const col of row.columns) {
      for (const c of col.contents) {
        blocks += 1;
        if (c.type === 'html') htmlFallbacks += 1;
      }
    }
  }
  return { rows: design.body.rows.length, blocks, htmlFallbacks };
}
