'use client';

import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { BannerData } from '@/lib/bannerValidation';
import { getBannerImageUrl } from '@/lib/bannerImageUrl';

interface BannerLivePreviewProps {
  banner: BannerData;
}

function getCountdownParts(endDate: string | null) {
  if (!endDate) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds };
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export default function BannerLivePreview({ banner }: BannerLivePreviewProps) {
  const [countdown, setCountdown] = useState(getCountdownParts(banner.countdownEndDate));

  useEffect(() => {
    setCountdown(getCountdownParts(banner.countdownEndDate));
    const timer = setInterval(() => {
      setCountdown(getCountdownParts(banner.countdownEndDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [banner.countdownEndDate]);

  const bgUrl = banner.backgroundImage ? getBannerImageUrl(banner.backgroundImage) : '';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <p className="text-sm font-semibold text-gray-500 mb-4">Live Preview</p>
      <div
        className="relative rounded-2xl overflow-hidden min-h-[480px] sm:min-h-[520px]"
        style={{
          backgroundImage: bgUrl ? `url(${bgUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: bgUrl ? undefined : '#1a1d22',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/20 to-black/10" />

        <div className="relative z-10 min-h-[480px] sm:min-h-[520px] px-8 sm:px-12 py-10 flex flex-col justify-start">
          <div className="space-y-5 max-w-2xl">
            <h2 className="text-4xl sm:text-5xl font-black uppercase leading-[1.1] tracking-tight text-white">
              {banner.headlineSegments.map((seg, i) => (
                <React.Fragment key={i}>
                  {i > 0 ? ' ' : null}
                  <span style={{ color: seg.color }}>{seg.text.trim()}</span>
                </React.Fragment>
              ))}
            </h2>

            <p className="text-3xl sm:text-4xl font-black uppercase leading-tight">
              {banner.subheadlineSegments.map((seg, i) => (
                <React.Fragment key={i}>
                  {i > 0 ? ' ' : null}
                  <span style={{ color: seg.color }}>{seg.text.trim()}</span>
                </React.Fragment>
              ))}
            </p>

            {banner.countdownEndDate && (
              <div className="pt-1">
                <p className="text-white text-xs sm:text-sm font-bold mb-3 uppercase tracking-wider">
                  {banner.countdownText}
                </p>
                <div className="flex gap-2 sm:gap-3">
                  {[
                    { value: pad(countdown.days), label: 'Days' },
                    { value: pad(countdown.hours), label: 'Hrs.' },
                    { value: pad(countdown.minutes), label: 'Min.' },
                    { value: pad(countdown.seconds), label: 'Sec.' },
                  ].map((item) => (
                    <div key={item.label} className="text-center">
                      <div className="bg-white rounded-xl px-4 py-3 min-w-[52px] sm:min-w-[60px] text-[#1e2a4a] font-bold text-xl sm:text-2xl leading-none shadow-sm">
                        {item.value}
                      </div>
                      <p className="text-white text-[10px] sm:text-xs mt-2 uppercase font-semibold tracking-wide">
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              className="mt-2 px-8 py-3.5 rounded-xl text-white font-bold text-sm sm:text-base shadow-lg"
              style={{ backgroundColor: banner.buttonColor }}
            >
              {banner.buttonText}
            </button>
          </div>

          <div
            className="absolute bottom-6 right-6 sm:bottom-8 sm:right-8 flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm"
            style={{
              backgroundColor: banner.ratingBgColor,
              color: banner.ratingTextColor,
            }}
          >
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400"
                />
              ))}
            </div>
            <span className="font-bold">{banner.ratingValue}</span>
            <span>{banner.ratingText}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
