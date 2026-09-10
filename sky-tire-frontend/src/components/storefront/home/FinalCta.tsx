import Image from "next/image";
import Link from "next/link";
import { IMG, finalCtas } from "@/lib/storefront/content";

export default function FinalCta() {
  return (
    <section className="relative isolate h-[492px] overflow-hidden bg-[#0B0B0C] text-white lg:h-[520px]">
      <Image
        src={`${IMG}/cta-mobile.png`}
        alt="Classic lowrider at sunset"
        fill
        sizes="100vw"
        className="object-cover object-center lg:hidden"
      />
      <Image
        src={`${IMG}/cta-desktop.png`}
        alt="Classic lowrider at golden hour"
        fill
        sizes="100vw"
        className="hidden object-cover object-center lg:block"
      />
      <div className="absolute inset-0 bg-[#0B0B0C]/80 lg:hidden" />

      <div className="relative z-10 mx-auto flex h-full w-full max-w-[1440px] flex-col items-center justify-center px-8 text-center lg:px-16">
        <div className="flex w-full flex-col items-center gap-10 lg:gap-[23px]">
          <h2 className="font-display text-[60px] uppercase leading-[1.25] text-white lg:text-[100px] lg:leading-[0.9] lg:tracking-[-0.025em]">
            Your build
            <br />
            starts here.
          </h2>
          <p className="hidden font-body text-[17px] font-bold leading-[1.625] text-white lg:block">
            Wire wheels, whitewalls and everything between.
          </p>
          <div className="flex w-full flex-col gap-4 lg:w-auto lg:flex-row lg:justify-center lg:pt-[25px]">
            {finalCtas.map((cta, index) => (
              <Link
                key={cta.label}
                href={cta.href}
                className={`inline-flex w-full items-center justify-center py-5 font-display text-[20px] uppercase leading-[1.4] text-[#0B0B0C] lg:w-[300px] lg:font-body lg:text-[14px] lg:font-bold lg:leading-[1.43] lg:tracking-[0.1em] ${
                  index === 1
                    ? "border border-white bg-transparent text-white lg:border-0 lg:bg-white lg:text-[#0B0B0C]"
                    : "bg-white"
                }`}
              >
                {cta.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
