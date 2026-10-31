import type { Metadata } from "next";
import { MedievalSharp, Titan_One } from "next/font/google";
import "./globals.css";

const bodyFont = MedievalSharp({ weight: "400", subsets: ["latin"], variable: "--font-body" });
const titleFont = Titan_One({ weight: "400", subsets: ["latin"], variable: "--font-title" });

export const metadata: Metadata = {
  title: "Pelipper Town Stats",
  description: "Stats base de todos os Pokémon do mod Pelipper Town",
  icons: {
    icon: "/Logo.webp",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${bodyFont.variable} ${titleFont.variable}`}>
      <body>{children}</body>
    </html>
  );
}
