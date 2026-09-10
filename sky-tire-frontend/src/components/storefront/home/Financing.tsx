import Image from "next/image";
import Link from "next/link";
import { financingOptions } from "@/lib/storefront/content";

export default function Financing() {
  return (
    <section id="financing" className="bg-[#0B0B0C] py-10 lg:py-24">
      <div className="mx-auto w-full max-w-[1280px] px-5 lg:px-4">
        <div className="flex flex-col items-center text-center">
          <h2 className="font-display text-[30px] uppercase leading-none tracking-[-0.025em] text-white lg:whitespace-nowrap lg:text-[72px] lg:tracking-normal">
            Love the look.
            <br className="lg:hidden" /> Love the payment.
          </h2>
          <p className="mt-4 font-display text-[20px] uppercase italic leading-none tracking-[0.025em] text-[#D4AF37] lg:hidden">
            Build Now. Pay Later.
          </p>
          <p className="mt-4 hidden font-body text-[14px] font-bold uppercase italic leading-[1.43] tracking-[0.2em] text-[#D4AF37] lg:block">
            Build Now. Pay Later.
          </p>
          <p className="mt-4 max-w-[672px] font-body text-[14px] leading-[1.5] text-[#9CA3AF] lg:text-[20px] lg:leading-[1.4] lg:tracking-[-0.002em]">
            Get your ride sitting right today with flexible financing options that fit your budget.
          </p>
        </div>

        <div className="mx-auto mt-8 grid max-w-[400px] gap-4 lg:mt-16 lg:max-w-[1248px] lg:grid-cols-3 lg:gap-6">
          {financingOptions.map((option) => (
            <article
              key={option.name}
              className={`relative mx-auto flex h-auto w-full max-w-[400px] flex-col items-center rounded-lg bg-white px-7 py-7 text-center lg:h-[360px] lg:px-10 lg:py-10 ${
                option.featured
                  ? "border-2 border-[#D4AF37] shadow-[0px_8px_24px_0px_rgba(0,0,0,0.12)]"
                  : "border border-[#E6E7E9]"
              }`}
            >
              {option.badge ? (
                <span className="absolute right-4 top-4 rounded-[2px] bg-[#D4AF37] px-2 py-1 font-body text-[10px] font-bold leading-[1.5] tracking-[0.1em] text-white lg:right-10 lg:top-10">
                  {option.badge}
                </span>
              ) : null}

              <div className="flex min-h-[120px] w-full flex-1 items-center justify-center">
                <Image
                  src={option.image}
                  alt={option.name}
                  width={option.logoWidth}
                  height={option.logoHeight}
                  className="object-contain"
                  style={{
                    width: option.logoWidth,
                    height: option.logoHeight,
                    maxWidth: "100%",
                    maxHeight: option.name === "PayTomorrow" ? 168 : option.logoHeight,
                  }}
                />
              </div>

              <div className="mt-4 flex w-full flex-col items-center lg:mt-0">
                <h3 className="font-body text-[18px] font-bold leading-[1.56] tracking-[0.003em] text-[#1A1B1E]">
                  {option.title}
                </h3>
                <p className="mt-2 font-body text-[14px] leading-[1.625] text-[#4B5563]">{option.body}</p>
                <Link
                  href={option.href}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex border-b border-[#D4AF37] pb-px font-body text-[12px] font-bold uppercase leading-[1.33] tracking-[0.05em] text-[#D4AF37] lg:text-[13px] lg:leading-[1.5] lg:tracking-[0.1em]"
                >
                  {option.cta}
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center gap-3 lg:mt-16">
          <Link
            href="/#vehicle-finder"
            className="inline-flex h-[52px] w-full max-w-[350px] items-center justify-center rounded bg-white px-6 font-body text-[15px] font-semibold uppercase tracking-[0.025em] text-[#0B0B0C] lg:h-[60px] lg:w-auto lg:max-w-none lg:rounded-none lg:px-12 lg:text-[14px] lg:font-bold lg:tracking-[0.1em]"
          >
            Check Your Eligibility
          </Link>
          <p className="font-body text-[11px] font-semibold uppercase leading-[1.5] tracking-[0.15em] text-[#C9CDD1] lg:hidden">
            No impact to your credit to apply.
          </p>
        </div>
      </div>
    </section>
  );
}
