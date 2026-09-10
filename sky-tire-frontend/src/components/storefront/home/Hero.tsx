import Image from "next/image";
import Link from "next/link";
import type { BannerData } from "@/lib/bannerValidation";
import DealCountdown from "@/components/storefront/home/DealCountdown";
import Icon from "@/components/storefront/Icon";
import TrustBar from "@/components/storefront/home/TrustBar";
import { IMG, heroCtas } from "@/lib/storefront/content";

export default function Hero({ banner }: { banner: BannerData }) {
  return (
    <section className="relative isolate min-h-[640px] overflow-hidden bg-[#0B0B0C] lg:min-h-[760px]">
      <Image
        src={`${IMG}/hero.png`}
        alt="Gold wire wheel and whitewall tire on a classic lowrider"
        fill
        priority
        sizes="100vw"
        className="object-cover object-[center_40%] lg:object-[42%_center]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0C]/80 via-[#0B0B0C]/25 to-transparent lg:bg-gradient-to-r lg:from-black/50 lg:via-black/15 lg:to-transparent" />

      <div className="absolute inset-x-0 top-0 z-10 lg:hidden">
        <TrustBar />
      </div>

      <div className="relative mx-auto flex min-h-[640px] w-full max-w-[1280px] flex-col justify-end px-5 pb-10 pt-28 sm:px-6 lg:min-h-[760px] lg:flex-row lg:items-start lg:justify-between lg:px-6 lg:pb-16 lg:pt-10">
        <div className="w-full max-w-[600px]">
          <h1 className="font-display text-[44px] uppercase leading-none tracking-[-0.025em] text-white lg:text-[84px] lg:leading-[0.9] lg:tracking-normal">
            Built for the
            <br />
            Boulevard.
          </h1>
          <p className="mt-6 font-display text-[18px] uppercase leading-[1.5] tracking-[0.1em] text-white lg:text-[22px]">
            Wire Wheels. Whitewall Tires. Lowrider Culture.
          </p>
          <p className="mt-2 font-body text-[15px] font-bold leading-[1.5] text-white/90">
            Build the look. Own the boulevard.
          </p>

          <div className="mt-8 flex w-full max-w-[469px] flex-col gap-[15px]">
            {heroCtas.map((cta, index) => (
              <Link
                key={cta.href}
                href={cta.href}
                className={`flex h-[67px] items-center justify-between bg-[rgba(32,33,36,0.92)] px-6 ${
                  index === 0 ? "border-l-[3px] border-[#C6A15B]" : ""
                }`}
              >
                <span className="flex items-center gap-4">
                  <Icon name={cta.icon} alt="" size={24} />
                  <span className="font-body text-[16px] font-bold uppercase tracking-[0.05em] text-white lg:text-[18px]">
                    {cta.label}
                  </span>
                </span>
                <Icon name="chevron-down" alt="" size={16} />
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-8 hidden lg:mt-40 lg:block">
          <DealCountdown banner={banner} />
        </div>
      </div>
    </section>
  );
}
