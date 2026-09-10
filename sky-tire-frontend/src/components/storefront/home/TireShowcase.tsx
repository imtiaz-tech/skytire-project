import Image from "next/image";
import ProductCard from "@/components/storefront/ProductCard";
import { IMG, tireShowcaseProducts } from "@/lib/storefront/content";

export default function TireShowcase() {
  return (
    <section>
      <header className="relative isolate overflow-hidden bg-[#0B0B0C] text-white">
        <Image
          src={`${IMG}/tires-banner.png`}
          alt=""
          fill
          className="object-cover object-[center_right]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[#0B0B0C]/[0.78]" />
        <div className="relative mx-auto flex min-h-[200px] w-full max-w-[1280px] flex-col justify-center px-5 py-10 lg:min-h-[260px] lg:px-4">
          <p className="font-body text-[12px] font-bold uppercase leading-[1.5] tracking-[0.167em] text-[#C6A15B]">
            The Original Look
          </p>
          <h2 className="mt-2 font-display text-[48px] uppercase leading-none text-white lg:text-[96px]">
            Tires
          </h2>
          <p className="mt-2 max-w-[537px] font-body text-[16px] leading-[1.5] text-[#C9CDD1] lg:text-[18px]">
            Authentic styling for classic cars, lowriders, and custom builds.
          </p>
        </div>
      </header>

      <div className="bg-white py-10 lg:py-16">
        <div className="mx-auto w-full max-w-[1280px] px-5 lg:px-4">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {tireShowcaseProducts.map((product) => (
              <ProductCard key={product.name} product={product} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
