import type { Metadata } from "next";
import { MedievalSharp, Titan_One } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "./site";

const bodyFont = MedievalSharp({ weight: "400", subsets: ["latin"], variable: "--font-body" });
const titleFont = Titan_One({ weight: "400", subsets: ["latin"], variable: "--font-title" });

export const metadata: Metadata = {
  title: "Pelipper Town Stats | Stardew Valley Mod Pokémon Stats",
  description:
    "Pokémon stats do mod Pelipper Town para Stardew Valley: stats base de todos os Pokémon do mod, com tipos, filtros e favoritos. Base stats of every Pokémon in the Pelipper Town Stardew Valley mod.",
  keywords: [
    "stardew valley mod pokemon",
    "mod pokemon stats",
    "pokemon stats",
    "Pelipper Town Pokemon Stats",
    "Pelipper Town Stats",
    "Pelipper Town Pokémon",
    "Pokemon Stats",
    "Pokémon Stats",
    "Stardew Valley Pokemon Stats",
    "Stardew Valley Pokémon",
    "Pokémon Stardew Valley mod",
    "Pelipper Town mod",
    "estatísticas Pokémon",
    "Pokédex stats",
    "Pokemon base stats",
  ],
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Pelipper Town Stats",
    title: "Pelipper Town Stats | Stardew Valley Mod Pokémon Stats",
    description:
      "Pokémon stats do mod Pelipper Town para Stardew Valley: stats base de todos os Pokémon do mod, com tipos, filtros e favoritos.",
    locale: "pt_BR",
    alternateLocale: ["en_US"],
  },
  twitter: {
    card: "summary",
    title: "Pelipper Town Stats | Stardew Valley Mod Pokémon Stats",
    description:
      "Pokémon stats do mod Pelipper Town para Stardew Valley: stats base de todos os Pokémon do mod, com tipos, filtros e favoritos.",
  },
  icons: {
    icon: "/Logo.webp",
  },
  verification: {
    google: "-b0xQpqA7_wzAeTp13m-qkfFHKSqt0P7hrbJQB4WnwA",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${bodyFont.variable} ${titleFont.variable}`}>
      <body>{children}</body>
    </html>
  );
}
