import Link from "next/link";
import Image from "next/image";
import Container from "@/components/storefront/Container";
import { IMG, footerColumns, legalLinks, socialLinks } from "@/lib/storefront/content";

const shop = footerColumns[0];
const support = footerColumns[1];
const company = footerColumns[2];

export default function Footer() {
  return (
    <footer className="bg-black text-white">
      <Container className="pt-16 pb-8 lg:pt-24 lg:pb-12">
        <div className="grid gap-12 lg:grid-cols-[1.35fr_0.85fr_0.85fr_1.15fr] lg:gap-8">
          <BrandColumn />
          <nav className="hidden lg:block" aria-label="Shop">
            <FooterHeading>{shop.title}</FooterHeading>
            <FooterLinks links={shop.links} />
          </nav>
          <div className="hidden space-y-10 lg:block">
            <nav aria-label="Support">
              <FooterHeading>{support.title}</FooterHeading>
              <FooterLinks links={support.links} />
            </nav>
            <nav aria-label="Company">
              <FooterHeading>{company.title}</FooterHeading>
              <FooterLinks links={company.links} />
            </nav>
          </div>
          <ContactColumn />
        </div>

        <div className="mt-10 space-y-0 border-t border-[#333438] lg:hidden">
          {[shop, support, company].map((column) => (
            <details key={column.title} className="border-b border-[#333438]">
              <summary className="flex cursor-pointer items-center justify-between py-4 text-[14px] font-bold uppercase tracking-[0.1em] [&::-webkit-details-marker]:hidden">
                {column.title}
                <span aria-hidden className="text-[#A6A6A6]">
                  +
                </span>
              </summary>
              <FooterLinks links={column.links} className="pb-4" />
            </details>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-[#333438] pt-6">
          <p className="text-[11px] uppercase tracking-[0.08em] text-[#A6A6A6]">
            © 2026 Sky Tire. All rights reserved.
          </p>
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {legalLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-[11px] uppercase tracking-[0.08em] text-[#A6A6A6] hover:text-white"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </footer>
  );
}

function BrandColumn() {
  return (
    <div>
      <Link href="/" className="inline-block" aria-label="Sky Tire home">
        <span className="font-display text-[36px] leading-none tracking-[0.05em] text-white">SKY TIRE</span>
      </Link>
      <p className="mt-5 max-w-[280px] text-[12px] font-bold uppercase leading-[1.625] tracking-[0.1em] text-white">
        Tires for every ride. Wheels for every style.
      </p>
      <p className="mt-4 text-[12px] uppercase tracking-[0.1em] text-[#A6A6A6]">Your lowrider headquarters</p>
      <p className="mt-3 max-w-[280px] text-[14px] leading-snug text-[#A6A6A6]">
        Wire Wheels • Original Whitewalls • Lowrider Accessories
      </p>
      <Link
        href="/about"
        className="mt-8 inline-block text-[12px] font-bold uppercase tracking-[0.1em] text-[#A6A6A6] hover:text-white"
      >
        About Us
      </Link>
      <ul className="mt-5 flex flex-wrap gap-2.5">
        {socialLinks.map((item) => (
          <li key={item.name}>
            <Link
              href={item.href}
              aria-label={item.name}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#A6A6A6] text-white hover:border-white"
            >
              <SocialIcon name={item.icon} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ContactColumn() {
  return (
    <div className="space-y-8">
      <div>
        <FooterHeading>Stay in the loop</FooterHeading>
        <form className="mt-4 flex h-[46px] overflow-hidden rounded border border-[#333438]">
          <label htmlFor="footer-email" className="sr-only">
            Your email
          </label>
          <input
            id="footer-email"
            type="email"
            name="email"
            placeholder="Your Email"
            className="h-full min-w-0 flex-1 bg-transparent px-4 text-[14px] text-white placeholder:text-[#6B6B6E]"
          />
          <button
            type="submit"
            className="h-full bg-white px-6 text-[12px] font-bold uppercase tracking-[0.1em] text-black"
          >
            Subscribe
          </button>
        </form>
      </div>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-white">Our guarantee</p>
        <a
  href="https://www.bbb.org/"
  target="_blank"
  rel="noreferrer"
  className="mt-3 flex items-center gap-3"
>
  <Image
    src={`${IMG}/badge-bbb.png`}
    alt="BBB Accredited Business"
    width={161}
    height={61}
    className="h-[48px] w-auto flex-shrink-0"
  />
  <span className="text-[11px] leading-snug text-[#A6A6A6]">
    BBB Rating: A+
    <br />
    As of 9/2/2026
    <br />
    Click for Profile
  </span>
</a>
      </div>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-white">Contact</p>
        <p className="mt-3 text-[12px] leading-[1.625] text-[#A6A6A6]">
          Sacramento, CA 95838
          <br />
          <a href="tel:+19166164759" className="hover:text-white">
            +1 (916) 616-4759
          </a>
          <br />
          <a href="mailto:info@skytire.com" className="hover:text-white">
            info@skytire.com
          </a>
        </p>
        <a
          href="https://maps.google.com/?q=Sacramento+CA+95838"
          className="mt-4 inline-flex h-11 w-full items-center justify-center border border-[#333438] bg-[#202124] text-[12px] font-bold uppercase tracking-[0.1em] text-white hover:border-white"
        >
          Get Directions
        </a>
        <div className="relative mt-4 h-32 overflow-hidden rounded border border-[#333438] bg-[#111]">
          <Image
            src={`${IMG}/map.png`}
            alt="Stylized map of California"
            fill
            className="object-cover object-center"
            sizes="320px"
          />
        </div>
      </div>
    </div>
  );
}

function FooterHeading({ children }: { children: string }) {
  return (
    <p className="border-b border-[#333438] pb-3 text-[14px] font-bold uppercase tracking-[0.1em] text-white">
      {children}
    </p>
  );
}

function FooterLinks({
  links,
  className = "",
}: {
  links: readonly { label: string; href: string }[];
  className?: string;
}) {
  return (
    <ul className={`mt-4 space-y-2.5 ${className}`}>
      {links.map((link) => (
        <li key={link.href + link.label}>
          <Link href={link.href} className="text-[14px] text-[#A6A6A6] hover:text-white">
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function SocialIcon({ name }: { name: string }) {
  const className = "h-[14px] w-[14px] fill-none stroke-current";
  switch (name) {
    case "instagram":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <rect x="3.5" y="3.5" width="17" height="17" rx="5" strokeWidth="1.5" />
          <circle cx="12" cy="12" r="4" strokeWidth="1.5" />
          <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      );
    case "facebook":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <path d="M14 8h3V4h-3c-2.8 0-5 2.2-5 5v3H6v4h3v8h4v-8h3.2L17 12h-4V9c0-.6.4-1 1-1Z" fill="currentColor" stroke="none" />
        </svg>
      );
    case "help":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <circle cx="12" cy="12" r="8.25" strokeWidth="1.5" />
          <path d="M9.6 9.4a2.4 2.4 0 1 1 3.7 2c-.8.5-1.3 1-1.3 2" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="12" cy="16.4" r="0.8" fill="currentColor" stroke="none" />
        </svg>
      );
    case "youtube":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <rect x="3" y="7" width="18" height="10" rx="2.5" strokeWidth="1.5" />
          <path d="M11 10.2 15 12l-4 1.8V10.2Z" fill="currentColor" stroke="none" />
        </svg>
      );
    case "tiktok":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <path
            d="M14 6c.4 2.4 1.8 3.8 4 4V13c-1.6 0-3-.5-4-1.3V16a5 5 0 1 1-5-5c.3 0 .6 0 .9.1V14A2.2 2.2 0 1 0 12 16V6h2Z"
            fill="currentColor"
            stroke="none"
          />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <circle cx="12" cy="12" r="8.25" strokeWidth="1.5" />
          <circle cx="12" cy="12" r="2.4" strokeWidth="1.5" />
          <path d="M12 3.8v3.2M12 17v3.2M3.8 12h3.2M17 12h3.2" strokeWidth="1.5" />
        </svg>
      );
  }
}
