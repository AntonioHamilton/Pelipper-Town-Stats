import { NextResponse, type NextRequest } from "next/server";
import pokemonData from "./app/data/pokemon.json";

const KNOWN_KEYS = new Set(pokemonData.pokemon.map((p) => p.key));

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const path = pathname.replace(/^\/+|\/+$/g, "");

  if (path === "" || path === "not-found" || path.includes(".")) {
    return NextResponse.next();
  }
  if (!path.includes("/") && KNOWN_KEYS.has(path)) {
    return NextResponse.next();
  }
  return NextResponse.redirect(new URL("/not-found", request.url));
}

export const config = {
  matcher: "/((?!_next/).*)",
};
