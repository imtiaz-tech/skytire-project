'use client';

import React, { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { X } from 'lucide-react';

const JoditEditor = dynamic(() => import('jodit-react'), { ssr: false });

export type ProductCommonSection = 'description' | 'seo' | 'faqs' | 'scores';

export type SkyScoreField = {
  key: string;
  label: string;
};

export type ProductCommonFieldsProps = {
  /** Which blocks to render. Defaults to all. */
  sections?: ProductCommonSection[];
  /** When false, SEO/FAQs/Scores render without outer white cards (for embedding). Default true. */
  wrapCards?: boolean;

  // Description
  description?: string;
  onDescriptionChange?: (html: string) => void;
  descriptionPlaceholder?: string;

  // Keywords
  keywords?: string[];
  onKeywordsChange?: (keywords: string[]) => void;

  // SEO
  seoTitle?: string;
  onSeoTitleChange?: (value: string) => void;
  metaDescription?: string;
  onMetaDescriptionChange?: (value: string) => void;
  seoCardTitle?: string;

  // FAQs
  faqs?: string;
  onFaqsChange?: (html: string) => void;

  // Tags
  tags?: string[];
  onTagsChange?: (tags: string[]) => void;

  // Also Found In
  alsoFoundIn?: string[];
  onAlsoFoundInChange?: (items: string[]) => void;

  // Sky Score
  scoreFields?: SkyScoreField[];
  scores?: Record<string, string>;
  onScoreChange?: (key: string, value: string) => void;
  scoresCardTitle?: string;
};

const DEFAULT_SECTIONS: ProductCommonSection[] = ['description', 'seo', 'faqs', 'scores'];

const cardClass = 'bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 space-y-8';

function addChipValue(
  raw: string,
  list: string[],
  onChange: (next: string[]) => void,
  setInput: React.Dispatch<React.SetStateAction<string>>
) {
  const val = raw.trim().replace(/;$/, '');
  if (val && !list.includes(val)) {
    onChange([...list, val]);
  }
  setInput('');
}

export default function ProductCommonFields({
  sections = DEFAULT_SECTIONS,
  wrapCards = true,
  description = '',
  onDescriptionChange,
  descriptionPlaceholder = 'Enter product description...',
  keywords = [],
  onKeywordsChange,
  seoTitle = '',
  onSeoTitleChange,
  metaDescription = '',
  onMetaDescriptionChange,
  seoCardTitle = 'SEO & Search Optimization',
  faqs = '',
  onFaqsChange,
  tags = [],
  onTagsChange,
  alsoFoundIn = [],
  onAlsoFoundInChange,
  scoreFields = [],
  scores = {},
  onScoreChange,
  scoresCardTitle = 'Sky Score (0-10)',
}: ProductCommonFieldsProps) {
  const show = (section: ProductCommonSection) => sections.includes(section);

  const [keywordInput, setKeywordInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [alsoFoundInInput, setAlsoFoundInInput] = useState('');

  const setKeywords = onKeywordsChange ?? (() => {});
  const setTags = onTagsChange ?? (() => {});
  const setAlsoFoundIn = onAlsoFoundInChange ?? (() => {});
  const setFaqs = onFaqsChange ?? (() => {});
  const setSeoTitle = onSeoTitleChange ?? (() => {});
  const setMetaDescription = onMetaDescriptionChange ?? (() => {});
  const setScore = onScoreChange ?? (() => {});

  const descriptionEditorConfig = useMemo(
    () => ({
      readonly: false,
      placeholder: descriptionPlaceholder,
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
      height: 400,
      uploader: { insertImageAsBase64URI: true },
      askBeforePasteHTML: false,
      askBeforePasteFromWord: false,
      defaultActionOnPaste: 'insert_clear_html' as const,
      width: '100%',
      spellcheck: true,
      language: 'en',
    }),
    [descriptionPlaceholder]
  );

  const faqEditorConfig = useMemo(
    () => ({
      readonly: false,
      placeholder:
        'Use bold text or a heading for each question (default 20px Inter), then write the answer below it (default 18px Inter).',
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
      height: 360,
      uploader: { insertImageAsBase64URI: true },
      askBeforePasteHTML: false,
      askBeforePasteFromWord: false,
      defaultActionOnPaste: 'insert_clear_html' as const,
      width: '100%',
      spellcheck: true,
      language: 'en',
    }),
    []
  );

  const handleKeywordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ';') {
      e.preventDefault();
      addChipValue(keywordInput, keywords, setKeywords, setKeywordInput);
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ';') {
      e.preventDefault();
      addChipValue(tagInput, tags, setTags, setTagInput);
    }
  };

  const handleAlsoFoundInKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ';') {
      e.preventDefault();
      addChipValue(alsoFoundInInput, alsoFoundIn, setAlsoFoundIn, setAlsoFoundInInput);
    }
  };

  const descriptionBlock =
    show('description') && onDescriptionChange ? (
      <div className="space-y-4">
        <label className="text-[14px] font-bold text-[#1e2a4a]">Description</label>
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <JoditEditor
            value={description}
            config={descriptionEditorConfig}
            onBlur={(content) => onDescriptionChange(content)}
          />
        </div>
      </div>
    ) : null;

  const seoInner = show('seo') ? (
    <div className="space-y-6">
      {seoCardTitle && wrapCards && (
        <h3 className="text-[18px] font-bold text-[#1e2a4a] border-b border-gray-50 pb-4">{seoCardTitle}</h3>
      )}

      <div className="space-y-3">
        <div className="relative w-full">
          {keywordInput && (
            <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">
              Keywords
            </label>
          )}
          <input
            type="text"
            placeholder="Press Enter or ; to add keywords"
            className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none focus:ring-1 focus:ring-blue-500/50"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={handleKeywordKeyDown}
          />
        </div>
        {keywords.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {keywords.map((kw) => (
              <span
                key={kw}
                className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[13px] font-bold flex items-center gap-2 border border-blue-100"
              >
                {kw}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-blue-800"
                  onClick={() => setKeywords(keywords.filter((k) => k !== kw))}
                />
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="relative w-full">
        {seoTitle && (
          <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">
            SEO Title
          </label>
        )}
        <input
          type="text"
          placeholder="SEO Title"
          className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none focus:ring-1 focus:ring-blue-500/20"
          value={seoTitle}
          onChange={(e) => setSeoTitle(e.target.value)}
        />
      </div>

      <div className="relative w-full">
        {metaDescription && (
          <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">
            Meta Description
          </label>
        )}
        <textarea
          placeholder="Meta Description"
          className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none min-h-[100px] resize-y focus:ring-1 focus:ring-blue-500/20"
          value={metaDescription}
          onChange={(e) => setMetaDescription(e.target.value)}
        />
      </div>
    </div>
  ) : null;

  const faqsInner = show('faqs') ? (
    <div className="space-y-8">
      <div className="space-y-3">
        <h3 className="text-[18px] font-bold text-[#1e2a4a]">FAQs</h3>
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <JoditEditor value={faqs} config={faqEditorConfig} onBlur={(content) => setFaqs(content)} />
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-[16px] font-bold text-[#1e2a4a]">Tags</h3>
        <input
          type="text"
          placeholder="Type tags and press Enter or semi-colon (;)"
          className="w-full min-h-[120px] px-4 py-3 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleTagKeyDown}
        />
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[13px] font-bold flex items-center gap-2 border border-blue-100"
              >
                {tag}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => setTags(tags.filter((t) => t !== tag))}
                />
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="text-[16px] font-bold text-[#1e2a4a]">Also Found In</h3>
        <input
          type="text"
          placeholder="Type categories and press Enter or semi-colon (;)"
          className="w-full min-h-[120px] px-4 py-3 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none"
          value={alsoFoundInInput}
          onChange={(e) => setAlsoFoundInInput(e.target.value)}
          onKeyDown={handleAlsoFoundInKeyDown}
        />
        {alsoFoundIn.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {alsoFoundIn.map((item) => (
              <span
                key={item}
                className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[13px] font-bold flex items-center gap-2 border border-emerald-100"
              >
                {item}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => setAlsoFoundIn(alsoFoundIn.filter((t) => t !== item))}
                />
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  ) : null;

  const scoresInner = show('scores') ? (
    <div className="space-y-6">
      <h3 className="text-[18px] font-bold text-[#1e2a4a]">{scoresCardTitle}</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {scoreFields.map((field) => {
          const value = scores[field.key] ?? '';
          return (
            <div key={field.key} className="relative w-full">
              <input
                type="number"
                min={0}
                max={10}
                placeholder={field.label}
                className="peer w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none focus:ring-1 focus:ring-blue-500/50 placeholder-transparent focus:placeholder-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                value={value}
                onChange={(e) => setScore(field.key, e.target.value)}
                onWheel={(e) => e.currentTarget.blur()}
              />
              <label
                className={`absolute left-3 px-1 font-medium pointer-events-none transition-all duration-200 z-10 ${
                  value
                    ? '-top-2.5 text-[12px] text-gray-400 bg-white'
                    : 'top-3.5 text-[16px] text-gray-400 bg-transparent peer-focus:-top-2.5 peer-focus:text-[12px] peer-focus:bg-white'
                }`}
              >
                {field.label}
              </label>
            </div>
          );
        })}
      </div>
    </div>
  ) : null;

  const wrap = (content: React.ReactNode, key: string) =>
    content ? (
      wrapCards ? (
        <div key={key} className={cardClass}>
          {content}
        </div>
      ) : (
        <div key={key} className="space-y-6">
          {content}
        </div>
      )
    ) : null;

  return (
    <>
      {/* Description is usually embedded near product name — never auto-wrap in its own card */}
      {descriptionBlock}

      {wrap(seoInner, 'seo')}
      {wrap(faqsInner, 'faqs')}
      {wrap(scoresInner, 'scores')}
    </>
  );
}
