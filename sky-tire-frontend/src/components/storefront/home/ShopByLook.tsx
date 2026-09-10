import Image from "next/image";
import Link from "next/link";
import { looks } from "@/lib/storefront/content";

export default function ShopByLook() {
  return (
    <section className="bg-[#0B0B0C] pt-16 pb-24 text-white lg:pt-24 lg:pb-[192px]">
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
      </div>
    </section>
  );
}
