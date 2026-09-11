import Image from "next/image";
import Link from "next/link";
import { looks } from "@/lib/storefront/content";

export default function ShopByLook() {
  const mobileLooks = looks.slice(0, 4);

  return (
    <section id="shop-by-look" className="bg-[#0B0B0C] text-white">
      <div className="px-6 py-16 lg:hidden">
        <p className="font-body text-[11px] font-bold uppercase leading-[1.5] tracking-[0.1em] text-[#C6A15B]">
          No Technical Terms Needed
        </p>
        <h2 className="mt-2 font-display text-[26px] uppercase leading-[1.08] text-white">
          Shop By Look.
        </h2>
        <p className="mt-2 font-body text-[15px] leading-[1.47] text-[#C9CDD1]">
          Pick the look. We&apos;ll handle the specs.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-x-2 gap-y-4">
          {mobileLooks.map((look) => (
            <Link key={look.title} href={look.href} className="flex flex-col gap-2">
              <div className="relative h-[194px] overflow-hidden rounded">
                <Image
                  src={look.image}
                  alt={look.title}
                  fill
                  className="object-cover"
                  sizes="50vw"
                />
              </div>
              <h3 className="font-display text-[20px] uppercase leading-[1.25] text-white">
                {look.title}
              </h3>
              <p className="font-body text-[12px] leading-[1.25] text-[#C9CDD1]">{look.subtitle}</p>
            </Link>
          ))}
        </div>

        <ExploreEveryLookButton className="mt-8 w-full" />
      </div>

      <div className="hidden pt-16 pb-24 lg:block lg:pt-24 lg:pb-[192px]">
        <div className="mx-auto w-full max-w-[1280px] px-5 lg:px-6">
          <div className="flex flex-col items-center gap-2">
            <h2 className="font-display text-[36px] uppercase leading-none tracking-[-0.025em] text-white lg:text-[48px]">
              Shop By Look
            </h2>
            <span aria-hidden className="h-1 w-24 bg-[#C6A15B]" />
          </div>

          <div className="mt-10 flex gap-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:mt-16 lg:grid lg:grid-cols-5 lg:overflow-visible">
            {looks.map((look) => (
              <Link
                key={look.title}
                href={look.href}
                className="relative h-[300px] w-[234px] shrink-0 overflow-hidden lg:w-auto"
              >
                <Image
                  src={look.image}
                  alt={look.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 234px, 234px"
                />
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-[#0B0B0C] from-0% via-transparent via-50% to-transparent"
                />
                <h3 className="absolute inset-x-0 bottom-6 text-center font-display text-[20px] uppercase leading-[1.4] tracking-[0.1em] text-white">
                  {look.title}
                </h3>
              </Link>
            ))}
          </div>

          <div className="mt-16 flex justify-center">
            <ExploreEveryLookButton className="min-w-[361px] px-12" />
          </div>
        </div>
      </div>
    </section>
  );
}

function ExploreEveryLookButton({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/wire-wheels"
      className={`inline-flex h-[52px] items-center justify-center gap-3 rounded border border-[#C9CDD1] font-body text-[15px] font-semibold uppercase leading-[1.5] text-white ${className}`}
    >
      Explore Every Look
      <span aria-hidden>→</span>
    </Link>
  );
}
