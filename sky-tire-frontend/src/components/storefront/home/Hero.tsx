import Image from "next/image";
import Link from "next/link";
import type { BannerData } from "@/lib/bannerValidation";
import DealCountdown from "@/components/storefront/home/DealCountdown";
import Icon from "@/components/storefront/Icon";
import TrustBar from "@/components/storefront/home/TrustBar";
import { IMG, heroCtas } from "@/lib/storefront/content";

const mobileCtas = [
  {
    href: "/wire-wheels",
    title: "Wire Wheels",
    icon: "logo-mark",
    accent: true,
  },
  {
    href: "/wheels",
    title: "Wheels",
    icon: "hero-rim",
    accent: false,
  },
  {
    href: "/products",
    title: "Tires",
    icon: "hero-tire",
    accent: false,
  },
  {
    href: "/accessories",
    title: "Lowrider Accessories",
    icon: "hero-wrench",
    accent: false,
  },
] as const;

export default function Hero({ banner }: { banner: BannerData }) {
  return (
    <section className="relative isolate overflow-hidden bg-[#0B0B0C]">
      <div className="relative min-h-[788px] lg:hidden">
        <div className="absolute inset-0 overflow-hidden">
          {/* Full-res photo so the mobile crop stays sharp. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${IMG}/hero.png`}
            alt="Gold wire wheel and whitewall tire on a classic lowrider"
            className="hero-mobile-bg"
          />
        </div>
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(0deg,rgba(11,11,12,1)_0%,rgba(11,11,12,0.6)_50%,rgba(11,11,12,0)_100%)]"
        />

        <div className="absolute inset-x-0 top-0 z-10">
          <TrustBar />
        </div>

        <div className="relative flex min-h-[788px] flex-col justify-end px-6 pb-12 pt-28">
          <h1 className="font-display text-[44px] uppercase leading-none tracking-[-0.025em] text-white">
            Built for the
            <br />
            Boulevard
          </h1>
          <p className="mt-2 font-display text-[24px] uppercase leading-[1.33] tracking-[0.025em] text-white">
            Wire Wheels. Whitewall Tires.
            <br />
            Lowrider Culture.
          </p>
          <p className="mt-[7px] font-body text-[15px] leading-[1.5] text-white">
            Build the look. Own the Boulevard.
          </p>

          <div className="mt-8 flex w-full flex-col gap-[5px]">
            {mobileCtas.map((cta) => (
              <Link
                key={cta.href}
                href={cta.href}
                className={`flex h-[61px] items-center rounded-[10px] border border-[rgba(201,205,209,0.18)] px-5 shadow-[0px_4px_16px_0px_rgba(0,0,0,0.35)] ${
                  cta.accent ? "bg-[#26282C]" : "bg-[#202124]"
                }`}
              >
                <span
                  className={`mr-4 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border ${
                    cta.accent ? "border-[#C6A15B]" : "border-white/35"
                  }`}
                >
                  <Icon name={cta.icon} alt="" size={20} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-body text-[10px] uppercase leading-[1.5] tracking-[0.05em] text-[#C9CDD1]">
                    Shop
                  </span>
                  <span className="-mt-px font-body text-[17px] font-semibold uppercase leading-[1.5] text-white">
                    {cta.title}
                  </span>
                </span>
                <Icon name="chevron-down" alt="" size={12} className="shrink-0 opacity-80" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="relative hidden min-h-[760px] lg:block">
        <Image
          src={`${IMG}/hero.png`}
          alt="Gold wire wheel and whitewall tire on a classic lowrider"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[42%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/15 to-transparent" />

        <div className="relative mx-auto flex min-h-[760px] w-full max-w-[1280px] flex-row items-start justify-between px-6 pb-16 pt-10">
          <div className="w-full max-w-[600px]">
            <h1 className="font-display text-[84px] uppercase leading-[0.9] text-white">
              Built for the
              <br />
              Boulevard.
            </h1>
            <p className="mt-6 font-display text-[22px] uppercase leading-[1.5] tracking-[0.1em] text-white">
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
                    <span className="font-body text-[18px] font-bold uppercase tracking-[0.05em] text-white">
                      {cta.label}
                    </span>
                  </span>
                  <Icon name="chevron-down" alt="" size={16} />
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-40">
            <DealCountdown banner={banner} />
          </div>
        </div>
      </div>
    </section>
  );
}
