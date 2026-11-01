import type { MetadataRoute } from "next";
import pokemonData from "./data/pokemon.json";
import { SITE_URL } from "./site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...pokemonData.pokemon.map((p) => ({
      url: `${SITE_URL}/${p.key}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
