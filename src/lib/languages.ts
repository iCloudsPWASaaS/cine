export interface LanguageOption {
  name: string;
  aliases: string[];
}

export const LANGUAGES: LanguageOption[] = [
  { name: "Hindi", aliases: ["hindi", "hin", "hi", "हिंदी", "हिन्दी"] },
  { name: "English", aliases: ["english", "eng", "en"] },
  { name: "Bengali", aliases: ["bengali", "bangla", "ben", "bn", "বাংলা"] },
  { name: "Tamil", aliases: ["tamil", "tam", "ta", "தமிழ்"] },
  { name: "Telugu", aliases: ["telugu", "tel", "te", "తెలుగు"] },
  { name: "Urdu", aliases: ["urdu", "urd", "ur", "اردو"] },
  { name: "Arabic", aliases: ["arabic", "ara", "ar", "العربية"] },
  { name: "Spanish", aliases: ["spanish", "español", "spa", "es"] },
  { name: "French", aliases: ["french", "français", "fre", "fra", "fr"] },
];

export const OTHER_LANGUAGE = "Other";

const LANGUAGE_CODES: Record<string, string> = {
  Hindi: "hi",
  English: "en",
  Bengali: "bn",
  Tamil: "ta",
  Telugu: "te",
  Urdu: "ur",
  Arabic: "ar",
  Spanish: "es",
  French: "fr",
};

export function languageCode(value: string | null | undefined): string | null {
  const name = canonicalLanguage(value);
  if (!name) return null;
  return LANGUAGE_CODES[name] || null;
}

export function canonicalLanguage(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  const raw = value.trim().toLowerCase();
  if (!raw || raw === "other" || raw === "unknown" || raw === "auto") {
    return null;
  }
  for (const language of LANGUAGES) {
    if (language.aliases.some((alias) => alias.toLowerCase() === raw)) {
      return language.name;
    }
  }
  return null;
}

export function normalizeLanguage(
  value: string | null | undefined,
): string {
  return canonicalLanguage(value) ?? OTHER_LANGUAGE;
}

export function detectLanguageFromText(
  text: string | null | undefined,
): string | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  for (const language of LANGUAGES) {
    for (const alias of language.aliases) {
      const value = alias.toLowerCase();
      if (/^[a-z]{2,3}$/.test(value)) {
        const pattern = new RegExp(
          `(?:^|[^a-z0-9])${value}(?:$|[^a-z0-9])`,
          "i",
        );
        if (pattern.test(lower)) return language.name;
      } else if (lower.includes(value)) {
        return language.name;
      }
    }
  }
  return null;
}

export function groupSourcesByLanguage<T extends { language: string | null }>(
  sources: T[],
): { name: string; sources: T[] }[] {
  const groups = new Map<string, T[]>();
  for (const source of sources) {
    const name = normalizeLanguage(source.language);
    const list = groups.get(name) || [];
    list.push(source);
    groups.set(name, list);
  }

  const ordered: { name: string; sources: T[] }[] = [];
  for (const language of LANGUAGES) {
    const list = groups.get(language.name);
    if (list?.length) ordered.push({ name: language.name, sources: list });
  }
  const other = groups.get(OTHER_LANGUAGE);
  if (other?.length) ordered.push({ name: OTHER_LANGUAGE, sources: other });
  return ordered;
}
