import { cn } from "@/lib/utils";

export function BrandLogo({
  className,
  eager = false,
}: {
  className?: string | undefined;
  eager?: boolean;
}) {
  return (
    <img
      src="/logo.png"
      alt="CivicX"
      width={1536}
      height={1024}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      className={cn("block h-auto object-contain", className)}
    />
  );
}