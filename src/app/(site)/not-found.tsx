import Link from "next/link";
import { ArrowLeft, Clapperboard } from "lucide-react";

export default function SiteNotFound() {
  return (
    <div className="container-page flex min-h-[80vh] flex-col items-center justify-center py-24 text-center">
      <span className="grid h-20 w-20 place-items-center rounded-2xl border border-brand/30 bg-brand/10 text-brand">
        <Clapperboard size={34} />
      </span>
      <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.24em] text-violet-300/80">
        404 · Scene missing
      </p>
      <h1 className="mt-2 text-6xl font-extrabold tracking-tight text-white sm:text-7xl">
        Cut!
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-site-muted">
        We could not find that page. The title may have been removed, renamed,
        or never made it past the edit room.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link href="/" className="flix-btn">
          <ArrowLeft size={16} /> Back to home
        </Link>
        <Link href="/movies" className="flix-btn flix-btn-secondary">
          Browse movies
        </Link>
      </div>
    </div>
  );
}
