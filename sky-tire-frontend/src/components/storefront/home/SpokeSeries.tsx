import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/storefront/Icon";
import { finishes, spokeOptions } from "@/lib/storefront/content";

const mobileFinishes = finishes.filter((finish) => finish.name !== "Neon");

export default function SpokeSeries() {
  return (
    <section className="bg-[#0B0B0C] text-white">
      <div className="px-6 py-16 lg:hidden">
        <div className="flex flex-col gap-2">
          <p className="font-body text-[11px] font-bold uppercase leading-[1.5] tracking-[0.1em] text-[#C6A15B]">
            The Wire Wheel Collection
          </p>
          <h2 className="font-display text-[26px] uppercase leading-[1.08] text-white">
            Heavy-Duty Spoke Configurations
          </h2>
          <p className="pt-2 font-body text-[15px] leading-[1.47] text-[#C9CDD1]">
            72, 100, 150 & 204 Spoke Patterns in Direct-Bolt or Knock-Off
            Spinners. Engineered for Classic Impalas, Cadillacs, Buicks & Custom
            Builds.
          </p>
          <div className="flex gap-2 pt-4">
            {spokeOptions.map((spoke) => {
              const selected = spoke.count === "100";
              return (
                <Link
                  key={spoke.count}
                  href={`/wire-wheels?spoke=${spoke.count}`}
                  className={`flex h-[34px] flex-1 items-center justify-center rounded font-body text-[13px] uppercase leading-[1.5] ${
                    selected
                      ? "bg-white font-bold tracking-[-0.01em] text-[#0B0B0C]"
                      : "border border-[#C9CDD1] tracking-[0.03em] text-[#C9CDD1]"
                  }`}
                >
                  {spoke.count}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4">
          <h3 className="font-display text-[26px] uppercase leading-[1.08] text-white">
            Head-Turning Custom Finishes
          </h3>
          <p className="pb-2 font-body text-[15px] leading-[1.47] text-[#C9CDD1]">
            From Classic Triple Chrome & All-Gold to Exclusive Neo-Chrome
            Chameleon & Rose Gold.
          </p>
          <p className="border-t border-[#C6A15B]/30 pt-6 font-body text-[11px] font-bold uppercase leading-[1.5] tracking-[0.1em] text-[#C6A15B]">
            Guaranteed Bolt-On Fitment • Precision Balanced
          </p>
        </div>

        <div className="mt-12 flex flex-col gap-6">
          <h3 className="font-display text-[20px] uppercase leading-[1.4] text-[#C6A15B]">
            Find Your Finish
          </h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8">
            {mobileFinishes.map((finish) => {
              const selected = finish.name === "Chrome";
              return (
                <Link
                  key={finish.name}
                  href={`/wire-wheels?finish=${encodeURIComponent(finish.name)}`}
                  className={`flex flex-col items-center ${selected ? "" : "opacity-60"}`}
                >
                  <span className="flex aspect-square w-full items-center justify-center rounded-lg border border-[#C9CDD1]/10 bg-[#202124] p-4">
                    <span className="relative block aspect-square w-full overflow-hidden">
                      <Image
                        src={finish.image}
                        alt={`${finish.name} wire wheel finish`}
                        fill
                        className="object-contain"
                        sizes="140px"
                      />
                    </span>
                  </span>
                  <span
                    className={`mt-3 pb-1 font-body text-[11px] font-bold uppercase leading-[1.5] tracking-[0.1em] text-white ${
                      selected ? "border-b border-[#C6A15B]" : ""
                    }`}
                  >
                    {finish.name}
                  </span>
                </Link>
              );
            })}
          </div>
          <Link
            href="/wire-wheels"
            className="inline-flex h-[52px] items-center justify-center rounded bg-white font-body text-[15px] font-semibold uppercase leading-[1.5] text-[#0B0B0C]"
          >
            Shop All Wire Wheels
          </Link>
        </div>
      </div>

      <div className="hidden py-24 lg:block">
        <div className="mx-auto w-full max-w-[1280px] px-6">
          <p className="font-body text-[11px] font-bold uppercase leading-[1.5] tracking-[0.1em] text-[#C6A15B]">
            The Wire Wheel Collection
          </p>
          <h2 className="mt-12 font-display text-[36px] uppercase leading-none text-white lg:text-[60px]">
            Heavy-Duty Spoke Configurations
          </h2>

          <div className="mt-12 grid gap-12 lg:grid-cols-2 lg:gap-24">
            <div>
              <p className="font-body text-[12px] font-bold uppercase leading-[1.33] tracking-[0.1em] text-[#C6A15B]">
                Choose Your Spoke Count
              </p>
              <div className="mt-6 flex flex-col gap-4">
                {spokeOptions.map((spoke) => (
                  <Link
                    key={spoke.count}
                    href={`/wire-wheels?spoke=${spoke.count}`}
                    className="flex items-center justify-between border-b border-white/10 pb-4"
                  >
                    <span className="font-display text-[24px] uppercase leading-[1.33] tracking-[0.05em] text-white">
                      {spoke.label}
                    </span>
                    <Icon
                      name="chevron-down"
                      alt=""
                      size={12}
                      className="-rotate-90"
                    />
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <h3 className="font-display text-[26px] uppercase leading-[1.08] text-white">
                Head-Turning Custom Finishes
              </h3>
              <p className="font-body text-[14px] leading-[1.625] text-white/40">
                From classic triple-plated chrome to 24K real gold plating, our artisans
                hand-craft each finish to ensure a mirror-like shine that lasts for years.
              </p>
              <p className="font-body text-[11px] font-bold uppercase leading-[1.5] tracking-[0.1em] text-[#C6A15B]">
                Guaranteed Bolt-On Fitment • Precision
                <br />
                Balanced
              </p>
            </div>
          </div>

          <div className="mt-16">
            <p className="text-center font-body text-[10px] font-bold uppercase leading-[1.5] tracking-[0.4em] text-white/40">
              Find Your Finish
            </p>
            <div className="mt-10 flex gap-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:grid lg:grid-cols-5 lg:overflow-visible">
              {finishes.map((finish) => {
                const selected = finish.name === "Chrome";
                return (
                  <Link
                    key={finish.name}
                    href={`/wire-wheels?finish=${encodeURIComponent(finish.name)}`}
                    className={`flex h-[174px] w-[234px] shrink-0 flex-col items-center gap-[15px] px-4 pt-[17px] lg:w-auto ${
                      selected
                        ? "border border-[#C6A15B] bg-white/5"
                        : "border border-white/10"
                    }`}
                  >
                    <span className="relative block h-24 w-24 overflow-hidden bg-white">
                      <Image
                        src={finish.image}
                        alt={`${finish.name} wire wheel finish`}
                        fill
                        className="object-contain"
                        sizes="96px"
                      />
                    </span>
                    <span
                      className={`font-display text-[18px] uppercase leading-[1.56] tracking-[0.1em] ${
                        selected ? "text-white" : "text-white/60"
                      }`}
                    >
                      {finish.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="mt-16 flex justify-center">
            <Link
              href="/wire-wheels"
              className="inline-flex items-center justify-center whitespace-nowrap bg-white px-8 py-5 font-display text-[20px] uppercase leading-[1.33] tracking-[0.2em] text-[#0B0B0C] lg:px-16 lg:text-[24px]"
            >
              Explore All Wire Wheels
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
