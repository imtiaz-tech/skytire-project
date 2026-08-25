/**
 * Shared FAQ rich-text helpers used by ProductCommonFields and Main Page FAQs.
 */

export const FAQ_QUESTION_STYLE =
  'font-size: 20px; font-family: Inter, sans-serif; font-weight: 700;';
export const FAQ_ANSWER_STYLE =
  'font-size: 18px; font-family: Inter, sans-serif; font-weight: 400;';

export const FAQ_EDITOR_PLACEHOLDER =
  'Use bold text or a heading for each question (default 20px Inter), then write the answer below it (default 18px Inter).';

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

/**
 * Preserve/restore FAQ formatting on paste:
 * questions → bold 20px Inter, answers → 18px Inter.
 */
export function formatFaqPasteHtml(html: string): string {
  if (typeof document === 'undefined' || !html?.trim()) return html;

  const wrap = document.createElement('div');
  wrap.innerHTML = html;

  const applyBlockStyle = (el: HTMLElement) => {
    const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (!text) return;

    if (isFaqQuestionText(text)) {
      el.setAttribute('style', FAQ_QUESTION_STYLE);
      const hasStrong = !!el.querySelector('strong, b');
      if (!hasStrong) {
        el.innerHTML = `<strong style="${FAQ_QUESTION_STYLE}">${el.innerHTML}</strong>`;
      } else {
        el.querySelectorAll('strong, b').forEach((node) => {
          (node as HTMLElement).setAttribute('style', FAQ_QUESTION_STYLE);
        });
      }
    } else {
      el.setAttribute('style', FAQ_ANSWER_STYLE);
    }
  };

  const blocks = Array.from(wrap.querySelectorAll('p, h1, h2, h3, h4, li')) as HTMLElement[];

  if (blocks.length > 0) {
    blocks.forEach(applyBlockStyle);
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
        return `<p style="${FAQ_QUESTION_STYLE}"><strong style="${FAQ_QUESTION_STYLE}">${safe}</strong></p>`;
      }
      return `<p style="${FAQ_ANSWER_STYLE}">${safe}</p>`;
    })
    .join('');

  return wrap.innerHTML;
}

export function getFaqEditorConfig() {
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
    },
    style: {
      font: '18px Inter, sans-serif',
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
