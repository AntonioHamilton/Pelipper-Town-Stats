import { promises as fs } from "node:fs";
import path from "node:path";
import {
  CATEGORY_PT,
  CONTEXT_PT,
  GENDER_PT,
  JOB_NAMES,
  LOCATION_PT,
  RARITY_PT,
  SEASON_PT,
  STAT_PT,
  THREAT_PT,
  TIME_PT,
  TYPE_NAMES,
  WEATHER_PT,
} from "./labels";

export type Condition = {
  kind: string;
  value: string | null;
  valueName: string | null;
  amount: number | null;
  negate: boolean;
};

export type EvoNode = {
  key: string;
  name: string;
  to: { conditions: Condition[]; node: EvoNode }[];
};

export type Move = {
  level: number;
  id: string;
  name: string;
  type: string | null;
  category: string | null;
  power: number | null;
};

export type Drop = {
  itemId: string;
  itemName: string | null;
  chance: number;
  minStack: number;
  maxStack: number;
};

export type Profile = {
  context: string;
  rarityTier: string | null;
  threatTier: string | null;
  minLevel: number | null;
  maxLevel: number | null;
  locations: string[];
  seasons: string[];
  timesOfDay: string[];
  habitatTags: string[];
};

export type Species = {
  key: string;
  dex: number;
  name: string;
  description: string | null;
  generation: number | null;
  group: string;
  types: string[];
  weightKg: number | null;
  jobs: { id: string; maxTier: number | null }[];
  abilities: { id: string; name: string; description: string | null }[];
  moves: Move[];
  evolutions: {
    from: { key: string; name: string; conditions: Condition[] }[];
    to: { targetKey: string; targetName: string; conditions: Condition[] }[];
    tree: EvoNode;
  };
  encounter: {
    enabled: boolean;
    minLevel: number | null;
    maxLevel: number | null;
    catchRate: number | null;
    rarityTier: string | null;
    threatTier: string | null;
    locations: string[];
    seasons: string[];
    timesOfDay: string[];
    drops: Drop[];
    profiles: Profile[];
  } | null;
  breeding: { canBreed: boolean; eggSteps: number | null } | null;
  behavior: { preferredWeather: string[]; preferredLocations: string[] } | null;
  derivedFrom?: string;
};

const SPECIES_DIR = path.join(process.cwd(), "app", "data", "species");

export async function loadSpecies(key: string): Promise<Species | null> {
  "use cache";
  if (!/^[a-z0-9-]+$/.test(key)) return null;
  try {
    const raw = await fs.readFile(path.join(SPECIES_DIR, `${key}.json`), "utf8");
    return JSON.parse(raw) as Species;
  } catch {
    return null;
  }
}

const pt = (map: Record<string, string>, value: string | null | undefined) =>
  value ? (map[value] ?? value) : "—";

export function describeCondition(c: Condition): string {
  switch (c.kind) {
    case "Level":
      return `Nível ${c.amount}`;
    case "Bond":
      return `Amizade ${c.amount}`;
    case "TimeOfDay":
      return c.value === "Night" ? "À noite" : "De dia";
    case "KnownMove":
      return `Conhecer ${c.valueName ?? c.value}`;
    case "Location":
      return `${c.negate ? "Fora de" : "Em"} ${pt(LOCATION_PT, c.value)}`;
    case "Gender":
      return pt(GENDER_PT, c.value);
    case "Weather":
      return `Clima: ${pt(WEATHER_PT, c.value)}`;
    case "Form":
      return `Forma: ${c.value}`;
    case "Item":
      return `Usar ${c.valueName ?? `item ${c.value}`}`;
    case "EquippedMoveType":
      return `Golpe do tipo ${pt(TYPE_NAMES.pt, c.value)} equipado`;
    case "StatCompare": {
      const [left, op, right] = (c.value ?? "").split(/([<>])/);
      const word = op === ">" ? "maior que" : "menor que";
      return `${pt(STAT_PT, left)} ${word} ${pt(STAT_PT, right)}`;
    }
    default:
      return c.value ?? String(c.amount ?? c.kind);
  }
}

export function describeConditions(conditions: Condition[]): string {
  return conditions.length ? conditions.map(describeCondition).join(" + ") : "Sem condição";
}

export function describeSeasons(seasons: string[]): string {
  if (!seasons.length) return "qualquer estação";
  return seasons.map((s) => pt(SEASON_PT, s)).join(", ");
}

export function describeLocations(locations: string[]): string {
  if (!locations.length) return "locais não definidos";
  return locations.map((l) => pt(LOCATION_PT, l)).join(", ");
}

export function describeDrop(d: Drop): string {
  return d.itemName ?? `Item ${d.itemId}`;
}

export const labels = {
  category: (v: string | null) => pt(CATEGORY_PT, v),
  rarity: (v: string | null) => pt(RARITY_PT, v),
  threat: (v: string | null) => pt(THREAT_PT, v),
  context: (v: string) => pt(CONTEXT_PT, v),
  time: (v: string) => pt(TIME_PT, v),
  job: (v: string) => JOB_NAMES.pt[v] ?? v,
  type: (v: string) => TYPE_NAMES.pt[v] ?? v,
  location: (v: string) => pt(LOCATION_PT, v),
  weather: (v: string) => pt(WEATHER_PT, v),
};

export type Faq = { question: string; answer: string };

export function faqFor(s: Species, megaForms: { key: string; name: string }[]): Faq[] {
  const faq: Faq[] = [];

  const evoParts: string[] = [];
  for (const f of s.evolutions.from) {
    evoParts.push(`Ele evolui de ${f.name} quando: ${describeConditions(f.conditions)}.`);
  }
  for (const t of s.evolutions.to) {
    evoParts.push(`Ele evolui para ${t.targetName} quando: ${describeConditions(t.conditions)}.`);
  }
  faq.push({
    question: "Como ele evolui?",
    answer: evoParts.length ? evoParts.join(" ") : "Ele não evolui e não vem de outra evolução.",
  });

  if (s.moves.length) {
    const first = s.moves[0];
    const last = s.moves[s.moves.length - 1];
    faq.push({
      question: "Quais golpes ele aprende e em que nível?",
      answer: `Ele aprende ${s.moves.length} golpes subindo de nível. O primeiro é ${first.name} (nível ${first.level}) e o último é ${last.name} (nível ${last.level}). A tabela completa está acima.`,
    });
  } else {
    faq.push({
      question: "Quais golpes ele aprende e em que nível?",
      answer: "Não há golpes por nível cadastrados para ele.",
    });
  }

  if (s.encounter?.enabled) {
    const e = s.encounter;
    faq.push({
      question: "Onde encontro ele?",
      answer: `Ele aparece em ${describeLocations(e.locations)}, nas estações ${e.seasons.map((x) => pt(SEASON_PT, x)).join(", ") || "de qualquer época"}, com níveis selvagens de ${e.minLevel} a ${e.maxLevel}.`,
    });
  } else {
    faq.push({
      question: "Onde encontro ele?",
      answer: s.derivedFrom
        ? `Esta é uma forma de ${s.derivedFrom}. Ela não aparece no mundo selvagem.`
        : "Ele não aparece no mundo selvagem. Para obtê-lo, veja a seção de evolução.",
    });
  }

  const drops = s.encounter?.drops ?? [];
  faq.push({
    question: "Quais itens ele deixa ao ser derrotado?",
    answer: drops.length
      ? drops.map((d) => `${describeDrop(d)} (${Math.round(d.chance * 100)}%)`).join(", ") + "."
      : "Não há itens cadastrados para ele.",
  });

  faq.push({
    question: "Quanto ele pesa?",
    answer:
      s.weightKg !== null
        ? `${s.weightKg.toLocaleString("pt-BR")} kg. O peso vem da PokeAPI (dados oficiais de Pokémon), não do mod.`
        : "Não encontrei o peso dele na PokeAPI.",
  });

  faq.push({
    question: "Quais tarefas ele faz no jogo?",
    answer: s.jobs.length
      ? s.jobs.map((j) => labels.job(j.id)).join(", ") + "."
      : "Ele não tem tarefas cadastradas.",
  });

  faq.push({
    question: "Ele pode ser reproduzido?",
    answer: s.breeding?.canBreed
      ? `Sim. O ovo eclode depois de ${s.breeding.eggSteps ?? "um número de"} passos.`
      : "Não, ele não pode ser reproduzido.",
  });

  if (megaForms.length) {
    faq.push({
      question: "Ele tem forma Mega?",
      answer: `Sim: ${megaForms.map((m) => m.name).join(", ")}.`,
    });
  }

  return faq;
}

export function formatWeight(kg: number | null): string {
  return kg === null ? "—" : `${kg.toLocaleString("pt-BR")} kg`;
}
