import Link from "next/link";

type CtaButtonProps = {
  href: string;
  children: React.ReactNode;
  variant?: "gold" | "outline" | "solid";
  className?: string;
};

export default function CtaButton({
  href,
  children,
  variant = "gold",
  className = "",
}: CtaButtonProps) {
  const styles =
    variant === "solid"
      ? "bg-[#C6A15B] text-[#0B0B0C] border-[#C6A15B] hover:bg-[#d4af37]"
      : variant === "outline"
        ? "bg-transparent text-white border-[#C6A15B] hover:bg-[#C6A15B] hover:text-[#0B0B0C]"
        : "bg-[#0B0B0C] text-white border-[#C6A15B] hover:bg-[#C6A15B] hover:text-[#0B0B0C]";

  return (
    <Link
      href={href}
      className={`inline-flex h-10 items-center justify-center border px-5 font-nav text-[12px] font-semibold uppercase tracking-[0.12em] transition-colors ${styles} ${className}`}
    >
      {children}
    </Link>
  );
}
