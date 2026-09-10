import Image from "next/image";
import Link from "next/link";
import Container from "@/components/storefront/Container";
import Icon from "@/components/storefront/Icon";
import { IMG, premiumServices } from "@/lib/storefront/content";

export default function PremiumServices() {
  return (
    <section className="bg-[#0B0B0C] pb-16 lg:pb-24">
      <div className="relative isolate h-[200px] overflow-hidden lg:h-[300px]">
        <Image
          src={`${IMG}/premium-hero.png`}
          alt="Classic lowrider at golden hour"
          fill
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0C]/70 via-[#0B0B0C]/25 to-transparent" />
        <div className="relative z-10 flex h-full items-center">
          <Container>
            <div className="flex items-center gap-4">
              <span className="h-px w-8 bg-[#D4AF37]" aria-hidden />
              <p className="font-body text-[11px] font-bold uppercase leading-[1.5] tracking-[0.2em] text-[#D4AF37]">
                Ask anything
              </p>
              <span className="h-px w-8 bg-[#D4AF37]" aria-hidden />
            </div>
            <h2 className="mt-3.5 font-display text-[36px] uppercase leading-none text-white lg:text-[48px] lg:leading-[1.1] lg:[font-family:var(--font-inter),sans-serif] lg:font-bold">
              We offer you the
              <br />
              premium services
            </h2>
          </Container>
        </div>
      </div>

      <Container className="mt-8 lg:mt-24">
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,745px)_minmax(0,519px)] lg:gap-12">
          <div className="flex flex-col gap-3">
            {premiumServices.map((service, index) => (
              <details
                key={service.title}
                name="premium-services"
                open={index === 0}
                className="group rounded border border-[#333438] bg-[#202124] [&[open]]:border-[#D4AF37] [&[open]]:bg-[#0B0B0C]"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-[18px] lg:px-8 lg:py-[17px] [&::-webkit-details-marker]:hidden">
                  <span className="flex min-w-0 items-center gap-4 lg:gap-6">
                    <Icon name={service.icon} alt="" size={22} className="[&_img]:brightness-0 [&_img]:invert" />
                    <span className="font-body text-[14px] font-semibold uppercase tracking-[0.1em] text-white lg:text-[16px] lg:leading-[1.5]">
                      {service.title}
                    </span>
                  </span>
                  <Icon
                    name="chevron-down"
                    alt=""
                    size={16}
                    className="shrink-0 [&_img]:brightness-0 [&_img]:invert transition-transform group-open:rotate-180"
                  />
                </summary>
                <div className="px-4 pb-6 pl-[52px] lg:px-8 lg:pb-8 lg:pl-[84px]">
                  <p className="max-w-[576px] font-body text-[15px] leading-[1.625] text-[#A6A6A6]">{service.body}</p>
                  <Link
                    href={service.href}
                    className="mt-4 inline-flex font-body text-[14px] font-semibold uppercase tracking-[0.1em] text-[#D4AF37]"
                  >
                    Learn more →
                  </Link>
                </div>
              </details>
            ))}
          </div>

          <div className="relative hidden min-h-[420px] overflow-hidden rounded lg:block">
            <Image
              src={`${IMG}/premium-workshop.png`}
              alt="Specialist mounting a chrome wire wheel"
              fill
              sizes="519px"
              className="object-cover"
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
