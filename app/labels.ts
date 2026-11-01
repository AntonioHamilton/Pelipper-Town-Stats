export type Lang = "pt" | "en";

export const STAT_COLORS = ["#cc0000", "#ff7f0f", "#ff7f0f", "#f7bc0b", "#f7bc0b", "#3194f7"];

export const TYPE_STYLE: Record<string, { code: string; color: string }> = {
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

export const TYPE_NAMES: Record<Lang, Record<string, string>> = {
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

// Tarefas que um Pokémon pode fazer no Stardew (campo `Jobs` do mod). Ícone: /jobs/<tarefa minúscula>.png
export const JOB_NAMES: Record<Lang, Record<string, string>> = {
  pt: {
    Forage: "Forragear",
    Harvest: "Colher",
    AnimalCare: "Cuidar de animais",
    OrchardCare: "Cuidar do pomar",
    Mine: "Minerar",
    Transport: "Transportar",
    Tilling: "Arar a terra",
    ClearBrush: "Limpar mato",
    ChopWood: "Cortar madeira",
    Water: "Regar plantas",
    Fishing: "Pescar",
    CrabPot: "Pote de caranguejo",
  },
  en: {
    Forage: "Forage",
    Harvest: "Harvest",
    AnimalCare: "Animal care",
    OrchardCare: "Orchard care",
    Mine: "Mine",
    Transport: "Transport",
    Tilling: "Till soil",
    ClearBrush: "Clear brush",
    ChopWood: "Chop wood",
    Water: "Water plants",
    Fishing: "Fish",
    CrabPot: "Crab pot",
  },
};

export const CATEGORY_PT: Record<string, string> = {
  Physical: "Físico",
  Special: "Especial",
  Status: "Status",
};

export const RARITY_PT: Record<string, string> = {
  Common: "Comum",
  Uncommon: "Incomum",
  Rare: "Raro",
  Apex: "Apex",
};

export const THREAT_PT: Record<string, string> = {
  Gentle: "Gentil",
  Standard: "Padrão",
  Strong: "Forte",
  Apex: "Apex",
};

export const SEASON_PT: Record<string, string> = {
  spring: "Primavera",
  summer: "Verão",
  fall: "Outono",
  winter: "Inverno",
};

export const TIME_PT: Record<string, string> = {
  Day: "Dia",
  Night: "Noite",
};

export const CONTEXT_PT: Record<string, string> = {
  Overworld: "Mundo aberto",
  VolcanoDungeon: "Vulcão",
  Mines: "Minas",
  SkullCavern: "Caverna do Crânio",
};

export const LOCATION_PT: Record<string, string> = {
  Farm: "Fazenda",
  Forest: "Floresta",
  Woods: "Bosque",
  Railroad: "Ferrovia",
  Mountain: "Montanha",
  Desert: "Deserto",
  Beach: "Praia",
  Town: "Cidade",
  BusStop: "Ponto de ônibus",
  IslandWest: "Ilha Oeste",
  IslandNorth: "Ilha Norte",
  IslandEast: "Ilha Leste",
  IslandSouth: "Ilha Sul",
  IslandSouthEast: "Ilha Sudeste",
};

export const WEATHER_PT: Record<string, string> = {
  Sun: "Sol",
  Rain: "Chuva",
  Storm: "Tempestade",
  Wind: "Vento",
  Snow: "Neve",
};

export const GENDER_PT: Record<string, string> = {
  Male: "Macho",
  Female: "Fêmea",
};

export const STAT_PT: Record<string, string> = {
  Health: "Vida",
  Attack: "Ataque",
  Defense: "Defesa",
  SpecialAttack: "Ataque especial",
  SpecialDefense: "Defesa especial",
  Speed: "Velocidade",
};
