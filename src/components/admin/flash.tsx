import { CheckCircle2, TriangleAlert } from "lucide-react";

function first(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function Flash({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const error = first(searchParams?.error);
  const ok = first(searchParams?.ok);
  if (!error && !ok) return null;

  return (
    <div
      className={`mb-5 flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm ${
        error
          ? "border-red-500/30 bg-red-500/10 text-red-200"
          : "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
      }`}
    >
      {error ? (
        <TriangleAlert size={17} className="mt-0.5 shrink-0" />
      ) : (
        <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
      )}
      <span>{error || ok}</span>
    </div>
  );
}
