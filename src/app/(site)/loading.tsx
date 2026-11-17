export default function SiteLoading() {
  return (
    <div>
      <div className="min-h-[620px] w-full animate-pulse bg-white/[0.04]" />
      <div className="container-page space-y-14 py-12">
        {[0, 1, 2].map((row) => (
          <div key={row}>
            <div className="mb-5 h-8 w-56 animate-pulse rounded-lg bg-white/[0.06]" />
            <div className="flex gap-4 overflow-hidden">
              {Array.from({ length: 7 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[260px] w-[170px] shrink-0 animate-pulse rounded-2xl bg-white/[0.04]"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
