import Image from "next/image";
import Link from "next/link";
import { cultureColumns, cultureFilters, cultureTags } from "@/lib/storefront/content";

function ShopBadge() {
  return (
    <Link
      href="/wire-wheels"
      className="absolute bottom-4 left-4 z-10 inline-flex bg-[#C6A15B] px-3 py-1 font-body text-[9px] font-bold uppercase leading-[1.5] tracking-[0.1em] text-white"
    >
      Shop The Look
    </Link>
  );
}

export default function CultureBanner() {
  return (
    <section className="bg-[#0B0B0C] py-16 lg:py-24">
      <div className="mx-auto w-full max-w-[1280px] px-5 lg:px-4">
        <p className="text-center font-display text-[12px] uppercase leading-[1.33] tracking-[0.2em] text-[#C6A15B] lg:hidden">
          From the boulevard
        </p>
        <h2 className="mt-3 text-center font-display text-[48px] uppercase leading-none text-white lg:mt-0 lg:text-[72px]">
          Don&apos;t build ordinary.
          <br className="lg:hidden" /> Build different.
        </h2>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {cultureTags.map((tag, index) => (
            <span
              key={tag}
              className={`inline-flex items-center rounded-full bg-[#202124] px-5 py-1.5 font-body text-[10px] font-bold uppercase leading-[1.5] tracking-[0.1em] ${
                index === 0
                  ? "border border-[#C6A15B]/30 text-white"
                  : "border border-white/10 text-white"
              }`}
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 lg:mt-16 lg:grid-cols-4 lg:gap-6">
          {cultureColumns.map((column, columnIndex) => (
            <div key={columnIndex} className="flex flex-col gap-3 lg:gap-6">
              {column.map((item) => {
                const featured = "featured" in item && item.featured;

                return (
                  <article
                    key={item.src}
                    className={`relative aspect-square overflow-hidden ${
                      featured
                        ? "border-2 border-[#C6A15B]"
                        : "border border-white/10"
                    }`}
                  >
                    <Image
                      src={item.src}
                      alt={item.alt}
                      fill
                      className="object-cover"
                      sizes="(min-width: 1024px) 294px, 50vw"
                    />
                    {"shop" in item && item.shop ? <ShopBadge /> : null}
                  </article>
                );
              })}
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center gap-8 lg:mt-16">
          <div className="flex w-full items-center justify-start gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:w-auto lg:justify-center lg:overflow-visible">
            {cultureFilters.map((filter) => (
              <Link
                key={filter.label}
                href={filter.href}
                className={`inline-flex h-[33px] shrink-0 items-center rounded-full bg-white/10 px-4 font-body text-[10px] font-semibold uppercase leading-[1.5] ${
                  "accent" in filter && filter.accent
                    ? "border border-[#C6A15B] text-[#C6A15B]"
                    : "border border-white/20 text-white"
                }`}
              >
                {filter.label}
              </Link>
            ))}
          </div>

          <Link
            href="/wire-wheels"
            className="inline-flex w-full items-center justify-center border border-white/30 px-12 py-4 font-body text-[12px] font-bold uppercase leading-[1.33] tracking-[0.1em] text-white lg:w-auto"
          >
            Explore The Collection
            <span className="ml-2 lg:hidden" aria-hidden>
              →
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
