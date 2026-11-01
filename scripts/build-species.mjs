import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir =
  process.argv[2] ??
  "C:/Program Files (x86)/Steam/steamapps/common/Stardew Valley/mods/PelipperTown.Mod/assets/data";

const outDir = path.join(root, "app", "data", "species");
const weightsPath = path.join(root, "app", "data", "weights.json");
const itemNamesPath = path.join(root, "app", "data", "item-names.json");

const files = fs
  .readdirSync(dataDir)
  .filter((f) => f.endsWith(".json") && !f.includes("spritecollab"))
  .sort();

const docs = [];
for (const file of files) {
  let doc;
  try {
    doc = JSON.parse(fs.readFileSync(path.join(dataDir, file), "utf8"));
  } catch {
    continue;
  }
  docs.push({ groupId: file.replace(/\.json$/, ""), doc });
}

const moves = new Map();
const abilities = new Map();
for (const { doc } of docs) {
  if (Array.isArray(doc.Moves)) for (const m of doc.Moves) moves.set(m.Id, m);
  if (Array.isArray(doc.Abilities)) for (const a of doc.Abilities) abilities.set(a.Id, a);
}

const keyOf = (sp) => (!sp.FormId || sp.FormId === "default" ? sp.Id : `${sp.Id}-${sp.FormId}`);

// Espécies (incluindo formas), indexadas pela chave usada no site.
const species = new Map();
const defaultKeyById = new Map();
for (const { groupId, doc } of docs) {
  if (!Array.isArray(doc.Species)) continue;
  for (const sp of doc.Species) {
    if (!sp.BaseStats) continue;
    const key = keyOf(sp);
    species.set(key, { groupId, sp, key });
    if (!sp.FormId || sp.FormId === "default") defaultKeyById.set(sp.Id, key);
  }
}

// Formas derivadas (mega e lendárias): herdam golpes, habilidades e tarefas da espécie base.
const derived = [];
for (const { groupId, doc } of docs) {
  if (!Array.isArray(doc.Forms)) continue;
  for (const form of doc.Forms) {
    const pres = form.Presentation;
    derived.push({ groupId, pres, baseKey: defaultKeyById.get(form.BaseSpeciesId) ?? form.BaseSpeciesId });
  }
}

const weights = fs.existsSync(weightsPath) ? JSON.parse(fs.readFileSync(weightsPath, "utf8")) : {};
const itemNames = fs.existsSync(itemNamesPath) ? JSON.parse(fs.readFileSync(itemNamesPath, "utf8")) : {};

function itemNameOf(itemId) {
  return itemNames[itemId] ?? null;
}

function moveView(learn) {
  const m = moves.get(learn.MoveId);
  return {
    level: learn.Level,
    id: learn.MoveId,
    name: m?.DisplayName ?? learn.MoveId,
    type: m?.Type ?? null,
    category: m?.Category ?? null,
    power: m?.Power ?? null,
  };
}

function abilityView(id) {
  const a = abilities.get(id);
  return { id, name: a?.DisplayName ?? id, description: a?.Description ?? null };
}

function encounterView(enc) {
  if (!enc) return null;
  return {
    enabled: enc.Enabled !== false,
    minLevel: enc.MinLevel ?? null,
    maxLevel: enc.MaxLevel ?? null,
    catchRate: enc.CatchRate ?? null,
    rarityTier: enc.RarityTier ?? null,
    threatTier: enc.ThreatTier ?? null,
    locations: enc.Locations ?? [],
    seasons: enc.Seasons ?? [],
    timesOfDay: enc.TimesOfDay ?? [],
    minimumYearsByLocation: enc.MinimumYearsByLocation ?? {},
    drops: (enc.DefeatDrops ?? []).map((d) => ({
      itemId: d.ItemId,
      itemName: itemNameOf(d.ItemId),
      chance: d.Chance,
      minStack: d.MinStack,
      maxStack: d.MaxStack,
    })),
    profiles: (enc.Profiles ?? []).map((p) => ({
      context: p.Context,
      rarityTier: p.RarityTier ?? null,
      threatTier: p.ThreatTier ?? null,
      minLevel: p.MinLevel ?? null,
      maxLevel: p.MaxLevel ?? null,
      locations: p.Locations ?? [],
      seasons: p.Seasons ?? [],
      timesOfDay: p.TimesOfDay ?? [],
      habitatTags: p.HabitatTags ?? [],
    })),
  };
}

function conditionValueName(c) {
  if (c.Kind === "Item") return itemNameOf(c.Value);
  if (c.Kind === "KnownMove") return moves.get(c.Value)?.DisplayName ?? null;
  return null;
}

// Condições de evolução ficam estruturadas; o texto é montado na página.
function evolutionsOf(sp) {
  return (sp.Evolutions ?? []).map((e) => ({
    targetKey: defaultKeyById.get(e.SpeciesId) ?? e.SpeciesId,
    conditions: (e.Conditions ?? []).map((c) => ({
      kind: c.Kind,
      value: c.Value ?? null,
      valueName: conditionValueName(c),
      amount: c.Amount ?? null,
      negate: c.Negate === true,
    })),
  }));
}

// Árvore de evolução a partir da raiz da família (sem ciclos).
function buildTree(key, visited = new Set()) {
  const entry = species.get(key);
  const name = entry?.sp.DisplayName ?? key;
  const node = { key, name, to: [] };
  if (visited.has(key)) return node;
  visited.add(key);
  for (const evo of evolutionsOf(entry?.sp ?? {})) {
    node.to.push({ conditions: evo.conditions, node: buildTree(evo.targetKey, new Set(visited)) });
  }
  return node;
}

function findRoot(key) {
  let current = key;
  const seen = new Set([key]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const [otherKey, entry] of species) {
      if (seen.has(otherKey)) continue;
      const evolvesToCurrent = evolutionsOf(entry.sp).some((e) => e.targetKey === current);
      if (evolvesToCurrent) {
        current = otherKey;
        seen.add(otherKey);
        changed = true;
        break;
      }
    }
  }
  return current;
}

function detailsFor(key, sp, groupId, baseSp, derivedFrom) {
  const source = baseSp ?? sp;
  const rootKey = findRoot(derivedFrom ?? key);
  const evolutionTree = buildTree(rootKey);
  const from = [];
  for (const [otherKey, entry] of species) {
    for (const evo of evolutionsOf(entry.sp)) {
      if (evo.targetKey === (derivedFrom ?? key)) from.push({ key: otherKey, name: entry.sp.DisplayName, conditions: evo.conditions });
    }
  }

  return {
    key,
    dex: sp.NationalDex,
    name: sp.DisplayName,
    description: source.Description ?? null,
    generation: source.Generation ?? null,
    group: groupId,
    types: sp.Types ?? source.Types ?? [],
    weightKg: weights[key] ?? null,
    jobs: (source.Jobs ?? []).map((j) => ({
      id: j,
      maxTier: source.FieldSkills?.[j]?.MaxTier ?? null,
    })),
    abilities: (source.AbilityIds ?? []).map(abilityView),
    moves: (source.Learnset ?? []).map(moveView).sort((a, b) => a.level - b.level || a.name.localeCompare(b.name)),
    evolutions: { from, to: evolutionsOf(source), tree: evolutionTree },
    encounter: encounterView(source.Encounter),
    breeding: source.Breeding
      ? { canBreed: source.Breeding.CanBreed === true, eggSteps: source.Breeding.BaseHatchSteps ?? null }
      : null,
    behavior: source.Behavior
      ? {
          preferredWeather: source.Behavior.PreferredWeather ?? [],
          preferredLocations: source.Behavior.PreferredLocations ?? [],
        }
      : null,
    ...(derivedFrom ? { derivedFrom } : {}),
  };
}

fs.mkdirSync(outDir, { recursive: true });

const written = new Set();
function write(key, details) {
  fs.writeFileSync(path.join(outDir, `${key}.json`), JSON.stringify(details));
  written.add(`${key}.json`);
}

for (const [key, { groupId, sp }] of species) {
  write(key, detailsFor(key, sp, groupId, null, null));
}

for (const { groupId, pres, baseKey } of derived) {
  const base = species.get(baseKey);
  if (!base) continue;
  write(pres.Id, detailsFor(pres.Id, { ...pres, Types: pres.Types ?? base.sp.Types }, groupId, base.sp, baseKey));
}

for (const file of fs.readdirSync(outDir)) {
  if (!written.has(file)) fs.unlinkSync(path.join(outDir, file));
}

console.log(`Detalhes gerados: ${written.size} | pesos conhecidos: ${Object.keys(weights).length}`);
