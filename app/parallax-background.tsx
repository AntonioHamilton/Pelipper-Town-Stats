"use client";

import { useEffect, useRef } from "react";
import styles from "./species.module.css";

// Quanto da altura extra da imagem (em vh) é usada no percurso da rolagem.
const TRAVEL_VH = 0.25;

export function ParallaxBackground({ src }: { src: string }) {
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = imageRef.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      el.style.transform = `translate3d(0, ${-progress * TRAVEL_VH * window.innerHeight}px, 0)`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className={styles.parallaxLayer} aria-hidden="true">
      <div
        ref={imageRef}
        className={styles.parallaxImage}
        style={{
          backgroundImage: `linear-gradient(rgba(12, 14, 24, 0.35), rgba(12, 14, 24, 0.55)), url(${src})`,
        }}
      />
    </div>
  );
}
