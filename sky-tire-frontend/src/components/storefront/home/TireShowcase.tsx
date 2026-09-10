"use client";

import { useRef } from "react";
import Image from "next/image";
import ProductCard from "@/components/storefront/ProductCard";
import { IMG, tireShowcaseProducts } from "@/lib/storefront/content";

function ArrowIcon({ direction }: { direction: "prev" | "next" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      {direction === "prev" ? (
        <path
          d="M10.5 3.5 6 8l4.5 4.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M5.5 3.5 10 8l-4.5 4.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

const arrowClass =
  "absolute top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#0B0B0C] bg-white text-[#0B0B0C]";

const tirePeerClass = [
  "peer/t0 sr-only",
  "peer/t1 sr-only",
  "peer/t2 sr-only",
  "peer/t3 sr-only",
  "peer/t4 sr-only",
  "peer/t5 sr-only",
  "peer/t6 sr-only",
  "peer/t7 sr-only",
] as const;

function TireSlider() {
  const rootRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number | null>(null);

  const goBy = (delta: number) => {
    const radios = [
      ...(rootRef.current?.querySelectorAll<HTMLInputElement>(
        'input[name="home-tires-slider"]',
      ) ?? []),
    ];
    const current = radios.findIndex((radio) => radio.checked);
    const next = Math.min(radios.length - 1, Math.max(0, current + delta));
    radios[next]?.click();
  };

  return (
    <div
      ref={rootRef}
      className="relative lg:hidden"
      onTouchStart={(event) => {
        startX.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        if (startX.current == null) return;
        const dx = event.changedTouches[0].clientX - startX.current;
        startX.current = null;
        if (dx < -40) goBy(1);
        if (dx > 40) goBy(-1);
      }}
    >
      <style>{`
        .tire-viewport { --tire-shift: 0%; }
        #home-tire-1:checked ~ .tire-viewport { --tire-shift: -100%; }
        #home-tire-2:checked ~ .tire-viewport { --tire-shift: -200%; }
        #home-tire-3:checked ~ .tire-viewport { --tire-shift: -300%; }
        #home-tire-4:checked ~ .tire-viewport { --tire-shift: -400%; }
        #home-tire-5:checked ~ .tire-viewport { --tire-shift: -500%; }
        #home-tire-6:checked ~ .tire-viewport { --tire-shift: -600%; }
        #home-tire-7:checked ~ .tire-viewport { --tire-shift: -700%; }
        .tire-track {
          width: 100%;
          transform: translateX(var(--tire-shift));
        }
      `}</style>

      {tireShowcaseProducts.map((product, index) => (
        <input
          key={product.name}
          id={`home-tire-${index}`}
          type="radio"
          name="home-tires-slider"
          defaultChecked={index === 0}
          className={tirePeerClass[index]}
          aria-label={product.name}
        />
      ))}

      <span className={`${arrowClass} left-0 opacity-30 peer-checked/t0:flex`} aria-hidden>
        <ArrowIcon direction="prev" />
      </span>
      <label htmlFor="home-tire-0" className={`${arrowClass} left-0 cursor-pointer peer-checked/t1:flex`}>
        <span className="sr-only">Previous tire</span>
        <ArrowIcon direction="prev" />
      </label>
      <label htmlFor="home-tire-1" className={`${arrowClass} left-0 cursor-pointer peer-checked/t2:flex`}>
        <span className="sr-only">Previous tire</span>
        <ArrowIcon direction="prev" />
      </label>
      <label htmlFor="home-tire-2" className={`${arrowClass} left-0 cursor-pointer peer-checked/t3:flex`}>
        <span className="sr-only">Previous tire</span>
        <ArrowIcon direction="prev" />
      </label>
      <label htmlFor="home-tire-3" className={`${arrowClass} left-0 cursor-pointer peer-checked/t4:flex`}>
        <span className="sr-only">Previous tire</span>
        <ArrowIcon direction="prev" />
      </label>
      <label htmlFor="home-tire-4" className={`${arrowClass} left-0 cursor-pointer peer-checked/t5:flex`}>
        <span className="sr-only">Previous tire</span>
        <ArrowIcon direction="prev" />
      </label>
      <label htmlFor="home-tire-5" className={`${arrowClass} left-0 cursor-pointer peer-checked/t6:flex`}>
        <span className="sr-only">Previous tire</span>
        <ArrowIcon direction="prev" />
      </label>
      <label htmlFor="home-tire-6" className={`${arrowClass} left-0 cursor-pointer peer-checked/t7:flex`}>
        <span className="sr-only">Previous tire</span>
        <ArrowIcon direction="prev" />
      </label>

      <label htmlFor="home-tire-1" className={`${arrowClass} right-0 cursor-pointer peer-checked/t0:flex`}>
        <span className="sr-only">Next tire</span>
        <ArrowIcon direction="next" />
      </label>
      <label htmlFor="home-tire-2" className={`${arrowClass} right-0 cursor-pointer peer-checked/t1:flex`}>
        <span className="sr-only">Next tire</span>
        <ArrowIcon direction="next" />
      </label>
      <label htmlFor="home-tire-3" className={`${arrowClass} right-0 cursor-pointer peer-checked/t2:flex`}>
        <span className="sr-only">Next tire</span>
        <ArrowIcon direction="next" />
      </label>
      <label htmlFor="home-tire-4" className={`${arrowClass} right-0 cursor-pointer peer-checked/t3:flex`}>
        <span className="sr-only">Next tire</span>
        <ArrowIcon direction="next" />
      </label>
      <label htmlFor="home-tire-5" className={`${arrowClass} right-0 cursor-pointer peer-checked/t4:flex`}>
        <span className="sr-only">Next tire</span>
        <ArrowIcon direction="next" />
      </label>
      <label htmlFor="home-tire-6" className={`${arrowClass} right-0 cursor-pointer peer-checked/t5:flex`}>
        <span className="sr-only">Next tire</span>
        <ArrowIcon direction="next" />
      </label>
      <label htmlFor="home-tire-7" className={`${arrowClass} right-0 cursor-pointer peer-checked/t6:flex`}>
        <span className="sr-only">Next tire</span>
        <ArrowIcon direction="next" />
      </label>
      <span className={`${arrowClass} right-0 opacity-30 peer-checked/t7:flex`} aria-hidden>
        <ArrowIcon direction="next" />
      </span>

      <div className="tire-viewport mx-12 overflow-hidden">
        <div className="tire-track flex">
          {tireShowcaseProducts.map((product) => (
            <div key={product.name} className="w-full min-w-full shrink-0">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function TireShowcase() {
  return (
    <section>
      <header className="relative isolate overflow-hidden bg-[#0B0B0C] text-white">
        <Image
          src={`${IMG}/tires-banner.png`}
          alt=""
          fill
          className="object-cover object-[center_right]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[#0B0B0C]/[0.78]" />
        <div className="relative mx-auto flex min-h-[200px] w-full max-w-[1280px] flex-col justify-center px-5 py-10 lg:min-h-[260px] lg:px-4">
          <p className="font-body text-[12px] font-bold uppercase leading-[1.5] tracking-[0.167em] text-[#C6A15B]">
            The Original Look
          </p>
          <h2 className="mt-2 font-display text-[48px] uppercase leading-none text-white lg:text-[96px]">
            Tires
          </h2>
          <p className="mt-2 max-w-[537px] font-body text-[16px] leading-[1.5] text-[#C9CDD1] lg:text-[18px]">
            Authentic styling for classic cars, lowriders, and custom builds.
          </p>
        </div>
      </header>

      <div className="bg-white py-10 lg:py-16">
        <div className="mx-auto w-full max-w-[1280px] px-5 lg:px-4">
          <TireSlider />

          <div className="hidden gap-8 lg:grid lg:grid-cols-4">
            {tireShowcaseProducts.map((product) => (
              <ProductCard key={product.name} product={product} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
