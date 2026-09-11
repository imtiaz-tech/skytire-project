import Image from "next/image";
import Link from "next/link";
import { ICO, packages } from "@/lib/storefront/content";
import { formatUsd } from "@/lib/storefront/format";

type PackageItem = (typeof packages)[number];

function PackageCard({ item }: { item: PackageItem }) {
  const featured = "featured" in item && item.featured;

  return (
    <article
      className={`relative flex w-full flex-col gap-4 bg-white px-8 pt-8 pb-[34px] ${
        featured
          ? "border-2 border-[#C6A15B] shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)]"
          : "border border-[#F3F4F6] shadow-[0px_1px_1px_rgba(0,0,0,0.05)]"
      }`}
    >
      {featured ? (
        <span className="absolute top-[-14px] left-1/2 -translate-x-1/2 bg-[#C6A15B] px-4 py-1 font-body text-[10px] font-bold uppercase leading-[1.5] tracking-[0.1em] whitespace-nowrap text-white">
          Most Requested
        </span>
      ) : null}

      <div className="relative h-64 w-full overflow-hidden bg-white">
        <Image
          src={item.image}
          alt={item.title}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 389px"
        />
      </div>

      <h3 className="pt-4 font-display text-[30px] uppercase leading-[1.2] text-[#0B0B0C]">
        {item.title}
      </h3>

      <ul className="flex flex-col gap-3">
        {item.items.map((line) => (
          <li key={line} className="flex items-center">
            {/* Figma check is 12.25×14; next/image is unnecessary for this local SVG. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${ICO}/check.svg`}
              alt=""
              width={12.25}
              height={14}
              className="mr-3 h-[14px] w-[12.25px] shrink-0"
            />
            <span className="font-body text-[14px] leading-5 text-[#0B0B0C]">{line}</span>
          </li>
        ))}
      </ul>

      <p className="flex h-[60px] items-center">
        <span className="font-body text-[30px] font-bold leading-[1.2] text-[#0B0B0C]">
          {formatUsd(item.price)}
        </span>
        <span className="ml-1 font-body text-[14px] leading-5 text-[#9CA3AF]">/ set of 4</span>
      </p>

      <Link
        href="/#vehicle-finder"
        className="inline-flex items-center justify-center border-2 border-[#0B0B0C] py-4 font-body text-[12px] font-bold uppercase leading-4 tracking-[0.1em] text-[#0B0B0C]"
      >
        Check Fitment
      </Link>
    </article>
  );
}

function ArrowIcon({ direction }: { direction: "prev" | "next" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      {direction === "prev" ? (
        <path
          d="M10.5 3.5 6 8l4.5 4.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M5.5 3.5 10 8l-4.5 4.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

const arrowClass =
  "absolute top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#0B0B0C] bg-white text-[#0B0B0C]";

function PackageSlider() {
  return (
    <div className="relative mt-12 pt-4 lg:hidden">
      <style>{`
        .pkg-viewport { --pkg-shift: 0%; }
        #home-pkg-b:checked ~ .pkg-viewport { --pkg-shift: -100%; }
        #home-pkg-c:checked ~ .pkg-viewport { --pkg-shift: -200%; }
        .pkg-track {
          width: 100%;
          transform: translateX(var(--pkg-shift));
        }
      `}</style>
      <input
        id="home-pkg-a"
        type="radio"
        name="home-packages-slider"
        defaultChecked
        className="peer/a sr-only"
        aria-label={packages[0].title}
      />
      <input
        id="home-pkg-b"
        type="radio"
        name="home-packages-slider"
        className="peer/b sr-only"
        aria-label={packages[1].title}
      />
      <input
        id="home-pkg-c"
        type="radio"
        name="home-packages-slider"
        className="peer/c sr-only"
        aria-label={packages[2].title}
      />

      <span className={`${arrowClass} left-0 opacity-30 peer-checked/a:flex`} aria-hidden>
        <ArrowIcon direction="prev" />
      </span>
      <label
        htmlFor="home-pkg-a"
        className={`${arrowClass} left-0 cursor-pointer peer-checked/b:flex`}
      >
        <span className="sr-only">Previous package</span>
        <ArrowIcon direction="prev" />
      </label>
      <label
        htmlFor="home-pkg-b"
        className={`${arrowClass} left-0 cursor-pointer peer-checked/c:flex`}
      >
        <span className="sr-only">Previous package</span>
        <ArrowIcon direction="prev" />
      </label>

      <label
        htmlFor="home-pkg-b"
        className={`${arrowClass} right-0 cursor-pointer peer-checked/a:flex`}
      >
        <span className="sr-only">Next package</span>
        <ArrowIcon direction="next" />
      </label>
      <label
        htmlFor="home-pkg-c"
        className={`${arrowClass} right-0 cursor-pointer peer-checked/b:flex`}
      >
        <span className="sr-only">Next package</span>
        <ArrowIcon direction="next" />
      </label>
      <span className={`${arrowClass} right-0 opacity-30 peer-checked/c:flex`} aria-hidden>
        <ArrowIcon direction="next" />
      </span>

      <div className="pkg-viewport mx-12 overflow-hidden">
        <div className="pkg-track flex">
          {packages.map((item) => (
            <div key={item.title} className="w-full min-w-full shrink-0">
              <PackageCard item={item} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Packages() {
  return (
    <section id="packages" className="bg-white py-16 lg:py-24">
      <div className="mx-auto w-full max-w-[1280px] px-5 lg:px-6">
        <div className="flex flex-col items-center gap-4">
          <h2 className="text-center font-display text-[40px] uppercase leading-none text-[#0B0B0C] lg:text-[72px]">
            One look. One package. Done.
          </h2>
          <p className="max-w-[672px] text-center font-body text-[16px] leading-[1.4] text-[#6B7280] lg:text-[20px]">
            Skip the guesswork. Pre-assembled wheel and tire packages balanced
            and ready to bolt on.
          </p>
        </div>

        <PackageSlider />

        <div className="mt-12 hidden gap-10 pt-4 lg:mt-16 lg:grid lg:grid-cols-3">
          {packages.map((item) => (
            <PackageCard key={item.title} item={item} />
          ))}
        </div>

        <div className="mt-12 flex justify-center lg:mt-16">
          <Link
            href="/products"
            className="inline-flex items-center justify-center bg-[#0B0B0C] px-8 py-4 font-body text-[12px] font-bold uppercase leading-5 tracking-[0.1em] whitespace-nowrap text-white lg:px-12 lg:py-5 lg:text-[14px]"
          >
            Shop All Complete Packages
          </Link>
        </div>
      </div>
    </section>
  );
}
