export const SPECIAL_CATEGORIES = [
  {
    name: "Indonesian Movies",
    slug: "indonesian-movies",
    description: "Indonesian cinema — chilling horror, action and heartfelt drama.",
    image_url: "/categories/indonesian.svg",
    sort_order: 90,
  },
  {
    name: "Chinese Movies",
    slug: "chinese-movies",
    description: "Mainland, Hong Kong and Taiwanese favourites in one place.",
    image_url: "/categories/chinese.svg",
    sort_order: 100,
  },
  {
    name: "Bangla Movies",
    slug: "bangla-movies",
    description: "Bengali stories from Dhaka to Kolkata, films and web series.",
    image_url: "/categories/bangla.svg",
    sort_order: 110,
  },
  {
    name: "Bollywood Movies",
    slug: "bollywood-movies",
    description: "Hindi cinema’s biggest stars, songs and spectacles.",
    image_url: "/categories/bollywood.svg",
    sort_order: 120,
  },
  {
    name: "South Indian Movies",
    slug: "south-indian-movies",
    description: "Telugu, Tamil, Malayalam and Kannada blockbusters.",
    image_url: "/categories/south-indian.svg",
    sort_order: 130,
  },
] as const;

const SPECIAL_CATEGORY_ALIASES = [
  "indonesia-movie",
  "chinese-movies",
  "bangla-web-series",
];

const SLUGS: string[] = [
  ...SPECIAL_CATEGORIES.map((category) => category.slug),
  ...SPECIAL_CATEGORY_ALIASES,
];

export function isSpecialCategory(slug: string): boolean {
  return SLUGS.includes(slug);
}
