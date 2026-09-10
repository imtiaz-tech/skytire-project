import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/storefront/Icon";
import { formatUsd } from "@/lib/storefront/format";
import { tireShowcaseProducts } from "@/lib/storefront/content";

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center" aria-hidden>
      {Array.from({ length: 5 }).map((_, index) => {
        const fill = Math.min(1, Math.max(0, rating - index));

        return (
          <span key={index} className="relative h-3 w-3 overflow-hidden">
            <Icon name="star" alt="" size={12} className="opacity-25" />
            <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Icon name="star" alt="" size={12} />
            </span>
          </span>
        );
      })}
    </div>
  );
}

export default function ProductCard({
  product,
}: {
  product: (typeof tireShowcaseProducts)[number];
}) {
  const inStock = product.stock > 0;
  const buttonClass =
    "inline-flex h-[42px] w-full items-center justify-center bg-[#0B0B0C] font-body text-[12px] font-bold uppercase leading-[1.5] tracking-[0.1em] text-white";

  return (
    <article className="flex h-full flex-col rounded-lg border border-[#E6E7E9] bg-white p-5 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
      <Link href="/products" className="relative block h-[240px] overflow-hidden">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 80vw, 288px"
          className="object-contain"
        />
      </Link>

      <h3 className="mt-4 font-body text-[20px] font-bold leading-[1.4] text-[#0B0B0C]">
        <Link href="/products">{product.name}</Link>
      </h3>

      <div className="mt-2 flex items-center">
        <Stars rating={product.rating} />
        <span className="ml-2 font-body text-[12px] leading-[1.5] text-[#9CA3AF]">
          ({product.reviews})
        </span>
      </div>

      <p className="mt-4 font-body text-[24px] font-bold leading-[1.5] text-[#0B0B0C]">
        {formatUsd(product.price)}
        <span className="ml-1 align-baseline text-[14px] font-normal text-[#9CA3AF]">/ tire</span>
      </p>

      <div className="mt-auto pt-4">
        {inStock ? (
          <Link href="/products" className={buttonClass}>
            View Product
          </Link>
        ) : (
          <span className={buttonClass}>Out of Stock</span>
        )}
      </div>
    </article>
  );
}
