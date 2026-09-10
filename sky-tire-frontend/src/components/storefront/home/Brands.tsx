// import Image from "next/image";
// import Link from "next/link";
// import Container from "@/components/storefront/Container";
// import type { CatalogBrand } from "@/lib/storefront/catalog";

// const groups: { key: string; title: string; match: string[] }[] = [
//   { key: "wire", title: "Wire Wheel Brands", match: ["wire_wheel"] },
//   { key: "wheel", title: "Wheel Brands", match: ["wheel"] },
//   { key: "tire", title: "Tire Brands", match: ["tire"] },
// ];

// export default function Brands({ brands }: { brands: CatalogBrand[] }) {
//   return (
//     <section className="bg-[#F9F9F9] py-14 lg:py-20">
//       <Container>
//         <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
//           <h2 className="font-display text-[36px] leading-none text-[#0B0B0C] lg:text-[48px]">
//             Brands
//             <br />
//             <span className="text-[#D4AF37]">we carry</span>
//           </h2>
//           <Link
//             href="/brands"
//             className="font-nav text-[12px] font-semibold uppercase tracking-[0.12em] text-[#C6A15B]"
//           >
//             View all brands →
//           </Link>
//         </div>
//         {brands.length === 0 ? (
//           <p className="mt-8 text-[14px] text-[#6B6B6E]">
//             Brand catalogs will appear here once they are published in admin.
//           </p>
//         ) : (
//           groups.map((group) => {
//             const items = brands.filter((brand) => group.match.includes(brand.category));
//             if (items.length === 0) return null;
//             return (
//               <div key={group.key} className="mt-10">
//                 <p className="font-nav text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6B6B6E]">
//                   {group.title}
//                 </p>
//                 <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
//                   {items.map((brand) => (
//                     <Link
//                       key={brand.id}
//                       href={`/products?brand=${encodeURIComponent(brand.name)}`}
//                       className="flex w-[120px] shrink-0 flex-col items-center text-center"
//                     >
//                       <span className="relative flex h-[88px] w-[88px] items-center justify-center overflow-hidden rounded-full border border-[#E6E7E9] bg-white">
//                         {brand.logo ? (
//                           <Image src={brand.logo} alt="" fill className="object-contain p-3" sizes="88px" />
//                         ) : (
//                           <span className="font-display text-[28px] text-[#0B0B0C]">
//                             {brand.name.slice(0, 1)}
//                           </span>
//                         )}
//                       </span>
//                       <span className="mt-2 text-[13px] font-medium text-[#0B0B0C]">{brand.name}</span>
//                       <span className="text-[11px] text-[#6B6B6E]">{brand.count} Products</span>
//                     </Link>
//                   ))}
//                 </div>
//               </div>
//             );
//           })
//         )}
//       </Container>
//     </section>
//   );
// }
import Image from "next/image";
import Link from "next/link";
import Container from "@/components/storefront/Container";
import type { CatalogBrand } from "@/lib/storefront/catalog";

const DUMMY_BRANDS: CatalogBrand[] = [
  {
    id: "1",
    name: "Dayton Wire",
    category: "wire_wheel",
    logo: "/images/brands/dayton.png",
    count: 24,
  },
  {
    id: "2",
    name: "Vogue Tyre",
    category: "tire",
    logo: "/images/brands/vogue.png",
    count: 18,
  },
  {
    id: "3",
    name: "Lexani Wheels",
    category: "wheel",
    logo: "",
    count: 12,
  },
];

const groups: { key: string; title: string; match: string[] }[] = [
  { key: "wire", title: "Wire Wheel Brands", match: ["wire_wheel"] },
  { key: "wheel", title: "Wheel Brands", match: ["wheel"] },
  { key: "tire", title: "Tire Brands", match: ["tire"] },
];

export default function Brands({ brands }: { brands?: CatalogBrand[] }) {
  // Backend brands ki jagah dummy data assign kar diya
  const displayBrands = DUMMY_BRANDS;

  return (
    <section className="bg-[#F9F9F9] py-14 lg:py-20">
      <Container>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <h2 className="font-display text-[36px] leading-none text-[#0B0B0C] lg:text-[48px]">
            Brands
            <br />
            <span className="text-[#D4AF37]">we carry</span>
          </h2>
          <Link
            href="/brands"
            className="font-nav text-[12px] font-semibold uppercase tracking-[0.12em] text-[#C6A15B]"
          >
            View all brands →
          </Link>
        </div>
        {displayBrands.length === 0 ? (
          <p className="mt-8 text-[14px] text-[#6B6B6E]">
            Brand catalogs will appear here once they are published in admin.
          </p>
        ) : (
          groups.map((group) => {
            const items = displayBrands.filter((brand) =>
              group.match.includes(brand.category)
            );
            if (items.length === 0) return null;
            return (
              <div key={group.key} className="mt-10">
                <p className="font-nav text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6B6B6E]">
                  {group.title}
                </p>
                <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
                  {items.map((brand) => (
                    <Link
                      key={brand.id}
                      href={`/products?brand=${encodeURIComponent(brand.name)}`}
                      className="flex w-[120px] shrink-0 flex-col items-center text-center"
                    >
                      <span className="relative flex h-[88px] w-[88px] items-center justify-center overflow-hidden rounded-full border border-[#E6E7E9] bg-white">
                        {brand.logo ? (
                          <Image
                            src={brand.logo}
                            alt=""
                            fill
                            className="object-contain p-3"
                            sizes="88px"
                          />
                        ) : (
                          <span className="font-display text-[28px] text-[#0B0B0C]">
                            {brand.name.slice(0, 1)}
                          </span>
                        )}
                      </span>
                      <span className="mt-2 text-[13px] font-medium text-[#0B0B0C]">
                        {brand.name}
                      </span>
                      <span className="text-[11px] text-[#6B6B6E]">
                        {brand.count} Products
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </Container>
    </section>
  );
}