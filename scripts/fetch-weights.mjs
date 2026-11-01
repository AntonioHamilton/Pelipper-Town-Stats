import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pokemonPath = path.join(root, "app", "data", "pokemon.json");
const outPath = path.join(root, "app", "data", "weights.json");

const { pokemon } = JSON.parse(fs.readFileSync(pokemonPath, "utf8"));

const DEFAULT_FORMS = {
  deoxys: "deoxys-normal",
  giratina: "giratina-altered",
  lycanroc: "lycanroc-midday",
  gourgeist: "gourgeist-average",
  eiscue: "eiscue-ice",
  meloetta: "meloetta-aria",
  "alcremie-rainbow-swirl": "alcremie",
  meowstic: "meowstic-male",
  mimikyu: "mimikyu-disguised",
  "origin-dialga": "dialga-origin",
  "origin-giratina": "giratina-origin",
  "origin-palkia": "palkia-origin",
  "primal-dialga": "dialga",
  "primal-groudon": "groudon-primal",
  "primal-kyogre": "kyogre-primal",
  pumpkaboo: "pumpkaboo-average",
  shaymin: "shaymin-land",
  toxtricity: "toxtricity-amped",
};

// Nomes da PokeAPI: formas Mega usam "charizard-mega-x", o site usa "mega-charizard-x".
// Formas regionais usam "raichu-alola", o site usa "alolan-raichu-alola".
function candidatesFor(key) {
  const list = [key];
  if (key.startsWith("mega-")) {
    const rest = key.slice(5);
    const m = rest.match(/^(.+?)(?:-(x|y))?$/);
    if (m) list.unshift(m[2] ? `${m[1]}-mega-${m[2]}` : `${m[1]}-mega`);
  }
  const regional = key.match(/^(?:alolan|galarian|hisuian|paldean)-(.+)-(alola|galar|hisui|paldea)$/);
  if (regional) list.unshift(`${regional[1]}-${regional[2]}`);
  if (DEFAULT_FORMS[key]) list.unshift(DEFAULT_FORMS[key]);
  return [...new Set(list)];
}

async function weightFor(key) {
  for (const name of candidatesFor(key)) {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`, {
      headers: { "User-Agent": "pelipper-town-stats-data/1.0 (personal project)" },
    });
    if (res.status === 200) {
      const json = await res.json();
      return Math.round(json.weight) / 10;
    }
  }
  return null;
}

const result = {};
const queue = pokemon.map((p) => p.key);
const workers = Array.from({ length: 8 }, async () => {
  while (queue.length) {
    const key = queue.shift();
    try {
      result[key] = await weightFor(key);
    } catch {
      result[key] = null;
    }
  }
});
await Promise.all(workers);

const sorted = Object.fromEntries(Object.entries(result).sort(([a], [b]) => a.localeCompare(b)));
fs.writeFileSync(outPath, JSON.stringify(sorted, null, 1) + "\n");

const found = Object.values(sorted).filter((v) => v !== null).length;
console.log(`Pesos encontrados: ${found} de ${pokemon.length}`);
