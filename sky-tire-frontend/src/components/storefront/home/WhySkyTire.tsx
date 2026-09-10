import Image from "next/image";
import { ICO, IMG, whySkyTire } from "@/lib/storefront/content";

export default function WhySkyTire() {
  return (
    <section className="bg-[#0B0B0C] py-16 lg:py-24">
      <div className="mx-auto w-full max-w-[1280px] px-5 lg:px-4">
        <h2 className="text-center font-display text-[48px] uppercase leading-none text-white lg:text-[60px]">
          Why Sky Tire
        </h2>

        <div className="relative mx-auto mt-8 max-w-[1024px] border-y border-[#C6A15B]/20 px-6 py-8 lg:mt-12 lg:px-16">
          <span className="absolute left-1/2 top-0 h-8 w-px -translate-x-1/2 -translate-y-1/2 bg-[#C6A15B]" aria-hidden />
          <p className="text-center font-display text-[24px] uppercase leading-[1.25] tracking-[0.025em] text-white lg:text-[36px] lg:tracking-normal">
            We aren&apos;t just a tire shop. We are the{" "}
            <span className="text-[#D4AF37]">custodians</span> of a culture that demands
            perfection in every rotation.
          </p>
          <span className="absolute bottom-0 left-1/2 h-8 w-px -translate-x-1/2 translate-y-1/2 bg-[#C6A15B]" aria-hidden />
        </div>

        <div className="mt-16 grid gap-10 sm:grid-cols-2 lg:mt-20 lg:grid-cols-3 lg:gap-x-12 lg:gap-y-16">
          {whySkyTire.map((item) => (
            <article key={item.title} className="flex flex-col items-center text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${ICO}/${item.icon}.svg`} alt="" className="h-[30px] w-auto" />
              <h3 className="mt-4 font-body text-[14px] font-bold uppercase leading-[1.43] tracking-[0.1em] text-white">
                {item.title}
              </h3>
              <p className="mt-2 max-w-[385px] font-body text-[12px] leading-[1.33] text-[#9CA3AF] lg:text-[14px] lg:leading-[1.625]">
                {item.body}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-center gap-6 lg:mt-20 lg:gap-10">
          <Image
            src={`${IMG}/badge-bbb.png`}
            alt="BBB Accredited Business"
            width={160}
            height={28}
            className="h-7 w-auto object-contain"
          />
          <div className="flex h-[29px] items-center gap-2 rounded-[2px] bg-white px-3">
            <Image src={`${IMG}/badge-1.png`} alt="" width={16} height={16} className="h-4 w-4 object-contain" />
            <span className="font-body text-[10px] font-bold leading-[1.5] tracking-[0.007em] text-[#0B0B0C]">
              4.9 / 5.0
            </span>
          </div>
          <Image
            src={`${IMG}/badge-2.png`}
            alt="eBay Top Rated Seller"
            width={67}
            height={29}
            className="h-[29px] w-auto object-contain"
          />
        </div>
      </div>
    </section>
  );
}
