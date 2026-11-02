"use client";

import { useSyncExternalStore } from "react";
import styles from "../pokedex.module.css";
import { parseFavorites, readFavorites, saveFavorites, subscribeFavorites } from "../favorites";

export function FavoriteButton({ pokemonKey }: { pokemonKey: string }) {
  const raw = useSyncExternalStore(subscribeFavorites, readFavorites, () => "[]");
  const favorites = parseFavorites(raw);
  const isFavorite = favorites.has(pokemonKey);

  function toggle() {
    const next = new Set(favorites);
    if (next.has(pokemonKey)) next.delete(pokemonKey);
    else next.add(pokemonKey);
    saveFavorites(next);
  }

  return (
    <button type="button" className={styles.favButton} aria-pressed={isFavorite} onClick={toggle}>
      <span>{isFavorite ? "Desfavoritar" : "Favoritar"}</span>
      <svg
        className={styles.favHeart}
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill={isFavorite ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
    </button>
  );
}
