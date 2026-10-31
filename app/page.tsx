"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import styles from "./pokedex.module.css";
import pokemonData from "./data/pokemon.json";
import { EmailIcon, GithubIcon, LinkedinIcon } from "./Icons";

type Lang = "pt" | "en";

type Pokemon = {
  key: string;
  dex: number;
  name: string;
  group: string;
  types: string[];
  sprite: string | null;
  stats: number[];
  derived?: boolean;
};

type Group = { id: string; label: Record<Lang, string> };

const data = pokemonData as { groups: Group[]; pokemon: Pokemon[] };

const MAX_STAT = 255;
const ALL = "all";
const PAGE_SIZE = 50;

const STAT_COLORS = ["#cc0000", "#ff7f0f", "#ff7f0f", "#f7bc0b", "#f7bc0b", "#3194f7"];

const TYPE_STYLE: Record<string, { code: string; color: string }> = {
  Normal: { code: "NOR", color: "#A8A77A" },
  Fire: { code: "FIR", color: "#EE8130" },
  Water: { code: "WAT", color: "#6390F0" },
  Electric: { code: "ELE", color: "#F7D02C" },
  Grass: { code: "GRA", color: "#7AC74C" },
  Ice: { code: "ICE", color: "#96D9D6" },
  Fighting: { code: "FIG", color: "#C22E28" },
  Poison: { code: "POI", color: "#A33EA1" },
  Ground: { code: "GRO", color: "#E2BF65" },
  Flying: { code: "FLY", color: "#A98FF3" },
  Psychic: { code: "PSY", color: "#F95587" },
  Bug: { code: "BUG", color: "#A6B91A" },
  Rock: { code: "ROC", color: "#B6A136" },
  Ghost: { code: "GHO", color: "#735797" },
  Dragon: { code: "DRA", color: "#6F35FC" },
  Dark: { code: "DAR", color: "#705746" },
  Steel: { code: "STE", color: "#B7B7CE" },
  Fairy: { code: "FAI", color: "#D685AD" },
};

const TYPE_NAMES: Record<Lang, Record<string, string>> = {
  pt: {
    Normal: "Normal",
    Fire: "Fogo",
    Water: "Água",
    Electric: "Elétrico",
    Grass: "Grama",
    Ice: "Gelo",
    Fighting: "Lutador",
    Poison: "Veneno",
    Ground: "Terra",
    Flying: "Voador",
    Psychic: "Psíquico",
    Bug: "Inseto",
    Rock: "Pedra",
    Ghost: "Fantasma",
    Dragon: "Dragão",
    Dark: "Sombrio",
    Steel: "Aço",
    Fairy: "Fada",
  },
  en: {
    Normal: "Normal",
    Fire: "Fire",
    Water: "Water",
    Electric: "Electric",
    Grass: "Grass",
    Ice: "Ice",
    Fighting: "Fighting",
    Poison: "Poison",
    Ground: "Ground",
    Flying: "Flying",
    Psychic: "Psychic",
    Bug: "Bug",
    Rock: "Rock",
    Ghost: "Ghost",
    Dragon: "Dragon",
    Dark: "Dark",
    Steel: "Steel",
    Fairy: "Fairy",
  },
};

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
    searchFieldLabel: "Busca",
    typeFilterLabel: "Tipo",
    allTypes: "Todos os tipos",
    pokemonCount: "Pokémon",
    foundAll: "encontrados em todas as abas",
    empty: "Nenhum Pokémon encontrado.",
    total: "Total",
    derivedNote: "Stats calculados a partir da forma base",
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
    searchFieldLabel: "Search",
    typeFilterLabel: "Type",
    allTypes: "All types",
    pokemonCount: "Pokémon",
    foundAll: "found in all groups",
    empty: "No Pokémon found.",
    total: "Total",
    derivedNote: "Stats calculated from the base form",
    copyright: "Chat 🤖",
    portfolio: "Portfolio",
    stats: ["HP", "Attack", "Defense", "Sp. Attack", "Sp. Defense", "Speed"],
  },
} as const;

const LOCALE: Record<Lang, string> = { pt: "pt-BR", en: "en-US" };

const noopSubscribe = () => () => {};

const totalOf = (p: Pokemon) => p.stats.reduce((a, b) => a + b, 0);

function compareFor(sortKey: string, lang: Lang): (a: Pokemon, b: Pokemon) => number {
  const byDex = (a: Pokemon, b: Pokemon) => a.dex - b.dex;
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
  const current = options.find((o) => o.value === value)?.label ?? "";

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
        <ul className={styles.dropdownList} role="listbox" aria-label={ariaLabel}>
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

export default function Home() {
  const [lang, setLang] = useState<Lang>("pt");
  const [activeGroup, setActiveGroup] = useState(ALL);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState("dex");
  const [typeFilter, setTypeFilter] = useState(ALL);
  const [page, setPage] = useState({ key: "", count: PAGE_SIZE });
  const year = useSyncExternalStore(
    noopSubscribe,
    () => String(new Date().getFullYear()),
    () => "",
  );

  const t = UI[lang];
  const search = query.trim().toLowerCase();

  const tabs = useMemo(
    () => [
      { id: ALL, label: t.all },
      ...data.groups.map((g) => ({ id: g.id, label: g.label[lang] })),
    ],
    [lang, t.all],
  );

  const sortOptions = useMemo(
    () => [
      { value: "dex", label: t.sortDex },
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
    } else {
      base = data.pokemon.filter((p) => p.group === activeGroup);
    }
    if (typeFilter !== ALL) {
      base = base.filter((p) => p.types.includes(typeFilter));
    }
    return [...base].sort(compareFor(sortKey, lang));
  }, [search, activeGroup, sortKey, typeFilter, lang]);

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

          <Image
            className={styles.logo}
            src="/Logo.webp"
            alt={t.logoAlt}
            width={112}
            height={112}
            unoptimized
          />
          <h1 className={styles.title}>{t.title}</h1>
        </header>

        <nav className={styles.sidebar} aria-label={t.groupsLabel}>
          <select
            className={`${styles.select} ${styles.groupSelect}`}
            aria-label={t.typeSelectLabel}
            value={activeGroup}
            onChange={(e) => selectGroup(e.target.value)}
          >
            {tabs.map((g) => (
              <option key={g.id} value={g.id}>
                {g.label}
              </option>
            ))}
          </select>
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

        <section className={styles.content}>
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
              <p className={styles.emptyText}>{t.empty}</p>
            </div>
          ) : (
            <>
              <div className={styles.grid}>
                {shown.map((p) => (
                  <article key={p.key} className={styles.card}>
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

      <footer className={styles.footer}>
        <p className={styles.copyright}>
          {t.copyright} {year}
        </p>
        <a
          className={styles.portfolioLink}
          href={`https://chat-hamilton.vercel.app/?language=${lang}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          ← {t.portfolio}
        </a>
        <div className={styles.socials}>
          <a
            href="https://www.linkedin.com/in/antonio-hamilton/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
          >
            <LinkedinIcon className={styles.icon} />
          </a>
          <a
            href="https://github.com/AntonioHamilton"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
          >
            <GithubIcon className={styles.icon} />
          </a>
          <a href="mailto:antoniohamilton.s.freitas@gmail.com" aria-label="Email">
            <EmailIcon className={styles.icon} />
          </a>
        </div>
      </footer>
    </main>
  );
}
