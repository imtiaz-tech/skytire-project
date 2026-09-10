import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/storefront/Icon";
import { collectionCards } from "@/lib/storefront/content";

export default function ShopByCategory() {
  const featured = collectionCards[0];
  const whitewall = collectionCards[1];
  const promo = collectionCards[2];
  const rest = collectionCards.slice(3);

  return (
    <section className="bg-white py-16 lg:py-24">
      <div className="mx-auto w-full max-w-[1280px] px-5 lg:px-6">
        <div className="flex flex-col items-center">
          <p className="text-center font-display text-[28px] uppercase leading-none tracking-[-0.025em] text-[#C6A15B] lg:text-[48px]">
            Shop the Sky Tire Collection
          </p>
          <h2 className="mt-2 text-center font-display text-[36px] uppercase leading-none text-[#0B0B0C] lg:text-[48px]">
            Build the Look.
          </h2>
          <span aria-hidden className="mt-2 h-1 w-24 bg-[#C6A15B]" />
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-[604fr_290fr_290fr]">
          <Link
            href={featured.href}
            className="flex min-h-[280px] flex-col border border-[#E6E7E9] bg-white p-8 lg:h-[340px]"
          >
            <div className="relative min-h-[180px] flex-1">
              <Image
                src={featured.image}
                alt={featured.title}
                fill
                className="object-contain object-center scale-110"
                sizes="(max-width: 1024px) 100vw, 604px"
              />
            </div>
            <div className="mt-4 shrink-0">
              <h3 className="font-display text-[30px] uppercase leading-none text-[#0B0B0C]">
                {featured.title}
              </h3>
              <p className="mt-1 font-body text-[15px] leading-[1.47] text-[#6B6B6E]">
                {featured.description}
              </p>
              <span className="mt-2 inline-flex items-center gap-2 font-body text-[11px] font-bold uppercase leading-[1.5] tracking-[0.16em] text-[#C6A15B]">
                {featured.cta} <span aria-hidden>→</span>
              </span>
            </div>
          </Link>

          <Link
            href={whitewall.href}
            className="flex min-h-[280px] flex-col border border-[#E6E7E9] bg-white p-6 lg:h-[340px]"
          >
            <div className="relative h-[164px] w-full shrink-0 overflow-hidden lg:h-[214px]">
              <Image
                src={whitewall.image}
                alt={whitewall.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 290px"
              />
            </div>
            <div className="mt-4 shrink-0">
              <h3 className="font-display text-[24px] uppercase leading-[1.17] text-[#0B0B0C]">
                {whitewall.title}
              </h3>
              <p className="mt-1 font-body text-[15px] leading-[1.47] text-[#6B6B6E]">
                Classic looks. Modern radial performance.
              </p>
            </div>
          </Link>

          <Link
            href={promo.href}
            className="flex min-h-[280px] flex-col rounded-lg border border-[#C6A15B] bg-[#0B0B0C] p-6 text-white lg:h-[340px]"
          >
            <div className="relative h-[150px] w-full shrink-0 overflow-hidden lg:h-[165px]">
              <Image
                src={promo.image}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 290px"
              />
            </div>
            <div className="mt-4 flex flex-1 flex-col">
              <p className="font-body text-[11px] font-bold uppercase leading-[1.5] tracking-[0.16em] text-[#C6A15B]">
                {promo.eyebrow}
              </p>
              <h3 className="mt-1 font-display text-[24px] uppercase leading-[1.17] text-white">
                {promo.title}
              </h3>
              <p className="mt-1 font-body text-[14px] leading-[1.5] text-white/60">
                {promo.description}
              </p>
              <p className="mt-1 font-body text-[18px] font-bold uppercase leading-[1.5] text-[#C6A15B]">
                {promo.offer}
              </p>
              <span className="mt-2 inline-flex items-center gap-2 font-body text-[11px] font-bold uppercase leading-[1.5] tracking-[0.16em] text-[#C6A15B]">
                {promo.cta} <span aria-hidden>→</span>
              </span>
            </div>
          </Link>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {rest.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="flex min-h-[260px] flex-col border border-[#E6E7E9] bg-white p-6 lg:h-[260px]"
            >
              <div className="relative h-[138px] w-full shrink-0 overflow-hidden">
                <Image
                  src={card.image}
                  alt={card.title}
                  fill
                  className={card.title === "Accessories" ? "object-contain" : "object-cover"}
                  sizes="(max-width: 1024px) 100vw, 290px"
                />
              </div>
              <div className="mt-4 shrink-0">
                <h3 className="font-display text-[20px] uppercase leading-[1.2] text-[#0B0B0C]">
                  {card.title}
                </h3>
                <p className="mt-1 font-body text-[13px] leading-[1.38] text-[#6B6B6E]">
                  {card.description}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <Link
            href="/#financing"
            className="inline-flex h-[52px] w-full max-w-[320px] items-center justify-center gap-3 border border-[#E6E7E9] bg-white"
          >
            <Icon name="financing" alt="" size={20} />
            <span className="font-body text-[14px] font-semibold uppercase leading-[1.5] tracking-[0.16em] text-[#0B0B0C]">
              Financing Available
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
