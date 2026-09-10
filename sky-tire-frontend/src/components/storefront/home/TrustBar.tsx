import Icon from "@/components/storefront/Icon";
import Container from "@/components/storefront/Container";
import { trustItems } from "@/lib/storefront/content";

export default function TrustBar() {
  return (
    <section className="border-b border-white/10 bg-[#202124] text-white lg:border-[#333438] lg:bg-[#0B0B0C]">
      <Container className="hidden h-14 items-center justify-between lg:flex">
        {trustItems.map((item, index) => (
          <div key={item.icon} className="flex items-center">
            {index > 0 ? <span className="mx-4 h-6 w-px bg-white/15" aria-hidden /> : null}
            <div className="flex items-center gap-3">
              <Icon name={item.icon} alt="" size={18} />
              <span className="font-nav text-[12px] font-medium text-white">{item.label}</span>
            </div>
          </div>
        ))}
      </Container>
      <div className="hide-scrollbar flex gap-2 overflow-x-auto px-4 py-4 lg:hidden">
        {trustItems.map((item) => (
          <div
            key={item.icon}
            className="flex h-10 shrink-0 items-center gap-2 rounded border border-white/20 px-3.5"
          >
            <Icon name={item.icon} alt="" size={16} />
            <span className="whitespace-nowrap text-[11px] leading-none text-white">{item.mobileLabel}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
