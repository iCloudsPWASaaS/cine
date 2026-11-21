"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, Globe2, Search } from "lucide-react";
import { importMovieByNameAction } from "@/app/admin/actions/import";
import { SubmitButton } from "@/components/admin/submit-button";
import { LANGUAGES } from "@/lib/languages";

interface LookupResult {
  year: string | null;
  country: string | null;
  title?: string | null;
}

export function ImportForm({ disabled = false }: { disabled?: boolean }) {
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("");
  const [country, setCountry] = useState("");
  const [detected, setDetected] = useState<LookupResult | null>(null);
  const touched = useRef({ year: false, country: false });

  useEffect(() => {
    const value = query.trim();
    if (disabled || value.length < 2) {
      return;
    }

    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/admin/tmdb/lookup?q=${encodeURIComponent(value)}`,
        );
        if (!response.ok) return;
        const data = (await response.json()) as LookupResult;
        if (!active) return;
        if (!touched.current.year) setYear(data.year || "");
        if (!touched.current.country) setCountry(data.country || "");
        setDetected(data);
      } catch {
        // Leave the current values in place if the lookup fails.
      }
    }, 450);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [query, disabled]);

  return (
    <div>
      <form
        action={importMovieByNameAction}
        className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.4fr_0.7fr_0.8fr_0.8fr_auto]"
      >
        <div className="relative md:col-span-2 xl:col-span-1">
          <Search
            size={17}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35"
          />
          <input
            name="query"
            value={query}
            onChange={(event) => {
              const value = event.target.value;
              setQuery(value);
              touched.current = { year: false, country: false };
              if (value.trim().length < 2) setDetected(null);
            }}
            required
            disabled={disabled}
            placeholder="Movie or series title, e.g. Heartland…"
            className="input h-12 pl-11"
          />
        </div>
        <div className="relative">
          <CalendarDays
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35"
          />
          <input
            name="year"
            value={year}
            onChange={(event) => {
              touched.current.year = true;
              setYear(event.target.value);
            }}
            disabled={disabled}
            inputMode="numeric"
            maxLength={4}
            placeholder="Year"
            aria-label="Release year"
            className="input h-12 pl-10"
          />
        </div>
        <div className="relative">
          <Globe2
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35"
          />
          <input
            name="country"
            value={country}
            onChange={(event) => {
              touched.current.country = true;
              setCountry(event.target.value);
            }}
            disabled={disabled}
            placeholder="Country"
            aria-label="Production country"
            className="input h-12 pl-10"
          />
        </div>
        <select
          name="language"
          defaultValue=""
          aria-label="Preferred audio language"
          className="input h-12 [&>option]:bg-[#11141d] [&>option]:text-white"
        >
          <option value="">Auto audio</option>
          {LANGUAGES.map((language) => (
            <option key={language.name} value={language.name}>
              {language.name}
            </option>
          ))}
        </select>
        <SubmitButton
          className="btn-gold h-12 shrink-0"
          pendingText="Importing…"
        >
          <Search size={16} /> Search &amp; grab
        </SubmitButton>
      </form>

      <p className="mt-2 text-[11px] text-white/30">
        {detected?.year || detected?.country
          ? `Auto-selected from TMDB: ${[detected.title, detected.year, detected.country].filter(Boolean).join(" · ")}. Edit the fields above to override.`
          : "Year and country are auto-selected from TMDB while you type. Edit them to override."}
      </p>
    </div>
  );
}
