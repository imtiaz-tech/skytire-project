import Image from "next/image";
import Link from "next/link";
import { IMG } from "@/lib/storefront/content";

export default function LegacySeries() {
  return (
    <section className="bg-[#0B0B0C] text-white">
      <div className="flex flex-col lg:h-[626px] lg:flex-row lg:items-center">
        <div className="relative aspect-[616/626] w-full overflow-hidden lg:h-full lg:w-[616px] lg:shrink-0 lg:aspect-auto">
          <Image
            src={`${IMG}/whitewall-banner.png`}
            alt="Classic whitewall tire on a chrome wire wheel"
            fill
            className="object-cover object-center lg:object-[68%_46%]"
            sizes="(min-width: 1024px) 616px, 100vw"
          />
        </div>

        <div className="flex flex-1 items-center px-5 py-12 lg:px-20 lg:pr-32 lg:py-0">
          <div className="w-full max-w-[512px]">
            <p className="font-body text-[12px] font-bold uppercase leading-[1.33] tracking-[0.3em] text-[#C6A15B]">
              The Original Whitewall Tires
            </p>
            <h2 className="mt-4 font-display text-[48px] uppercase leading-none text-white lg:text-[72px]">
              The look that
              <br />
              never left.
            </h2>
            <p className="mt-6 font-body text-[16px] leading-[1.625] text-[#C9CDD1] lg:text-[18px]">
              Authentic whitewall styling for classic cars, lowriders and custom
              builds.
            </p>
            <p className="mt-4 font-body text-[16px] font-medium italic leading-[1.5] text-[#C6A15B]">
              Factory-produced white sidewalls — not painted, shaved or
              artificially added.
            </p>
            <div className="mt-8 flex flex-col items-stretch gap-6 lg:flex-row lg:flex-wrap lg:items-center lg:gap-x-8 lg:gap-y-4">
              <Link
                href="/products?sidewall=WHITE_WALL"
                className="inline-flex h-[52px] w-full items-center justify-center bg-white px-10 font-body text-[14px] font-bold uppercase leading-[1.43] tracking-[0.1em] text-[#0B0B0C] lg:w-auto"
              >
                Shop Original Whitewalls
              </Link>
              <Link
                href="/#vehicle-finder"
                className="text-center font-body text-[12px] font-bold uppercase leading-[1.33] tracking-[0.1em] text-[#C6A15B] lg:text-left"
              >
                Find Your Size →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
