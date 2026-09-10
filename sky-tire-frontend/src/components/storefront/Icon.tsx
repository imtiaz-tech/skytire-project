import { ICO } from "@/lib/storefront/content";

type IconProps = {
  name: string;
  alt: string;
  size?: number;
  className?: string;
};

export default function Icon({ name, alt, size = 20, className = "" }: IconProps) {
  return (
    <span
      className={`inline-flex shrink-0 overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      {/* SVG icons are tiny local assets; next/image is unnecessary here. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${ICO}/${name}.svg`}
        alt={alt}
        width={size}
        height={size}
        className="h-full w-full object-contain"
      />
    </span>
  );
}
