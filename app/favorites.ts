const FAVORITES_KEY = "pelipper-favorites";
const FAVORITES_EVENT = "pelipper-favorites-change";

export function readFavorites(): string {
  try {
    return window.localStorage.getItem(FAVORITES_KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

export function subscribeFavorites(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(FAVORITES_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(FAVORITES_EVENT, onChange);
  };
}

export function parseFavorites(raw: string): Set<string> {
  try {
    const list: unknown = JSON.parse(raw);
    return new Set(Array.isArray(list) ? list.filter((k) => typeof k === "string") : []);
  } catch {
    return new Set();
  }
}

export function saveFavorites(favorites: Set<string>) {
  try {
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites]));
  } catch {
    // Armazenamento indisponível: o favorito não persiste nesta sessão.
  }
  window.dispatchEvent(new Event(FAVORITES_EVENT));
}
