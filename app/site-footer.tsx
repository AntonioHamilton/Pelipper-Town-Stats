"use client";

import { useSyncExternalStore } from "react";
import { EmailIcon, GithubIcon, LinkedinIcon } from "./Icons";
import styles from "./pokedex.module.css";

const noopSubscribe = () => () => {};

type Props = { lang: string; copyright: string; portfolio: string };

export function SiteFooter({ lang, copyright, portfolio }: Props) {
  const year = useSyncExternalStore(
    noopSubscribe,
    () => String(new Date().getFullYear()),
    () => "",
  );

  return (
    <footer className={styles.footer}>
      <p className={styles.copyright}>
        {copyright} {year}
      </p>
      <a
        className={styles.portfolioLink}
        href={`https://chat-hamilton.vercel.app/?language=${lang}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        ← {portfolio}
      </a>
      <div className={styles.socials}>
        <a
          href="https://www.linkedin.com/in/antonio-hamilton/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn"
        >
          <LinkedinIcon className={styles.icon} />
        </a>
        <a
          className={styles.githubLink}
          href="https://github.com/AntonioHamilton"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
        >
          <GithubIcon className={styles.icon} />
        </a>
        <a href="mailto:antoniohamilton.s.freitas@gmail.com" aria-label="Email">
          <EmailIcon className={styles.icon} />
        </a>
      </div>
    </footer>
  );
}
