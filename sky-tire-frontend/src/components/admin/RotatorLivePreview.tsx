'use client';

import React from 'react';
import { RotatorColors } from '@/redux/types/rotatorTypes';
import { resolveCssColor } from '@/lib/rotatorValidation';

interface RotatorLivePreviewProps {
  colors: RotatorColors;
  title: string;
}

export default function RotatorLivePreview({ colors, title }: RotatorLivePreviewProps) {
  const displayTitle = title || 'WHEELS - 1964 IMPALA PRECISION';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <p className="text-sm font-semibold text-gray-500 mb-4">Live Preview</p>
      <div
        className="rounded-lg overflow-hidden shadow-lg"
        style={{
          borderTop: `6px solid ${resolveCssColor(colors.borderColor)}`,
          borderBottom: `6px solid ${resolveCssColor(colors.borderColor)}`,
          background: `linear-gradient(90deg, ${resolveCssColor(colors.bgGradientStart)} 0%, ${resolveCssColor(colors.bgGradientMiddle)} 50%, ${resolveCssColor(colors.bgGradientEnd)} 100%)`,
        }}
      >
        <div className="flex items-center justify-center px-6 py-10 min-h-[88px] text-center">
          <p
            className="text-base sm:text-lg font-bold uppercase tracking-wide"
            style={{
              color: resolveCssColor(colors.textColor),
              textShadow: `0 0 8px ${resolveCssColor(colors.glowColor)}, 0 0 16px ${resolveCssColor(colors.glowColor)}`,
            }}
          >
            {displayTitle}
          </p>
        </div>
      </div>
    </div>
  );
}
