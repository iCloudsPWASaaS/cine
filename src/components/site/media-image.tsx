/* eslint-disable @next/next/no-img-element */
import { getInitials } from "@/lib/utils";

interface MediaImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  title?: string;
  priority?: boolean;
  loading?: "eager" | "lazy";
}

export function MediaImage({
  src,
  alt,
  className,
  title,
  priority,
  loading,
}: MediaImageProps) {
  if (!src) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-white/10 via-white/[0.04] to-transparent ${className || ""}`}
      >
        <span className="display text-3xl text-white/30">
          {getInitials(title || alt || "CW")}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
        loading={priority ? "eager" : loading || "lazy"}
        fetchPriority={priority ? "high" : undefined}
        decoding="async"
        className={className}
    />
  );
}
