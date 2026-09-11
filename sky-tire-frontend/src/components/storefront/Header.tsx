import type { ReactNode } from "react";
import Link from "next/link";
import Icon from "@/components/storefront/Icon";
import Logo from "@/components/storefront/Logo";
import { navItems } from "@/lib/storefront/content";

function SearchForm({ id }: { id: string }) {
  return (
    <form action="/products" method="get" className="relative">
      <label htmlFor={id} className="sr-only">
        Search products
      </label>
      <input
        id={id}
        name="search"
        placeholder="Search"
        className="h-10 w-full rounded border border-white/20 bg-transparent px-3 pr-9 text-[13px] text-white placeholder:text-[#9CA3AF] lg:w-[168px]"
      />
      <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2" aria-label="Submit search">
        <Icon name="search" alt="" size={14} />
      </button>
    </form>
  );
}

function ChevronRight({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M4.22 2.22a.75.75 0 0 1 1.06 0l3.5 3.5a.75.75 0 0 1 0 1.06l-3.5 3.5a.75.75 0 1 1-1.06-1.06L7.19 6 4.22 3.28a.75.75 0 0 1 0-1.06Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ChevronDown({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M2.22 4.22a.75.75 0 0 1 1.06 0L6 6.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L2.22 5.28a.75.75 0 0 1 0-1.06Z"
        fill="currentColor"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path
        d="M4.22 4.22a.75.75 0 0 1 1.06 0L9 7.94l3.72-3.72a.75.75 0 1 1 1.06 1.06L10.06 9l3.72 3.72a.75.75 0 1 1-1.06 1.06L9 10.06l-3.72 3.72a.75.75 0 0 1-1.06-1.06L7.94 9 4.22 5.28a.75.75 0 0 1 0-1.06Z"
        fill="currentColor"
      />
    </svg>
  );
}

const drawerLinks = [
  { label: "TIRES", href: "/products" },
  { label: "WHEELS", href: "/wheels" },
] as const;

const wireSubmenu = [
  { label: "72 Spoke", href: "/wire-wheels?spoke=72" },
  { label: "100 Spoke", href: "/wire-wheels?spoke=100" },
  { label: "150 Spoke", href: "/wire-wheels?spoke=150" },
  { label: "204 Spoke", href: "/wire-wheels?spoke=204" },
  { label: "Chrome", href: "/wire-wheels?finish=Chrome" },
  { label: "Gold", href: "/wire-wheels?finish=Gold" },
  { label: "Rose Gold", href: "/wire-wheels?finish=Rose%20Gold" },
  { label: "Reverse", href: "/wire-wheels?finish=Reverse" },
  { label: "Standard", href: "/wire-wheels?finish=Standard" },
  { label: "Bolt-On", href: "/bolt-on-wire-wheels" },
] as const;

const drawerTail = [
  { label: "WHITEWALL TIRES", href: "/products?sidewall=WHITE_WALL" },
  { label: "LOWRIDER", href: "/#shop-by-look" },
  { label: "ACCESSORIES", href: "/accessories" },
  { label: "BRANDS", href: "/brands" },
] as const;

function DrawerLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

function MobileNavDrawer() {
  const itemClass =
    "flex min-h-[52px] w-full items-center justify-between border-b border-white/10 px-4 font-body text-[13px] font-semibold uppercase leading-[1.5] tracking-[0.08em] text-white";

  return (
    <div
      className="nav-drawer-panel fixed inset-0 z-[100] h-dvh w-full flex-col bg-[#0B0B0C] pt-[env(safe-area-inset-top)] lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Sky Tire navigation"
    >
      <div className="relative flex h-16 shrink-0 items-center border-b border-white/10 px-4">
        <label
          htmlFor="storefront-nav-drawer"
          className="relative z-10 flex h-11 w-11 cursor-pointer items-center justify-center text-white"
          aria-label="Close menu"
        >
          <CloseIcon />
        </label>
        <p className="pointer-events-none absolute left-1/2 -translate-x-1/2 font-display text-[24px] leading-[1.33] tracking-[0.15em] text-white">
          SKY TIRE
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]">
        <form action="/products" method="get" className="px-4 py-4">
          <label htmlFor="mobile-drawer-search" className="sr-only">
            Search tires, wheels, or brands
          </label>
          <div className="relative">
            <input
              id="mobile-drawer-search"
              name="search"
              placeholder="Search tires, wheels, or brands..."
              className="h-11 w-full rounded-[4px] border border-white/20 bg-transparent py-2.5 pr-11 pl-3 font-body text-[13px] leading-[1.5] text-white placeholder:text-[#9CA3AF]"
            />
            <button
              type="submit"
              className="absolute top-1/2 right-3 -translate-y-1/2 text-[#9CA3AF]"
              aria-label="Submit search"
            >
              <Icon name="search" alt="" size={14} />
            </button>
          </div>
        </form>

        <nav aria-label="Mobile">
          {drawerLinks.map((item) => (
            <DrawerLink key={item.href + item.label} href={item.href} className={itemClass}>
              {item.label}
              <ChevronRight className="text-[#9CA3AF]" />
            </DrawerLink>
          ))}

          <details open className="nav-drawer-wire border-b border-white/10 bg-[rgba(198,161,91,0.08)]">
            <summary className="flex min-h-[52px] cursor-pointer items-center justify-between px-4 [&::-webkit-details-marker]:hidden">
              <span className="flex min-w-0 items-center gap-2">
                <span className="font-body text-[13px] font-semibold uppercase leading-[1.5] tracking-[0.08em] text-[#C6A15B]">
                  WIRE WHEELS
                </span>
                <span className="rounded-[2px] bg-[#C6A15B] px-1.5 py-px font-body text-[8px] font-bold uppercase leading-[1.5] tracking-[0.08em] text-[#0B0B0C]">
                  SPECIALTY
                </span>
              </span>
              <ChevronDown className="nav-drawer-chevron text-[#C6A15B]" />
            </summary>
            <div className="flex flex-col px-4 pt-1 pb-3 pl-6">
              {wireSubmenu.map((item) => (
                <DrawerLink
                  key={item.href + item.label}
                  href={item.href}
                  className="py-2.5 font-body text-[14px] leading-[1.43] text-[#C9CDD1]"
                >
                  {item.label}
                </DrawerLink>
              ))}
              <DrawerLink
                href="/#packages"
                className="mt-1 border-t border-white/10 pt-3 font-body text-[14px] leading-[1.43] text-[#C6A15B]"
              >
                Wire Wheel & Tire Packages
              </DrawerLink>
            </div>
          </details>

          {drawerTail.map((item) => (
            <DrawerLink key={item.href + item.label} href={item.href} className={itemClass}>
              {item.label}
              <ChevronRight className="text-[#9CA3AF]" />
            </DrawerLink>
          ))}

          <DrawerLink href="/products" className={itemClass}>
            <span>DEALS</span>
            <span className="font-body text-[14px] leading-none text-[#C6A15B]">%</span>
          </DrawerLink>
        </nav>
      </div>
    </div>
  );
}

export default function Header() {
  return (
    <>
      <header className="sticky top-0 z-50 bg-[#0B0B0C] text-white">
      <div className="mx-auto hidden h-[68px] w-full max-w-[1440px] items-center justify-between px-8 lg:flex">
        <Logo inverted />
        <nav aria-label="Primary" className="flex h-full items-center gap-7">
          {navItems.map((item) => (
            <Link
              key={item.href + item.label}
              href={item.href}
              className={`relative flex h-full items-center gap-1 font-nav text-[12px] font-semibold uppercase tracking-[0.06em] ${
                "active" in item && item.active ? "text-white" : "text-[#C9CDD1] hover:text-white"
              }`}
            >
              {item.label}
              {"hasMenu" in item && item.hasMenu ? <Icon name="chevron-down" alt="" size={9} /> : null}
              {"active" in item && item.active ? (
                <span className="absolute inset-x-0 bottom-0 h-[2px] bg-[#C6A15B]" aria-hidden />
              ) : null}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <SearchForm id="storefront-search" />
          <Link
            href="/auth/login"
            className="inline-flex h-[38px] w-[38px] items-center justify-center overflow-hidden"
            aria-label="Account"
          >
            <Icon name="user" alt="" size={38} />
          </Link>
          <Link
            href="/cart"
            className="relative inline-flex h-[38px] w-[38px] items-center justify-center rounded border border-white/20"
            aria-label="Cart, 0 items"
          >
            <Icon name="cart" alt="" size={18} />
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#C6A15B] px-1 font-nav text-[10px] font-bold text-[#0B0B0C]">
              0
            </span>
          </Link>
        </div>
      </div>

      <div className="relative flex h-[64px] items-center justify-between px-4 lg:hidden">
        <input id="storefront-nav-drawer" type="checkbox" className="sr-only" />
        <label
          htmlFor="storefront-nav-drawer"
          className="relative z-10 flex h-11 w-11 cursor-pointer flex-col items-center justify-center gap-1.5"
          aria-label="Open menu"
        >
          <span className="block h-px w-5 bg-white" />
          <span className="block h-px w-5 bg-white" />
          <span className="block h-px w-5 bg-white" />
        </label>
        <Logo inverted className="pointer-events-auto absolute left-1/2 -translate-x-1/2" />
        <Link href="/cart" className="relative z-10 inline-flex h-11 w-11 items-center justify-center" aria-label="Cart, 0 items">
          <Icon name="cart" alt="" size={18} />
          <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#C6A15B] px-1 font-nav text-[10px] font-bold text-[#0B0B0C]">
            0
          </span>
        </Link>
      </div>
      </header>
      <MobileNavDrawer />
    </>
  );
}
