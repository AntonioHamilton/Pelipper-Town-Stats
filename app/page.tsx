"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import styles from "./pokedex.module.css";
import pokemonData from "./data/pokemon.json";
import { SiteFooter } from "./site-footer";
import { JOB_NAMES, Lang, STAT_COLORS, TYPE_NAMES, TYPE_STYLE } from "./labels";


type Pokemon = {
  key: string;
  dex: number;
  name: string;
  group: string;
  types: string[];
  sprite: string | null;
  stats: number[];
  jobs: string[];
  derived?: boolean;
};

type Group = { id: string; label: Record<Lang, string> };

const data = pokemonData as { groups: Group[]; pokemon: Pokemon[] };

const MAX_STAT = 255;
const ALL = "all";
const FAVORITES = "favorites";
const MEGA = "mega";
const MEGA_GROUP = "mega_evolutions";
const PAGE_SIZE = 50;

// Primeiro número da Pokédex de cada geração, da 1 à 9.
const GEN_FIRST_DEX = [1, 152, 252, 387, 494, 650, 722, 810, 906];

function generationOf(dex: number): number {
  return GEN_FIRST_DEX.filter((first) => dex >= first).length;
}

const LAST_GENERATION = generationOf(Math.max(...data.pokemon.map((p) => p.dex)));
const GENERATIONS = Array.from({ length: LAST_GENERATION }, (_, i) => i + 1);

const UI = {
  pt: {
    title: "Pelipper Town Stats",
    logoAlt: "Logo Pelipper Town",
    languageLabel: "Idioma",
    searchPlaceholder: "Buscar Pokémon por nome ou número...",
    searchLabel: "Buscar Pokémon",
    groupsLabel: "Grupos de Pokémon",
    typeSelectLabel: "Tipo de Pokémon",
    sortLabel: "Ordenar por",
    sortDex: "Número da Pokédex",
    sortTotal: "Força total",
    sortAlpha: "Ordem alfabética",
    all: "Todos",
    favorites: "Favoritos",
    sortFavorites: "Favoritos primeiro",
    noFavorites: "Nenhum favorito ainda.",
    searchFieldLabel: "Busca",
    typeFilterLabel: "Tipo",
    showLabel: "Mostrar",
    allTypes: "Todos os tipos",
    generation: "Geração",
    megaEvolutions: "Mega evoluções",
    pokemonCount: "Pokémon",
    foundAll: "encontrados em todas as abas",
    empty: "Nenhum Pokémon encontrado.",
    total: "Total",
    derivedNote: "Stats calculados a partir da forma base",
    favorite: "Favoritar",
    unfavorite: "Desfavoritar",
    copyright: "Chat 🤖",
    portfolio: "Portfólio",
    stats: ["HP", "Ataque", "Defesa", "Ataque Especial", "Defesa Especial", "Velocidade"],
  },
  en: {
    title: "Pelipper Town Stats",
    logoAlt: "Pelipper Town logo",
    languageLabel: "Language",
    searchPlaceholder: "Search Pokémon by name or number...",
    searchLabel: "Search Pokémon",
    groupsLabel: "Pokémon groups",
    typeSelectLabel: "Pokémon group",
    sortLabel: "Sort by",
    sortDex: "Pokédex number",
    sortTotal: "Total power",
    sortAlpha: "Alphabetical order",
    all: "All",
    favorites: "Favorites",
    sortFavorites: "Favorites first",
    noFavorites: "No favorites yet.",
    searchFieldLabel: "Search",
    typeFilterLabel: "Type",
    showLabel: "Show",
    allTypes: "All types",
    generation: "Generation",
    megaEvolutions: "Mega evolutions",
    pokemonCount: "Pokémon",
    foundAll: "found in all groups",
    empty: "No Pokémon found.",
    total: "Total",
    derivedNote: "Stats calculated from the base form",
    favorite: "Favorite",
    unfavorite: "Unfavorite",
    copyright: "Chat 🤖",
    portfolio: "Portfolio",
    stats: ["HP", "Attack", "Defense", "Sp. Attack", "Sp. Defense", "Speed"],
  },
} as const;

const LOCALE: Record<Lang, string> = { pt: "pt-BR", en: "en-US" };


const FAVORITES_KEY = "pelipper-favorites";
const FAVORITES_EVENT = "pelipper-favorites-change";

function readFavorites(): string {
  try {
    return window.localStorage.getItem(FAVORITES_KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

function subscribeFavorites(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(FAVORITES_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(FAVORITES_EVENT, onChange);
  };
}

function parseFavorites(raw: string): Set<string> {
  try {
    const list: unknown = JSON.parse(raw);
    return new Set(Array.isArray(list) ? list.filter((k) => typeof k === "string") : []);
  } catch {
    return new Set();
  }
}

function saveFavorites(favorites: Set<string>) {
  try {
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites]));
  } catch {
    // Armazenamento indisponível: o favorito não persiste nesta sessão.
  }
  window.dispatchEvent(new Event(FAVORITES_EVENT));
}

const totalOf = (p: Pokemon) => p.stats.reduce((a, b) => a + b, 0);

function compareFor(
  sortKey: string,
  lang: Lang,
  favorites: Set<string>,
): (a: Pokemon, b: Pokemon) => number {
  const byDex = (a: Pokemon, b: Pokemon) => a.dex - b.dex;
  if (sortKey === "favorites") {
    return (a, b) => Number(favorites.has(b.key)) - Number(favorites.has(a.key)) || byDex(a, b);
  }
  if (sortKey === "alpha") {
    return (a, b) => a.name.localeCompare(b.name, LOCALE[lang]) || byDex(a, b);
  }
  if (sortKey === "total") {
    return (a, b) => totalOf(b) - totalOf(a) || byDex(a, b);
  }
  if (sortKey.startsWith("stat-")) {
    const i = Number(sortKey.slice(5));
    return (a, b) => b.stats[i] - a.stats[i] || byDex(a, b);
  }
  return byDex;
}

type Option = { value: string; label: string };

function CenteredSelect({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  ariaLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const current = options.find((o) => o.value === value)?.label ?? "";

  useEffect(() => {
    if (open) listRef.current?.scrollIntoView({ block: "center" });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className={styles.dropdown} ref={rootRef}>
      <button
        type="button"
        className={styles.dropdownButton}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {current}
      </button>
      {open && (
        <ul ref={listRef} className={styles.dropdownList} role="listbox" aria-label={ariaLabel}>
          {options.map((o) => (
            <li
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              className={styles.dropdownOption}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
            >
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function JobIcon({ job, label }: { job: string; label: string }) {
  const [hover, setHover] = useState(false);
  const [pinned, setPinned] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!pinned) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setPinned(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [pinned]);

  const open = hover || pinned;

  return (
    <span
      ref={rootRef}
      className={styles.jobWrap}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <button
        type="button"
        className={styles.jobSlot}
        aria-label={label}
        onClick={() => setPinned((o) => !o)}
      >
        <Image src={`/jobs/${job.toLowerCase()}.png`} alt="" width={32} height={32} unoptimized />
      </button>
      {open && (
        <span role="tooltip" className={styles.jobTooltip}>
          {label}
        </span>
      )}
    </span>
  );
}

export default function Home() {
  const [lang, setLang] = useState<Lang>("pt");
  const [activeGroup, setActiveGroup] = useState(ALL);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState("dex");
  const [typeFilter, setTypeFilter] = useState(ALL);
  const [page, setPage] = useState({ key: "", count: PAGE_SIZE });

  const favoritesRaw = useSyncExternalStore(subscribeFavorites, readFavorites, () => "[]");
  const favorites = useMemo(() => parseFavorites(favoritesRaw), [favoritesRaw]);

  function toggleFavorite(key: string) {
    const next = new Set(favorites);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    saveFavorites(next);
  }

  const t = UI[lang];
  const search = query.trim().toLowerCase();

  const tabs = useMemo(
    () => [
      { id: FAVORITES, label: t.favorites },
      { id: ALL, label: t.all },
      ...GENERATIONS.map((g) => ({ id: `gen-${g}`, label: `${t.generation} ${g}` })),
      { id: MEGA, label: t.megaEvolutions },
    ],
    [t],
  );

  const sortOptions = useMemo(
    () => [
      { value: "dex", label: t.sortDex },
      { value: "favorites", label: t.sortFavorites },
      ...t.stats.map((label, i) => ({ value: `stat-${i}`, label })),
      { value: "total", label: t.sortTotal },
      { value: "alpha", label: t.sortAlpha },
    ],
    [t],
  );

  const typeOptions = useMemo(
    () => [
      { value: ALL, label: t.allTypes },
      ...Object.keys(TYPE_STYLE).map((type) => ({ value: type, label: TYPE_NAMES[lang][type] })),
    ],
    [lang, t.allTypes],
  );

  const list = useMemo(() => {
    let base: Pokemon[];
    if (search) {
      base = data.pokemon.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.key.includes(search) ||
          String(p.dex) === search,
      );
    } else if (activeGroup === ALL) {
      base = data.pokemon;
    } else if (activeGroup === FAVORITES) {
      base = data.pokemon.filter((p) => favorites.has(p.key));
    } else if (activeGroup === MEGA) {
      base = data.pokemon.filter((p) => p.group === MEGA_GROUP);
    } else {
      const gen = Number(activeGroup.slice("gen-".length));
      base = data.pokemon.filter((p) => generationOf(p.dex) === gen);
    }
    if (typeFilter !== ALL) {
      base = base.filter((p) => p.types.includes(typeFilter));
    }
    return [...base].sort(compareFor(sortKey, lang, favorites));
  }, [search, activeGroup, sortKey, typeFilter, lang, favorites]);

  // Quantos cards mostrar: volta para PAGE_SIZE sempre que o filtro/ordenação muda.
  const filterKey = `${lang}|${activeGroup}|${search}|${sortKey}|${typeFilter}`;
  const visibleCount = page.key === filterKey ? page.count : PAGE_SIZE;
  const shown = list.slice(0, visibleCount);
  const hasMore = visibleCount < list.length;

  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setPage({ key: filterKey, count: visibleCount + PAGE_SIZE });
        }
      },
      { rootMargin: "400px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [filterKey, hasMore, visibleCount]);

  function selectGroup(id: string) {
    setActiveGroup(id);
    setQuery("");
  }

  return (
    <main className={styles.page}>
      <div className={styles.layout}>
        <header className={styles.brand}>
          <div className={styles.heroRow}>
          <Image
            className={styles.logo}
            src="/Logo.webp"
            alt={t.logoAlt}
            width={112}
            height={112}
            unoptimized
          />
          <div className={styles.topbar}>
            <button
              type="button"
              className={styles.flagButton}
              aria-label="Português (Brasil)"
              aria-pressed={lang === "pt"}
              title="Português"
              onClick={() => setLang("pt")}
            >
              <span className={styles.flag}>
                <Image src="/flags/br.svg" alt="" width={36} height={26} unoptimized />
              </span>
            </button>
            <button
              type="button"
              className={styles.flagButton}
              aria-label="English (United States)"
              aria-pressed={lang === "en"}
              title="English"
              onClick={() => setLang("en")}
            >
              <span className={styles.flag}>
                <Image src="/flags/us.svg" alt="" width={36} height={26} unoptimized />
              </span>
            </button>
          </div>
          </div>

          <h1 className={styles.title}>{t.title}</h1>
        </header>

        <nav className={styles.sidebar} aria-label={t.groupsLabel}>
          <div className={styles.tabs} role="tablist" aria-label={t.groupsLabel}>
            {tabs.map((g) => (
              <button
                key={g.id}
                type="button"
                role="tab"
                className={styles.tab}
                aria-selected={!search && g.id === activeGroup}
                onClick={() => selectGroup(g.id)}
              >
                {g.label}
              </button>
            ))}
          </div>
        </nav>

        <div className={styles.toolbar}>
          <div className={styles.controls}>
            <div className={`${styles.field} ${styles.searchField}`}>
              <label className={styles.fieldLabel} htmlFor="pokemon-search">
                {t.searchFieldLabel}
              </label>
              <input
                id="pokemon-search"
                className={styles.search}
                type="search"
                placeholder={t.searchPlaceholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div className={`${styles.field} ${styles.groupField}`}>
              <span className={styles.fieldLabel}>{t.showLabel}</span>
              <CenteredSelect
                value={activeGroup}
                options={tabs.map((g) => ({ value: g.id, label: g.label }))}
                onChange={selectGroup}
                ariaLabel={t.showLabel}
              />
            </div>

            <div className={styles.field}>
              <span className={styles.fieldLabel}>{t.sortLabel}</span>
              <CenteredSelect
                value={sortKey}
                options={sortOptions}
                onChange={setSortKey}
                ariaLabel={t.sortLabel}
              />
            </div>

            <div className={styles.field}>
              <span className={styles.fieldLabel}>{t.typeFilterLabel}</span>
              <CenteredSelect
                value={typeFilter}
                options={typeOptions}
                onChange={setTypeFilter}
                ariaLabel={t.typeFilterLabel}
              />
            </div>
          </div>

          <p className={styles.count}>
            {list.length} {t.pokemonCount}
            {search ? ` ${t.foundAll}` : ""}
          </p>
        </div>

        <section className={styles.content}>
          {list.length === 0 ? (
            <div className={styles.empty}>
              <Image
                className={styles.emptyImage}
                src="/snorlax.png"
                alt=""
                width={160}
                height={160}
                unoptimized
              />
              <p className={styles.emptyText}>
                {activeGroup === FAVORITES && !search ? t.noFavorites : t.empty}
              </p>
            </div>
          ) : (
            <>
              <div className={styles.grid}>
                {shown.map((p) => (
                  <article key={p.key} className={styles.card}>
                    <Link href={`/${p.key}`} className={styles.cardLink} aria-label={p.name} />
                    <div className={styles.spriteBox}>
                      {p.sprite && (
                        <Image
                          className={styles.sprite}
                          src={p.sprite}
                          alt={p.name}
                          width={96}
                          height={96}
                          unoptimized
                        />
                      )}
                      <div className={styles.jobs}>
                        {p.jobs.map((job) => (
                          <JobIcon key={job} job={job} label={JOB_NAMES[lang][job] ?? job} />
                        ))}
                      </div>
                      <button
                        type="button"
                        className={styles.favButton}
                        aria-pressed={favorites.has(p.key)}
                        onClick={() => toggleFavorite(p.key)}
                      >
                        <span>{favorites.has(p.key) ? t.unfavorite : t.favorite}</span>
                        <svg
                          className={styles.favHeart}
                          viewBox="0 0 24 24"
                          width="18"
                          height="18"
                          fill={favorites.has(p.key) ? "currentColor" : "none"}
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                        </svg>
                      </button>
                    </div>

                    <div className={styles.info}>
                      <header className={styles.header}>
                        <span className={styles.dex}>#{String(p.dex).padStart(3, "0")}</span>
                        <h2 className={styles.name}>{p.name}</h2>
                        <div className={styles.types}>
                          {p.types.map((type) => (
                            <span
                              key={type}
                              className={styles.typeBadge}
                              style={{ background: TYPE_STYLE[type]?.color }}
                              title={type}
                            >
                              {TYPE_STYLE[type]?.code ?? type}
                            </span>
                          ))}
                        </div>
                      </header>

                      <dl className={styles.stats}>
                        {t.stats.map((label, i) => (
                          <div key={i} className={styles.statRow}>
                            <dt>{label}</dt>
                            <dd>{p.stats[i]}</dd>
                            <div className={styles.bar}>
                              <span
                                className={styles.barFill}
                                style={{
                                  width: `${Math.min(100, (p.stats[i] / MAX_STAT) * 100)}%`,
                                  background: STAT_COLORS[i],
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </dl>

                      <p className={styles.total}>
                        <span>{t.total}</span>
                        <strong>{totalOf(p)}</strong>
                      </p>
                      {p.derived && <p className={styles.derivedNote}>{t.derivedNote}</p>}
                    </div>
                  </article>
                ))}
              </div>
              {hasMore && <div ref={sentinelRef} aria-hidden="true" />}
            </>
          )}
        </section>
      </div>

      <SiteFooter lang={lang} copyright={t.copyright} portfolio={t.portfolio} />
    </main>
  );
}
