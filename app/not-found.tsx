import type { Metadata } from "next";
import Link from "next/link";
import styles from "./species.module.css";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <section className={styles.card}>
          <h1>Pokémon não encontrado</h1>
          <p className={styles.muted}>Esta página não existe no Pelipper Town Stats.</p>
          <Link href="/" className={styles.back}>
            ← Ver todos os Pokémon
          </Link>
        </section>
      </div>
    </main>
  );
}
