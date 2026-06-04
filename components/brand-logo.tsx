import Image from "next/image";

type BrandLogoProps = {
  className?: string;
  framed?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "mark" | "full";
};

const frameSizes = {
  sm: "h-10 w-10",
  md: "h-12 w-12",
  lg: "h-16 w-16",
  xl: "h-28 w-28 sm:h-32 sm:w-32"
};

const imageSizes = {
  sm: 40,
  md: 48,
  lg: 64,
  xl: 128
};

export function BrandLogo({
  className = "",
  framed = true,
  size = "md",
  variant = "mark"
}: BrandLogoProps) {
  const src = variant === "full" ? "/king-logo.png" : "/king-logo-mark.png";
  const frameClass = framed
    ? "overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-primary/15"
    : "overflow-visible bg-transparent";

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center ${frameClass} ${frameSizes[size]} ${className}`}
    >
      <Image
        src={src}
        alt="KING English Class"
        width={imageSizes[size]}
        height={imageSizes[size]}
        priority={size === "xl"}
        className={`h-full w-full object-contain ${framed ? "p-1.5" : "p-0"}`}
      />
    </div>
  );
}
