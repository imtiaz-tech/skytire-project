import Image from "next/image";
import Link from "next/link";
import Container from "@/components/storefront/Container";
import { whyChooseCards } from "@/lib/storefront/content";

export default function WhyChoose() {
  return (
    <section>
      <div className="bg-[#0B0B0C] py-16 lg:py-[60px]">
        <Container>
          <p className="font-body text-[11px] font-bold uppercase leading-[1.5] tracking-[0.2em] text-[#D4AF37] lg:tracking-[0.2em]">
            Why choose Sky Tire
          </p>
          <h2 className="mt-4 font-display text-[36px] uppercase leading-[0.9] tracking-[-0.025em] text-white lg:font-body lg:text-[48px] lg:font-bold lg:leading-[1.1] lg:tracking-normal">
            Built on what we
            <br />
            know best.
          </h2>
          <p className="mt-3 max-w-md font-body text-[14px] leading-relaxed text-white/80 lg:hidden">
            Four things we do better than anyone else.
          </p>
        </Container>
      </div>

      <div className="bg-white py-16 lg:py-[120px]">
        <Container>
          <div className="grid gap-8 lg:grid-cols-2">
            {whyChooseCards.map((card) => (
              <article
                key={card.title}
                className="flex flex-col rounded-lg border border-[#E6E7E9] bg-white p-6 lg:p-8"
              >
                <p className="font-body text-[10px] font-bold uppercase leading-[1.5] tracking-[0.2em] text-[#D4AF37]">
                  Why choose Sky Tire
                </p>
                <div className="relative mt-6 h-[180px] overflow-hidden rounded lg:h-[220px]">
                  <Image src={card.image} alt="" fill className="object-cover" sizes="(min-width: 1024px) 574px, 100vw" />
                </div>
                <h3 className="mt-6 font-body text-[22px] font-semibold leading-[1.25] text-[#0B0B0C] lg:text-[24px]">
                  {card.title}
                </h3>
                <p className="mt-4 flex-1 font-body text-[15px] leading-[1.625] text-[#6B6B6E]">{card.body}</p>
                <Link
                  href={card.href}
                  className="mt-6 inline-flex w-fit items-center justify-center rounded border border-[#0B0B0C] px-8 py-3 font-body text-[12px] font-bold uppercase tracking-[0.1em] text-[#0B0B0C]"
                >
                  {card.cta}
                </Link>
              </article>
            ))}
          </div>
        </Container>
      </div>
    </section>
  );
}
