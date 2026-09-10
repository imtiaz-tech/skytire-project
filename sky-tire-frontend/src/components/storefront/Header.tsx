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

export default function Header() {
  return (
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
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#C6A15B] px-1 font-nav text-[10px] font-bold text-[#0B0B0C]">
              0
            </span>
          </Link>
        </div>
      </div>

      <div className="relative flex h-[64px] items-center justify-between px-4 lg:hidden">
        <details className="storefront-menu relative z-10">
          <summary
            className="flex h-11 w-11 cursor-pointer list-none flex-col items-center justify-center gap-1.5 [&::-webkit-details-marker]:hidden"
            aria-label="Open menu"
          >
            <span className="block h-px w-5 bg-white" />
            <span className="block h-px w-5 bg-white" />
            <span className="block h-px w-5 bg-white" />
          </summary>
          <div className="absolute inset-x-0 top-[64px] z-40 max-h-[calc(100dvh-64px)] overflow-y-auto border-t border-white/10 bg-[#0B0B0C] px-4 py-4">
            <div className="mb-4">
              <SearchForm id="mobile-search" />
            </div>
            <nav aria-label="Mobile">
              <ul>
                {navItems.map((item) => (
                  <li key={item.href + item.label}>
                    <Link
                      href={item.href}
                      className="block border-b border-white/10 py-4 font-nav text-[13px] font-semibold uppercase tracking-[0.08em] text-white"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href="/auth/login"
                    className="block py-4 font-nav text-[13px] font-semibold uppercase tracking-[0.08em] text-white"
                  >
                    Account
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </details>
        <Logo inverted className="pointer-events-auto absolute left-1/2 -translate-x-1/2" />
        <Link href="/cart" className="relative z-10 inline-flex h-11 w-11 items-center justify-center" aria-label="Cart, 0 items">
          <Icon name="cart" alt="" size={18} />
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#C6A15B] px-1 font-nav text-[10px] font-bold text-[#0B0B0C]">
            0
          </span>
        </Link>
      </div>
    </header>
  );
}
