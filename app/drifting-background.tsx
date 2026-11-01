import styles from "./species.module.css";

// Oito segmentos alternando normal e espelhado: a emenda fica contínua
// mesmo se a arte não for pensada para repetir.
const SEGMENTS = 8;

export function DriftingBackground({ src }: { src: string }) {
  const segmentStyle = { backgroundImage: `url(${src})` };

  return (
    <div className={styles.driftLayer} aria-hidden="true">
      <div className={styles.driftTrack}>
        {Array.from({ length: SEGMENTS }, (_, i) => (
          <div
            key={i}
            className={i % 2 === 1 ? `${styles.driftSegment} ${styles.driftFlipped}` : styles.driftSegment}
            style={segmentStyle}
          />
        ))}
      </div>
    </div>
  );
}
