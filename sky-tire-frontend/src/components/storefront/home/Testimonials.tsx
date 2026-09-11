import Image from "next/image";
import Container from "@/components/storefront/Container";
import Icon from "@/components/storefront/Icon";
import { testimonials } from "@/lib/storefront/content";

function StarRow({ size, className = "" }: { size: number; className?: string }) {
  return (
    <div className={`flex items-center ${className}`} aria-hidden>
      {Array.from({ length: 5 }).map((_, index) => (
        <Icon key={index} name="star" alt="" size={size} />
      ))}
    </div>
  );
}

function ReviewCard({
  item,
  desktop = false,
}: {
  item: (typeof testimonials)[number];
  desktop?: boolean;
}) {
  if (desktop) {
    return (
      <article className="relative rounded-lg border border-[#E6E7E9] bg-white p-6 lg:p-[33px]">
        <div className="flex items-center gap-4 pr-16">
          <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full lg:h-12 lg:w-12">
            <Image src={item.image} alt="" fill className="object-cover" sizes="48px" />
          </span>
          <p className="font-body text-[16px] font-bold uppercase tracking-[0.05em] text-black lg:font-semibold lg:leading-[1.5]">
            {item.name}
          </p>
        </div>
        <span className="absolute right-6 top-6 rounded bg-[#1D2E1F] px-2 py-[2.5px] text-[9px] font-bold uppercase leading-[1.5] tracking-[0.1em] text-[#4ADE80] lg:right-[33px] lg:top-[38px]">
          Verified
        </span>
        <StarRow size={14} className="mt-6" />
        <p className="mt-6 font-body text-[16px] italic leading-[1.5] text-black lg:leading-[1.625]">
          “{item.quote}”
        </p>
        <p className="mt-6 font-body text-[16px] uppercase leading-[1.5] tracking-[0.1em] text-black">
          {item.purchase}
        </p>
      </article>
    );
  }

  return (
    <article className="relative rounded-lg border border-[#E6E7E9] bg-white p-6">
      <div className="flex items-center gap-4 pr-16">
        <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
          <Image src={item.image} alt="" fill className="object-cover" sizes="40px" />
        </span>
        <p className="font-body text-[16px] font-bold uppercase tracking-[0.05em] text-black">
          {item.name}
        </p>
      </div>
      <span className="absolute right-6 top-6 rounded bg-[#1D2E1F] px-2 py-[2.5px] text-[9px] font-bold uppercase leading-[1.5] tracking-[0.1em] text-[#4ADE80]">
        Verified
      </span>
      <StarRow size={14} className="mt-6" />
      <p className="mt-6 font-body text-[16px] italic leading-[1.5] text-black">
        “{item.quote}”
      </p>
      <p className="mt-6 font-body text-[16px] uppercase leading-[1.5] tracking-[0.1em] text-black">
        {item.purchase}
      </p>
    </article>
  );
}

export default function Testimonials() {
  return (
    <section className="bg-[#202124] py-16 text-white lg:py-[120px]">
      <Container>
        <div className="flex flex-col items-center text-center">
          <h2 className="font-display text-[48px] uppercase leading-none text-white lg:leading-[0.833] lg:tracking-[0.075em]">
            What our customers say
          </h2>
          <div className="mt-6 flex flex-col items-center gap-2 lg:mt-6">
            <StarRow size={18} />
            <p className="font-body text-[14px] leading-[1.43] text-[#A6A6A6]">
              <span className="text-[24px] font-bold leading-[1.33] tracking-[0.008em] text-white">4.9</span>
              <span className="ml-3">Based on 1,240 verified reviews</span>
            </p>
          </div>
        </div>

        <div
          className="testimonial-slider mt-10 lg:hidden"
          aria-roledescription="carousel"
          aria-label="Customer reviews"
        >
          <div className="overflow-hidden">
            <div className="testimonial-track flex">
              {testimonials.map((item) => (
                <div key={item.name} className="w-full min-w-full shrink-0">
                  <ReviewCard item={item} />
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 flex items-center justify-center gap-2" aria-hidden>
            {testimonials.map((item) => (
              <span key={item.name} className="testimonial-dot h-2 w-2 rounded-full bg-white/30" />
            ))}
          </div>
        </div>

        <div className="mt-10 hidden gap-6 lg:mt-16 lg:grid lg:grid-cols-3">
          {testimonials.map((item) => (
            <ReviewCard key={item.name} item={item} desktop />
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <a
            href="https://www.google.com/search?q=Sky+Tire+reviews"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-12 w-full max-w-[291px] items-center justify-center gap-3 rounded-full border border-white bg-black px-6 font-body text-[12px] font-bold uppercase tracking-[0.1em] text-white"
          >
            <span
              className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-[13px] font-bold leading-none text-[#0B0B0C]"
              aria-hidden
            >
              G
            </span>
            Review us
          </a>
        </div>
      </Container>
    </section>
  );
}
