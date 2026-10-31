import type { Metadata } from "next";
import { MedievalSharp, Titan_One } from "next/font/google";
import "./globals.css";

const bodyFont = MedievalSharp({ weight: "400", subsets: ["latin"], variable: "--font-body" });
const titleFont = Titan_One({ weight: "400", subsets: ["latin"], variable: "--font-title" });

export const metadata: Metadata = {
  title: "Pelipper Town Stats",
  description:
    "Stats base de todos os Pokémon do mod Pelipper Town. Base stats of every Pokémon in the Pelipper Town mod.",
  keywords: [
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
