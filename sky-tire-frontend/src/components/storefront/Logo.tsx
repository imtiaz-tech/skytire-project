import Link from "next/link";
import Icon from "@/components/storefront/Icon";

export default function Logo({
  inverted = false,
  className = "",
}: {
  inverted?: boolean;
  className?: string;
}) {
  const color = inverted ? "text-white" : "text-[#0B0B0C]";

  return (
    <Link href="/" className={`flex items-center ${className}`} aria-label="Sky Tire home">
      <Icon name="logo-mark" alt="" size={22} className="mx-1.5" />
      <span className={`font-display text-[22px] leading-none tracking-[0.18em] ${color}`}>SKY</span>
      <span className={`font-display text-[22px] leading-none tracking-[0.18em] ${color}`}>TIRE</span>
    </Link>
  );
}
