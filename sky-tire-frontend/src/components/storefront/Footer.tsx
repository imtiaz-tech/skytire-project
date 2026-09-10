import Link from "next/link";
import Image from "next/image";
import Container from "@/components/storefront/Container";
import { ICO, IMG, footerColumns, legalLinks, socialLinks } from "@/lib/storefront/content";

const shop = footerColumns[0];
const support = footerColumns[1];
const company = footerColumns[2];

export default function Footer() {
  return (
    <footer className="bg-black text-white">
      <MobileFooter />
      <Container className="hidden pt-16 pb-8 lg:block lg:pt-24 lg:pb-12">
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

function MobileFooter() {
  const accordionColumns = [shop, company, support];

  return (
    <div className="relative overflow-hidden px-5 pt-10 pb-8 lg:hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 100% 0%, rgba(198, 161, 91, 0.08) 0%, rgba(198, 161, 91, 0) 60%)",
        }}
      />

      <div className="relative flex flex-col gap-10">
        <div className="flex flex-col gap-[7px]">
          <Link href="/" className="inline-block" aria-label="Sky Tire home">
            <span className="font-display text-[36px] leading-[1.11] tracking-[0.05em] text-white">
              SKY TIRE
            </span>
          </Link>
          <p className="font-display text-[18px] uppercase leading-[1.25] tracking-[0.025em] text-white">
            Tires for every ride.
            <br />
            Wheels for every style.
          </p>
          <p className="font-body text-[10px] font-bold uppercase leading-[1.5] tracking-[0.2em] text-[#C6A15B]">
            Your lowrider headquarters
          </p>
          <p className="font-body text-[13px] leading-[1.5] text-[#C9CDD1]">
            Wire Wheels • Original Whitewalls • Lowrider Accessories
          </p>
        </div>

        <div aria-hidden className="h-px w-full bg-[linear-gradient(90deg,rgba(201,205,209,0)_0%,rgba(201,205,209,0.2)_50%,rgba(201,205,209,0)_100%)]" />

        <div className="flex flex-col gap-4">
          <h3 className="font-display text-[20px] uppercase leading-[1.4] tracking-[0.05em] text-white">
            About Us
          </h3>
          <p className="font-body text-[14px] leading-[1.5] text-[#C9CDD1]">
            Your trusted road safety partner, providing reliable quality and personalized service.
          </p>
          <ul className="flex flex-wrap gap-3 pt-2">
            {socialLinks.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  aria-label={item.name}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(201,205,209,0.3)] text-white"
                >
                  <SocialIcon name={item.icon} />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="font-display text-[20px] uppercase leading-[1.4] tracking-[0.05em] text-white">
            Stay in the loop
          </h3>
          <form className="flex flex-col gap-3">
            <label htmlFor="footer-email-mobile" className="sr-only">
              Email Address
            </label>
            <input
              id="footer-email-mobile"
              type="email"
              name="email"
              placeholder="Email Address"
              className="h-[52px] w-full rounded border border-[rgba(201,205,209,0.4)] bg-transparent px-4 font-body text-[16px] leading-[1.21] text-white placeholder:text-[rgba(201,205,209,0.5)]"
            />
            <button
              type="submit"
              className="flex h-[52px] w-full items-center justify-center rounded bg-white font-body text-[14px] font-bold uppercase leading-[1.43] tracking-[0.1em] text-black"
            >
              Subscribe
            </button>
          </form>
        </div>

        <div>
          {accordionColumns.map((column) => (
            <details
              key={column.title}
              className="group border-b border-[rgba(201,205,209,0.2)]"
            >
              <summary className="flex cursor-pointer items-center justify-between py-[14px] [&::-webkit-details-marker]:hidden">
                <span className="font-display text-[18px] uppercase leading-[1.56] tracking-[0.025em] text-white">
                  {column.title}
                </span>
                {/* Figma chevron; next/image is unnecessary for this local SVG. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${ICO}/chevron-down.svg`}
                  alt=""
                  width={12}
                  height={12}
                  className="h-3 w-3 transition-transform group-open:rotate-180"
                />
              </summary>
              <ul className="pb-4">
                {column.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="block py-[12px] font-body text-[14px] leading-[1.43] text-[#C9CDD1]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="font-display text-[20px] uppercase leading-[1.4] tracking-[0.05em] text-white">
            Our guarantee
          </h3>
          <a
            href="https://www.bbb.org/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3"
          >
            <Image
              src={`${IMG}/badge-bbb.png`}
              alt="BBB Accredited Business"
              width={161}
              height={61}
              className="h-[48px] w-auto shrink-0"
            />
            <span className="font-body text-[11px] leading-snug text-[#A6A6A6]">
              BBB Rating: A+
              <br />
              As of 9/2/2026
              <br />
              Click for Profile
            </span>
          </a>
        </div>

        <div className="flex flex-col gap-6">
          <h3 className="font-display text-[20px] uppercase leading-[1.4] tracking-[0.05em] text-white">
            Contact
          </h3>
          <div className="flex flex-col gap-6">
            <ContactRow icon="pin" href="https://maps.google.com/?q=Sacramento+CA+95838">
              Sacramento, CA 95838
            </ContactRow>
            <ContactRow icon="phone" href="tel:+19166164759">
              +1 (916) 616-4759
            </ContactRow>
            <ContactRow icon="mail" href="mailto:info@skytire.com">
              info@skytire.com
            </ContactRow>
            <a
              href="https://maps.google.com/?q=Sacramento+CA+95838"
              className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded border border-[rgba(201,205,209,0.3)] font-body text-[12px] font-bold uppercase leading-[1.33] tracking-[0.1em] text-[#C9CDD1]"
            >
              <ContactGlyph name="pin" className="text-[#C6A15B]" />
              Get Directions
            </a>
            <div className="relative h-[88px] overflow-hidden rounded border border-[#333438] bg-[#111]">
              <Image
                src={`${IMG}/map.png`}
                alt="Stylized map of California"
                fill
                className="object-cover object-center opacity-60"
                sizes="335px"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-[linear-gradient(0deg,rgba(11,11,12,0.6)_0%,rgba(11,11,12,0)_100%)]"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-[#333438] pt-4">
          <ul className="grid grid-cols-3 gap-y-2 text-center">
            {legalLinks.slice(0, 3).map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="font-body text-[11px] leading-[1.45] text-[#C9CDD1]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="col-span-3">
              <Link
                href={legalLinks[3].href}
                className="font-body text-[11px] leading-[1.45] text-[#C9CDD1]"
              >
                {legalLinks[3].label}
              </Link>
            </li>
          </ul>
          <p className="text-center font-body text-[11px] uppercase leading-[1.5] tracking-[0.1em] text-[rgba(201,205,209,0.6)]">
            © 2026 Sky Tire. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

function ContactRow({
  icon,
  href,
  children,
}: {
  icon: "pin" | "phone" | "mail";
  href: string;
  children: string;
}) {
  return (
    <a href={href} className="flex items-center gap-4">
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[rgba(201,205,209,0.3)]">
        <ContactGlyph name={icon} />
      </span>
      <span className="font-body text-[14px] leading-[1.43] text-[#C9CDD1]">{children}</span>
    </a>
  );
}

function ContactGlyph({ name, className = "" }: { name: "pin" | "phone" | "mail"; className?: string }) {
  const classNames = `h-3.5 w-3.5 fill-none stroke-current ${className}`;
  if (name === "phone") {
    return (
      <svg viewBox="0 0 24 24" className={classNames} aria-hidden>
        <path
          d="M7.2 3.8h2.4l1.2 3-1.6 1a12.5 12.5 0 0 0 6 6l1-1.6 3 1.2v2.4c0 .8-.7 1.6-1.5 1.7-7.2.8-13.1-5.1-12.3-12.3.1-.8.9-1.4 1.8-1.4Z"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (name === "mail") {
    return (
      <svg viewBox="0 0 24 24" className={classNames} aria-hidden>
        <rect x="3.5" y="5.5" width="17" height="13" rx="1.5" strokeWidth="1.5" />
        <path d="M4 7.2 12 13l8-5.8" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={classNames} aria-hidden>
      <path
        d="M12 21s7-5.33 7-11a7 7 0 1 0-14 0c0 5.67 7 11 7 11Z"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.4" strokeWidth="1.5" />
    </svg>
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
