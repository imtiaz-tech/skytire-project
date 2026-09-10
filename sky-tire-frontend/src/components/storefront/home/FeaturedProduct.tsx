import Image from "next/image";
import Link from "next/link";
import Container from "@/components/storefront/Container";
import Icon from "@/components/storefront/Icon";
import { IMG } from "@/lib/storefront/content";
import type { CatalogProduct } from "@/lib/storefront/catalog";

function WheelImage({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-[#F9F9F9] shadow-[0px_25px_25px_0px_rgba(0,0,0,0.15)] ${className}`}
    >
      <Image
        src={`${IMG}/featured-wheel.png`}
        alt="13×7 Reverse 100 Spoke Neo Chrome wire wheel"
        fill
        className="object-contain p-6 lg:p-12"
        sizes="(min-width: 1024px) 632px, 100vw"
      />
    </div>
  );
}

export default function FeaturedProduct({ product: _product }: { product: CatalogProduct | null }) {
  return (
    <section className="border-t border-[#E6E7E9] bg-white py-16 lg:py-[120px]">
      <div className="px-5 lg:hidden">
        <h2 className="font-display text-[30px] uppercase leading-none tracking-[-0.025em] text-black">
          Featured Products
        </h2>

        <p className="mt-[23px] font-body text-[11px] font-bold uppercase leading-[1.5] tracking-[0.2em] text-[#C6A15B]">
          The Wheel Wheel
        </p>
        <h3 className="mt-1 font-display text-[48px] uppercase leading-none tracking-[-0.02em] text-[#0B0B0C]">
          100 Spokes. Infinite Color.
        </h3>

        <div className="relative mt-[23px] h-[333px] w-full">
          <Image
            src={`${IMG}/featured-wheel.png`}
            alt="13×7 Reverse 100 Spoke Neo Chrome wire wheel"
            fill
            className="object-contain"
            sizes="100vw"
          />
        </div>

        <div className="mt-[23px] flex flex-col gap-2">
          <h4 className="font-body text-[17px] font-semibold leading-[1.5] text-[#0B0B0C]">
            13×7 Reverse 100 Spoke Neo Chrome
          </h4>
          <p className="font-body text-[12px] leading-[1.33] tracking-[0.025em] text-[#6B6B6E]">
            6061-T6 Forged Aluminum • Mirror Polished
          </p>

          <div className="flex items-center gap-2 pt-1">
            <div className="flex items-center" aria-hidden>
              {Array.from({ length: 4 }).map((_, index) => (
                <Icon key={index} name="star" alt="" size={12} />
              ))}
              <Icon name="star" alt="" size={12} className="opacity-25" />
            </div>
            <p className="font-body text-[11px] font-medium leading-[1.5] text-[#6B6B6E]">(29 Reviews)</p>
          </div>

          <p className="flex items-baseline gap-3 pt-2 font-body">
            <span className="text-[22px] font-bold leading-[1.5] tracking-[-0.003em] text-[#0B0B0C]">
              From $1,899.00
            </span>
            <span className="text-[12px] leading-[1.5] tracking-[0.013em] text-[#6B6B6E]">/ each</span>
          </p>

          <div className="flex items-center gap-3 pt-1">
            <span className="inline-flex items-center gap-1.5 font-body text-[10px] font-bold uppercase leading-[1.5] tracking-[0.05em] text-[#0B0B0C]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#1E8E4A]" aria-hidden />
              In Stock
            </span>
            <span className="h-3 w-px bg-[#E5E7EB]" aria-hidden />
            <span className="font-body text-[10px] font-bold uppercase leading-[1.5] tracking-[0.05em] text-[#0B0B0C]">
              Free Shipping
            </span>
          </div>

          <p className="pt-2 font-body text-[11px] leading-[1.5] text-[#6B6B6E]">
            Fits: Chevrolet • Impala • Caprice
          </p>

          <Link
            href="/#vehicle-finder"
            className="mt-4 inline-flex h-[52px] w-full items-center justify-center rounded border-0 bg-[#0B0B0C] font-body text-[15px] font-semibold uppercase leading-[1.5] tracking-[0.05em] text-white"
          >
            Configure Fitment
          </Link>

          <Link
            href="/wheels"
            className="mt-[15px] inline-flex items-center justify-center font-body text-[13px] font-semibold leading-[1.5] text-[#C6A15B]"
          >
            Shop all billet wheels →
          </Link>
        </div>
      </div>

      <div className="hidden lg:block">
        <Container>
          <h2 className="hidden font-body text-[36px] font-bold uppercase leading-[1.11] tracking-[-0.025em] text-[#0B0B0C] lg:block">
            Featured Products
          </h2>

          <div className="mt-6 grid items-center gap-6 lg:mt-16 lg:grid-cols-2 lg:gap-12">
            <div>
              <p className="font-body text-[11px] font-bold uppercase leading-[1.5] tracking-[0.2em] text-[#D4AF37]">
                The Wire Wheel
              </p>
              <h3 className="mt-3 hidden font-body text-[44px] font-bold uppercase leading-none text-[#0B0B0C] lg:block">
                100 Spokes.
                <br />
                Infinite Color.
              </h3>

              <h4 className="mt-6 font-body text-[17px] font-semibold leading-[1.5] text-[#0B0B0C] lg:mt-7 lg:text-[22px]">
                13×7 Reverse 100 Spoke Neo Chrome
              </h4>
              <p className="mt-1 font-body text-[12px] leading-[1.33] tracking-[0.025em] text-[#6B6B6E] lg:text-[14px] lg:leading-[1.43] lg:tracking-normal">
                6061-T6 Forged Aluminum • Mirror Polished
              </p>

              <div className="mt-5 flex items-center gap-2 lg:mt-5">
                <div className="flex items-center" aria-hidden>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Icon key={index} name="star" alt="" size={16} />
                  ))}
                </div>
                <p className="font-body text-[11px] font-medium leading-[1.5] text-[#6B6B6E] lg:text-[14px] lg:font-normal lg:leading-[1.43]">
                  (29 Reviews)
                </p>
              </div>

              <p className="mt-7 flex flex-wrap items-baseline gap-2 font-body lg:gap-2">
                <span className="text-[18px] leading-[1.56] tracking-[0.014em] text-[#6B6B6E]">From</span>
                <span className="text-[22px] font-bold leading-[1.5] tracking-[-0.003em] text-[#0B0B0C] lg:text-[34px]">
                  $1,899.00
                </span>
                <span className="text-[12px] leading-[1.5] tracking-[0.013em] text-[#6B6B6E] lg:text-[14px] lg:leading-[1.43]">
                  / each
                </span>
              </p>

              <div className="mt-7 flex items-center gap-3 lg:gap-8">
                <span className="inline-flex items-center gap-2 font-body text-[10px] font-bold uppercase leading-[1.5] tracking-[0.05em] text-[#0B0B0C] lg:text-[11px]">
                  <span className="h-2 w-2 rounded-full bg-[#22C55E]" aria-hidden />
                  In Stock
                </span>
                <span className="inline-flex items-center gap-2 font-body text-[10px] font-bold uppercase leading-[1.5] tracking-[0.05em] text-[#0B0B0C] lg:text-[11px]">
                  <span className="h-2 w-2 rounded-full bg-[#22C55E]" aria-hidden />
                  Free Shipping
                </span>
              </div>

              <p className="mt-6 font-body text-[11px] leading-[1.5] text-[#6B6B6E] lg:mt-9 lg:text-[13px]">
                Fits: Chevrolet • Impala • Caprice
              </p>

              <Link
                href="/#vehicle-finder"
                className="mt-12 flex w-[320px] items-center justify-center bg-[#0B0B0C] py-4 font-body text-[14px] font-bold uppercase leading-[1.43] tracking-[0.1em] text-white"
              >
                Configure Fitment
              </Link>

              <Link
                href="/wheels"
                className="mt-6 inline-flex items-center border-b border-[#D4AF37] pb-0.5 font-body text-[13px] font-semibold uppercase leading-[1.5] tracking-[0.1em] text-[#D4AF37] lg:mt-8"
              >
                Shop all billet wheels →
              </Link>
            </div>

            <WheelImage className="hidden h-[600px] lg:block" />
          </div>
        </Container>
      </div>
    </section>
  );
}
