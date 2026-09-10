"use client";

import { useEffect, useState } from "react";
import type { BannerData } from "@/lib/bannerValidation";
import Icon from "@/components/storefront/Icon";

function parts(endDate: string | null, now: number) {
  if (!endDate) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  const diff = new Date(endDate).getTime() - now;
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff / 3600000) % 24),
    minutes: Math.floor((diff / 60000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function DealCountdown({ banner }: { banner: BannerData }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = parts(banner.countdownEndDate, now);
  const units = [
    { value: pad(time.days), label: "Days" },
    { value: pad(time.hours), label: "Hrs" },
    { value: pad(time.minutes), label: "Mins" },
    { value: pad(time.seconds), label: "Secs" },
  ];

  const headline =
    banner.headlineSegments.map((segment) => segment.text).join(" ").trim() ||
    "Labor Day Deals.";
  const uptoLabel =
    banner.subheadlineSegments.length > 1
      ? banner.subheadlineSegments[0].text
      : "Up to";
  const offerLabel =
    banner.subheadlineSegments.length > 1
      ? banner.subheadlineSegments
          .slice(1)
          .map((segment) => segment.text)
          .join(" ")
      : banner.subheadlineSegments[0]?.text || "67% OFF";

  return (
    <div className="w-full max-w-[389px] rounded-[2px] border border-[#C6A15B]/30 bg-[#0B0B0C]/88 p-8 text-white">
      <p className="font-display text-[24px] uppercase leading-[1.33] tracking-[0.1em] text-white">
        {headline}
      </p>
      <p className="mt-1 flex items-baseline gap-2">
        <span className="font-display text-[18px] uppercase leading-[1.56] tracking-[0.025em] text-white">
          {uptoLabel}
        </span>
        <span className="font-display text-[48px] uppercase leading-none tracking-[-0.05em] text-[#C6A15B]">
          {offerLabel}
        </span>
      </p>
      <div className="mt-5 grid grid-cols-4 gap-2">
        {units.map((unit) => (
          <div key={unit.label} className="bg-[#26282C] py-3 text-center">
            <div className="font-display text-[24px] leading-[1.33] tracking-[0.03em] text-white">
              {unit.value}
            </div>
            <div className="mt-1 font-body text-[9px] font-bold uppercase leading-[1.5] tracking-[-0.05em] text-[#C9CDD1]">
              {unit.label}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-7 border-t border-white/10 pt-5">
        <div className="flex items-center gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Icon key={i} name="star" alt="" size={14} />
          ))}
          <span className="font-body text-[16px] font-bold tracking-[0.016em] text-white">
            {banner.ratingValue.toFixed(1)}
          </span>
        </div>
        <p className="mt-2 font-body text-[12px] uppercase leading-[1.33] tracking-[0.1em] text-[#C9CDD1]">
          {banner.ratingText}
        </p>
      </div>
    </div>
  );
}
