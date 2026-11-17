import Link from "next/link";
import { ArrowLeft, Clapperboard } from "lucide-react";

export default function SiteNotFound() {
  return (
    <div className="container-page flex min-h-[80vh] flex-col items-center justify-center py-24 text-center">
      <span className="grid h-20 w-20 place-items-center rounded-3xl border border-gold/30 bg-gold/10 text-gold">
        <Clapperboard size={34} />
      </span>
      <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.24em] text-gold">
        404 · Scene missing
      </p>
      <h1 className="hero-title mt-2 text-7xl">Cut!</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-white/45">
        We could not find that page. The title may have been removed, renamed,
        or never made it past the edit room.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn-gold">
          <ArrowLeft size={16} /> Back to home
        </Link>
        <Link href="/movies" className="btn-ghost">
          Browse movies
        </Link>
      </div>
    </div>
  );
}
