"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, Film, Globe2, Search, Tv } from "lucide-react";
import { importMovieByNameAction } from "@/app/admin/actions/import";
import { SubmitButton } from "@/components/admin/submit-button";
import { MediaImage } from "@/components/site/media-image";
import { LANGUAGES } from "@/lib/languages";
import type { TmdbSearchResult } from "@/lib/types";

interface LookupResult {
  year: string | null;
  country: string | null;
  title?: string | null;
}

function resultTitle(result: TmdbSearchResult) {
  return result.title || result.name || "";
}

function resultYear(result: TmdbSearchResult) {
  const date = result.release_date || result.first_air_date || "";
  return date.slice(0, 4);
}

function resultPoster(result: TmdbSearchResult) {
  return result.poster_path
    ? `https://image.tmdb.org/t/p/w92${result.poster_path}`
    : null;
}

export function ImportForm({ disabled = false }: { disabled?: boolean }) {
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("");
  const [country, setCountry] = useState("");
  const [detected, setDetected] = useState<LookupResult | null>(null);
  const [results, setResults] = useState<TmdbSearchResult[]>([]);
  const [selected, setSelected] = useState<TmdbSearchResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [searching, setSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const touched = useRef({ year: false, country: false });
  const boxRef = useRef<HTMLDivElement>(null);

  const lookupQuery = selected ? resultTitle(selected) : query.trim();
  const visibleResults =
    !disabled &&
    query.trim().length >= 2 &&
    !(selected && query.trim() === resultTitle(selected))
      ? results
      : [];
  const dropdownOpen = showResults && visibleResults.length > 0;

  useEffect(() => {
    const value = query.trim();
    if (
      disabled ||
      value.length < 2 ||
      (selected && value === resultTitle(selected))
    ) {
      return;
    }

    let active = true;
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const response = await fetch(
          `/api/admin/tmdb/search?q=${encodeURIComponent(value)}`,
        );
        if (!response.ok) return;
        const data = (await response.json()) as {
          results?: TmdbSearchResult[];
        };
        if (!active) return;
        setResults(Array.isArray(data.results) ? data.results : []);
        setActiveIndex(0);
        setShowResults(true);
      } catch {
        if (active) setResults([]);
      } finally {
        if (active) setSearching(false);
      }
    }, 300);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [query, disabled, selected]);

  useEffect(() => {
    if (disabled || lookupQuery.length < 2) return;

    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/admin/tmdb/lookup?q=${encodeURIComponent(lookupQuery)}`,
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
  }, [lookupQuery, disabled]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const chooseResult = (result: TmdbSearchResult) => {
    const title = resultTitle(result);
    const autoYear = resultYear(result);
    setSelected(result);
    setQuery(title);
    setYear(autoYear);
    setCountry("");
    setDetected({ year: autoYear || null, country: null, title });
    touched.current = { year: false, country: false };
    setShowResults(false);
    setResults([]);
  };

  return (
    <div>
      <form
        action={importMovieByNameAction}
        className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.4fr_0.7fr_0.8fr_0.8fr_auto]"
      >
        <input
          type="hidden"
          name="tmdbId"
          value={selected?.id ? String(selected.id) : ""}
        />
        <input
          type="hidden"
          name="mediaType"
          value={selected?.media_type || ""}
        />
        <div className="relative md:col-span-2 xl:col-span-1" ref={boxRef}>
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
              setSelected(null);
              touched.current = { year: false, country: false };
              setActiveIndex(0);
              if (value.trim().length < 2) setDetected(null);
            }}
            onFocus={() => {
              if (visibleResults.length > 0) setShowResults(true);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setShowResults(false);
                return;
              }
              if (!visibleResults.length) return;
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setShowResults(true);
                setActiveIndex((index) =>
                  Math.min(index + 1, visibleResults.length - 1),
                );
                return;
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                setShowResults(true);
                setActiveIndex((index) => Math.max(index - 1, 0));
                return;
              }
              if (event.key === "Enter" && dropdownOpen && !selected) {
                event.preventDefault();
                chooseResult(
                  visibleResults[
                    Math.min(activeIndex, visibleResults.length - 1)
                  ],
                );
              }
            }}
            required
            disabled={disabled}
            autoComplete="off"
            placeholder="Movie or series title, e.g. Heartland…"
            className="input h-12 pl-11"
            role="combobox"
            aria-controls="tmdb-search-options"
            aria-expanded={dropdownOpen}
            aria-autocomplete="list"
          />
          {dropdownOpen ? (
            <div
              id="tmdb-search-options"
              role="listbox"
              className="absolute left-0 right-0 top-full z-[100] mt-1 max-h-80 overflow-y-auto rounded-xl border border-white/10 bg-[#11141d] p-1.5 shadow-2xl shadow-black/50"
            >
              {searching ? (
                <p className="px-3 py-2 text-[11px] text-white/40">
                  Searching TMDB…
                </p>
              ) : null}
              {visibleResults.map((result, index) => {
                const title = resultTitle(result);
                return (
                  <button
                    key={`${result.media_type}-${result.id}`}
                    type="button"
                    role="option"
                    aria-selected={index === activeIndex}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => chooseResult(result)}
                    className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition ${
                      index === activeIndex
                        ? "bg-gold/15 text-white"
                        : "text-white/70 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <MediaImage
                      src={resultPoster(result)}
                      alt={title}
                      className="h-14 w-10 shrink-0 rounded object-cover"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">
                        {title}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-white/40">
                        {resultYear(result) || "—"} ·{" "}
                        {result.media_type === "tv" ? "TV" : "Movie"}
                      </span>
                    </span>
                    {result.media_type === "tv" ? (
                      <Tv size={14} className="shrink-0 text-white/25" />
                    ) : (
                      <Film size={14} className="shrink-0 text-white/25" />
                    )}
                  </button>
                );
              })}
            </div>
          ) : null}
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
        {selected
          ? `Selected TMDB match: ${resultTitle(selected)} (${resultYear(selected) || "year unknown"}). Pick another result from the dropdown to change it.`
          : detected?.year || detected?.country
            ? `Auto-selected from TMDB: ${[detected.title, detected.year, detected.country].filter(Boolean).join(" · ")}. Pick a result from the dropdown or edit the fields to override.`
            : "Type at least 2 characters to see matching TMDB titles. Pick one to import that exact result."}
      </p>
    </div>
  );
}
