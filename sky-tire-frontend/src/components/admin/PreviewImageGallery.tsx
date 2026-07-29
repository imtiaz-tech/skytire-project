'use client';

import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PreviewImageGalleryProps {
  images: string[];
  alt?: string;
  getImageUrl: (path: string) => string | null;
  /** How many images to show at once (default 2, matching current preview layout) */
  visibleCount?: number;
}

export default function PreviewImageGallery({
  images,
  alt = 'Product',
  getImageUrl,
  visibleCount = 2,
}: PreviewImageGalleryProps) {
  const [startIndex, setStartIndex] = useState(0);
  const safeImages = Array.isArray(images) ? images.filter(Boolean) : [];

  useEffect(() => {
    setStartIndex(0);
  }, [safeImages.join('|')]);

  if (safeImages.length === 0) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-center h-full min-h-[250px] shadow-sm">
        <div className="text-gray-400 font-medium text-sm">No images available</div>
      </div>
    );
  }

  const pageSize = Math.max(1, Math.min(visibleCount, safeImages.length));
  const maxStart = Math.max(0, safeImages.length - pageSize);
  const clampedStart = Math.min(startIndex, maxStart);
  const visible = safeImages.slice(clampedStart, clampedStart + pageSize);
  const canGoLeft = clampedStart > 0;
  const canGoRight = clampedStart < maxStart;
  const showNav = safeImages.length > pageSize;

  const goLeft = () => {
    if (!canGoLeft) return;
    setStartIndex((prev) => Math.max(0, prev - 1));
  };

  const goRight = () => {
    if (!canGoRight) return;
    setStartIndex((prev) => Math.min(maxStart, prev + 1));
  };

  return (
    <div className="relative bg-white border border-gray-100 rounded-2xl p-4 shadow-sm h-full min-h-[250px] flex flex-col justify-center">
      <div className="flex items-center justify-center gap-4 flex-1">
        {showNav && (
          <button
            type="button"
            onClick={goLeft}
            disabled={!canGoLeft}
            aria-label="Previous images"
            className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full flex items-center justify-center border shadow-sm transition-all ${
              canGoLeft
                ? 'bg-white border-gray-200 text-[#1e2a4a] hover:bg-gray-50 hover:border-gray-300'
                : 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed'
            }`}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        {visible.map((img, idx) => {
          const imageUrl = getImageUrl(img);
          return (
            <div
              key={`${img}-${clampedStart + idx}`}
              className="flex-1 rounded-xl overflow-hidden flex items-center justify-center h-[200px] min-w-0"
            >
              <img
                src={imageUrl || ''}
                alt={`${alt} ${clampedStart + idx + 1}`}
                className="w-full h-full object-contain mix-blend-multiply"
              />
            </div>
          );
        })}

        {showNav && (
          <button
            type="button"
            onClick={goRight}
            disabled={!canGoRight}
            aria-label="Next images"
            className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full flex items-center justify-center border shadow-sm transition-all ${
              canGoRight
                ? 'bg-white border-gray-200 text-[#1e2a4a] hover:bg-gray-50 hover:border-gray-300'
                : 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed'
            }`}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>

      {showNav && (
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {safeImages.map((_, idx) => {
            const isActive = idx >= clampedStart && idx < clampedStart + pageSize;
            return (
              <button
                key={idx}
                type="button"
                aria-label={`Go to image ${idx + 1}`}
                onClick={() => setStartIndex(Math.min(idx, maxStart))}
                className={`h-1.5 rounded-full transition-all ${
                  isActive ? 'w-4 bg-[#1e2a4a]' : 'w-1.5 bg-gray-300 hover:bg-gray-400'
                }`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
