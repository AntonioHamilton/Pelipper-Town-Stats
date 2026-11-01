import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "./species.module.css";

export const metadata: Metadata = {
  title: "Página não encontrada | Pelipper Town Stats",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <section className={`${styles.card} ${styles.notFound}`}>
          <Image src="/snorlax.png" alt="Snorlax dormindo" width={160} height={160} unoptimized />
          <h1>Essa página não existe</h1>
          <p className={styles.muted}>
            O Snorlax dormiu em cima do caminho e não achamos nada aqui.
          </p>
          <Link href="/" className={styles.back}>
            ← Ver todos os Pokémon
          </Link>
        </section>
      </div>
    </main>
  );
}
