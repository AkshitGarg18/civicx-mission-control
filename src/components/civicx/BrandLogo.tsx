import logoAsset from "@/assets/civicx-logo.png.asset.json";
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
      src={logoAsset.url}
      alt="CivicX"
      width={1295}
      height={595}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      className={cn("block h-auto object-contain", className)}
    />
  );
}