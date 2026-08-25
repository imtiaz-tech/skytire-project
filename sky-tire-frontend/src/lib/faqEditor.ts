/**
 * Shared FAQ rich-text helpers used by ProductCommonFields and Main Page FAQs.
 */

export const FAQ_FONT_FAMILY = 'Inter, sans-serif';
export const FAQ_QUESTION_STYLE =
  `font-size: 20px; font-family: ${FAQ_FONT_FAMILY}; font-weight: 700;`;
export const FAQ_ANSWER_STYLE =
  `font-size: 18px; font-family: ${FAQ_FONT_FAMILY}; font-weight: 400;`;

export const FAQ_EDITOR_PLACEHOLDER =
  'Use bold text or a heading for each question (default 20px Inter), then write the answer below it (default 18px Inter).';

/** Match Jodit.atom() so nested config lists replace defaults instead of merging. */
function asAtom<T extends object>(value: T): T {
  Object.defineProperty(value, 'isAtom', {
    enumerable: false,
    value: true,
    configurable: false,
  });
  return value;
}

/** Google Fonts stylesheet so `font-family: Inter` actually renders in the editor. */
const INTER_FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap';

function ensureInterFontLoaded() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('faq-inter-font')) return;
  const link = document.createElement('link');
  link.id = 'faq-inter-font';
  link.rel = 'stylesheet';
  link.href = INTER_FONT_HREF;
  document.head.appendChild(link);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Detect FAQ question lines (e.g. "1. What type of tires...?"). */
export function isFaqQuestionText(text: string): boolean {
  const t = text.replace(/\s+/g, ' ').trim();
  if (!t || !t.endsWith('?')) return false;
  if (/^\d+[\.\)]\s+/.test(t)) return true;
  return t.length > 0 && t.length <= 220;
}

function unwrapHeadingToParagraph(el: HTMLElement): HTMLElement {
  const tag = el.tagName.toLowerCase();
  if (!/^h[1-6]$/.test(tag)) return el;

  const p = document.createElement('p');
  p.innerHTML = el.innerHTML;
  el.replaceWith(p);
  return p;
}

function applyQuestionMarkup(el: HTMLElement) {
  const textHtml = el.innerHTML;
  const hasStrong = !!el.querySelector('strong, b');
  const inner = hasStrong
    ? textHtml
    : `<strong style="${FAQ_QUESTION_STYLE}">${textHtml}</strong>`;

  el.setAttribute('style', FAQ_QUESTION_STYLE);
  // Span carries font-size/family so Jodit’s toolbar can detect them on selection.
  el.innerHTML = `<span style="${FAQ_QUESTION_STYLE}">${inner}</span>`;
  el.querySelectorAll('strong, b, span').forEach((node) => {
    (node as HTMLElement).setAttribute('style', FAQ_QUESTION_STYLE);
  });
}

function applyAnswerMarkup(el: HTMLElement) {
  el.setAttribute('style', FAQ_ANSWER_STYLE);
  const text = (el.textContent || '').trim();
  if (!text) return;
  // Prefer a styled span so fontsize/font toolbar values resolve correctly.
  if (!el.querySelector('span[style*="font-size"]')) {
    el.innerHTML = `<span style="${FAQ_ANSWER_STYLE}">${el.innerHTML}</span>`;
  } else {
    el.querySelectorAll('span').forEach((node) => {
      (node as HTMLElement).setAttribute('style', FAQ_ANSWER_STYLE);
    });
  }
}

/**
 * Preserve/restore FAQ formatting on paste:
 * questions → bold 20px Inter, answers → 18px Inter.
 */
export function formatFaqPasteHtml(html: string): string {
  if (typeof document === 'undefined' || !html?.trim()) return html;
  ensureInterFontLoaded();

  const wrap = document.createElement('div');
  wrap.innerHTML = html;

  const blocks = Array.from(
    wrap.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li')
  ) as HTMLElement[];

  if (blocks.length > 0) {
    blocks.forEach((block) => {
      const text = (block.textContent || '').replace(/\s+/g, ' ').trim();
      if (!text) return;

      const el = unwrapHeadingToParagraph(block);
      if (isFaqQuestionText(text)) {
        applyQuestionMarkup(el);
      } else {
        applyAnswerMarkup(el);
      }
    });
    return wrap.innerHTML;
  }

  const raw = (wrap.innerHTML || wrap.textContent || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?[^>]+>/g, '');
  const lines = raw
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return html;

  wrap.innerHTML = lines
    .map((line) => {
      const safe = escapeHtml(line);
      if (isFaqQuestionText(line)) {
        return `<p style="${FAQ_QUESTION_STYLE}"><span style="${FAQ_QUESTION_STYLE}"><strong style="${FAQ_QUESTION_STYLE}">${safe}</strong></span></p>`;
      }
      return `<p style="${FAQ_ANSWER_STYLE}"><span style="${FAQ_ANSWER_STYLE}">${safe}</span></p>`;
    })
    .join('');

  return wrap.innerHTML;
}

export function getFaqEditorConfig() {
  ensureInterFontLoaded();

  return {
    readonly: false,
    placeholder: FAQ_EDITOR_PLACEHOLDER,
    showPlaceholder: true,
    toolbarButtonSize: 'middle' as const,
    buttons: [
      'source',
      '|',
      'bold',
      'strikethrough',
      'underline',
      'italic',
      '|',
      'ul',
      'ol',
      '|',
      'outdent',
      'indent',
      '|',
      'font',
      'fontsize',
      'brush',
      'paragraph',
      '|',
      'image',
      'video',
      'table',
      'link',
      '|',
      'align',
      'undo',
      'redo',
      '|',
      'hr',
      'eraser',
      'copyformat',
      '|',
      'symbol',
      'fullsize',
      'print',
      'about',
    ],
    // Include Inter + 20px so toolbar dropdowns match pasted FAQ styles.
    // asAtom replaces defaults entirely (avoids merge/prototype duplicates).
    controls: {
      font: {
        list: asAtom({
          '': 'Default',
          'Inter, sans-serif': 'Inter',
          'Arial, Helvetica, sans-serif': 'Arial',
          "'Courier New', Courier, monospace": 'Courier New',
          'Georgia, Palatino, serif': 'Georgia',
          "'Lucida Sans Unicode', 'Lucida Grande', sans-serif": 'Lucida Sans Unicode',
          'Tahoma, Geneva, sans-serif': 'Tahoma',
          "'Times New Roman', Times, serif": 'Times New Roman',
          "'Trebuchet MS', Helvetica, sans-serif": 'Trebuchet MS',
          'Helvetica, sans-serif': 'Helvetica',
          'Impact, Charcoal, sans-serif': 'Impact',
          'Verdana, Geneva, sans-serif': 'Verdana',
        }),
      },
      fontsize: {
        list: asAtom([
          8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 30, 32, 34, 36, 48, 60, 72, 96,
        ]),
      },
    },
    height: 420,
    uploader: { insertImageAsBase64URI: true },
    askBeforePasteHTML: false,
    askBeforePasteFromWord: false,
    defaultActionOnPaste: 'insert_as_html' as const,
    processPasteHTML: true,
    events: {
      processPaste(_event: unknown, html: string) {
        return formatFaqPasteHtml(html);
      },
      afterInit(editor: { value: string }) {
        ensureInterFontLoaded();
        const current = editor.value;
        if (!current?.trim()) return;
        const formatted = formatFaqPasteHtml(current);
        if (formatted && formatted !== current) {
          editor.value = formatted;
        }
      },
    },
    style: {
      font: `18px ${FAQ_FONT_FAMILY}`,
    },
    width: '100%',
    spellcheck: true,
    language: 'en',
  };
}

export const MAIN_PAGE_FAQ_CATEGORIES = [
  {
    key: 'tires',
    label: 'Tires',
    pageTitle: 'Tires Page FAQs',
    description:
      'These FAQs appear on the main tires page. Use bold text for each question and regular paragraphs for answers.',
  },
  {
    key: 'white_wall_tires',
    label: 'White Wall Tires',
    pageTitle: 'White Wall Tires Page FAQs',
    description:
      'These FAQs appear on the main white wall tires page. Use bold text for each question and regular paragraphs for answers.',
  },
  {
    key: 'wheels',
    label: 'Wheels',
    pageTitle: 'Wheels Page FAQs',
    description:
      'These FAQs appear on the main wheels page. Use bold text for each question and regular paragraphs for answers.',
  },
  {
    key: 'wire_wheels',
    label: 'Wire Wheels',
    pageTitle: 'Wire Wheels Page FAQs',
    description:
      'These FAQs appear on the main wire wheels page. Use bold text for each question and regular paragraphs for answers.',
  },
  {
    key: 'bolt_on_wire_wheels',
    label: 'Bolt-On Wire Wheels',
    pageTitle: 'Bolt-On Wire Wheels Page FAQs',
    description:
      'These FAQs appear on the main bolt-on wire wheels page. Use bold text for each question and regular paragraphs for answers.',
  },
  {
    key: 'accessories',
    label: 'Accessories',
    pageTitle: 'Accessories Page FAQs',
    description:
      'These FAQs appear on the main accessories page. Use bold text for each question and regular paragraphs for answers.',
  },
] as const;

export type MainPageFaqCategory = (typeof MAIN_PAGE_FAQ_CATEGORIES)[number]['key'];

export function isMainPageFaqCategory(value: string): value is MainPageFaqCategory {
  return MAIN_PAGE_FAQ_CATEGORIES.some((c) => c.key === value);
}
