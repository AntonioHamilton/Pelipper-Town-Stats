import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir =
  process.argv[2] ??
  "C:/Program Files (x86)/Steam/steamapps/common/Stardew Valley/mods/PelipperTown.Mod/assets/data";
const modDir = path.resolve(dataDir, "..", "..");

const GROUP_LABELS = {
  kanto_species: { pt: "Normais", en: "Normal" },
  alolan_forms: { pt: "Alolan", en: "Alolan" },
  anomalies: { pt: "Anomalias", en: "Anomalies" },
  arceus_summit: { pt: "Arceus", en: "Arceus" },
  cresselia_story: { pt: "Cresselia", en: "Cresselia" },
  darkrai_story: { pt: "Darkrai", en: "Darkrai" },
  elemental_rivals: { pt: "Rivais elementais", en: "Elemental rivals" },
  fan_favorites: { pt: "Favoritos", en: "Fan favorites" },
  framework: { pt: "Framework", en: "Framework" },
  kanto_relatives: { pt: "Parentes de Kanto", en: "Kanto relatives" },
  legendary_events: { pt: "Eventos lendários", en: "Legendary events" },
  legendary_forms: { pt: "Formas lendárias", en: "Legendary forms" },
  mega_evolutions: { pt: "Mega evoluções", en: "Mega evolutions" },
  pelican_town: { pt: "Pelican Town", en: "Pelican Town" },
  regional_starters: { pt: "Iniciais regionais", en: "Regional starters" },
  sve_expansion: { pt: "SVE", en: "SVE" },
  valley_finale: { pt: "Final do vale", en: "Valley finale" },
};

const STAT_KEYS = ["Health", "Attack", "Defense", "SpecialAttack", "SpecialDefense", "Speed"];

const files = fs
  .readdirSync(dataDir)
  .filter((f) => f.endsWith(".json") && !f.includes("spritecollab"))
  .sort();

const docs = files.map((file) => ({
  file,
  groupId: file.replace(/\.json$/, ""),
  doc: JSON.parse(fs.readFileSync(path.join(dataDir, file), "utf8")),
}));

const spritesOut = path.join(root, "public", "sprites");
fs.rmSync(spritesOut, { recursive: true, force: true });
fs.mkdirSync(spritesOut, { recursive: true });

const pokemon = [];
const seenKeys = new Set();
const missingSprites = [];
const missingBase = [];

function addPokemon(entry) {
  if (seenKeys.has(entry.key)) throw new Error(`Chave duplicada: ${entry.key} (${entry.group})`);
  seenKeys.add(entry.key);

  const src = path.join(modDir, entry.portraitPath);
  let sprite = null;
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(spritesOut, `${entry.key}.png`));
    sprite = `/sprites/${entry.key}.png`;
  } else {
    missingSprites.push(entry.key);
  }

  pokemon.push({
    key: entry.key,
    dex: entry.dex,
    name: entry.name,
    group: entry.group,
    types: entry.types,
    sprite,
    stats: entry.stats,
    jobs: entry.jobs ?? [],
    ...(entry.derived ? { derived: true } : {}),
  });
}

// Espécies base (forma padrão) com stats, usadas para calcular mega e formas lendárias.
const baseSpecies = new Map();
for (const { groupId, doc } of docs) {
  if (!Array.isArray(doc.Species)) continue;
  for (const sp of doc.Species) {
    if (!sp.BaseStats) continue;
    const isDefault = !sp.FormId || sp.FormId === "default";
    if (isDefault) baseSpecies.set(sp.Id, sp);

    const formSuffix = isDefault ? "" : `-${sp.FormId}`;
    addPokemon({
      key: `${sp.Id}${formSuffix}`,
      dex: sp.NationalDex,
      name: sp.DisplayName,
      group: groupId,
      types: sp.Types ?? [],
      portraitPath: sp.PortraitPath,
      stats: STAT_KEYS.map((k) => sp.BaseStats[k]),
      jobs: sp.Jobs ?? [],
    });
  }
}

// Formas (mega e lendárias): stats = base da espécie x multiplicadores do mod.
for (const { groupId, doc } of docs) {
  if (!Array.isArray(doc.Forms)) continue;
  for (const form of doc.Forms) {
    const pres = form.Presentation;
    const base = baseSpecies.get(form.BaseSpeciesId);
    if (!base) {
      missingBase.push(pres.Id);
      continue;
    }
    const battle = form.BattleStatMultiplier ?? doc.BattleStatMultiplier ?? 1;
    const health = form.HealthMultiplier ?? doc.HealthMultiplier ?? 1;
    const s = base.BaseStats;
    addPokemon({
      key: pres.Id,
      dex: pres.NationalDex,
      name: pres.DisplayName,
      group: groupId,
      types: pres.Types ?? base.Types ?? [],
      portraitPath: pres.PortraitPath ?? base.PortraitPath,
      stats: [
        Math.round(s.Health * health),
        Math.round(s.Attack * battle),
        Math.round(s.Defense * battle),
        Math.round(s.SpecialAttack * battle),
        Math.round(s.SpecialDefense * battle),
        Math.round(s.Speed * battle),
      ],
      jobs: form.Jobs ?? base.Jobs ?? [],
      derived: true,
    });
  }
}

const groups = [];
for (const { groupId } of docs) {
  if (pokemon.some((p) => p.group === groupId) && !groups.some((g) => g.id === groupId)) {
    groups.push({ id: groupId, label: GROUP_LABELS[groupId] ?? { pt: groupId, en: groupId } });
  }
}

pokemon.sort((a, b) => a.dex - b.dex || a.name.localeCompare(b.name));

const outDir = path.join(root, "app", "data");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "pokemon.json"), JSON.stringify({ groups, pokemon }));

console.log(`Pokémon: ${pokemon.length} | grupos: ${groups.length} | sprites ausentes: ${missingSprites.length}`);
if (missingSprites.length) console.log("Sem sprite:", missingSprites.join(", "));
if (missingBase.length) console.log("Forma sem espécie base:", missingBase.join(", "));
