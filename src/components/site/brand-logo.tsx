import Image from "next/image";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  label?: string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
}

export function BrandLogo({
  label = "Cinewood",
  className,
  imageClassName,
  priority,
}: BrandLogoProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white px-2 py-1 shadow-[0_8px_30px_-14px_rgba(0,0,0,0.9)]",
        className,
      )}
    >
      <Image
        src="/logo-black.png"
        alt={label}
        width={512}
        height={196}
        priority={priority}
        className={cn("h-full w-auto object-contain", imageClassName)}
      />
    </span>
  );
}
