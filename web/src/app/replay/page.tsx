import styles from "./page.module.css";
import { getReplayEvents } from "./data";

export default function ReplayPage() {
  const replayEvents = getReplayEvents();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.kicker}>replay</p>
        <h1>Build Replay Timeline</h1>
        <p className={styles.subtitle}>
          Follow each build arc from PRD kickoff to shipped stories in one
          chronological view.
        </p>
      </header>

      <section
        className={styles.timeline}
        aria-label="Replay timeline events"
        aria-live="polite"
      >
        <h2 className={styles.timelineTitle}>Timeline</h2>
        <p className={styles.timelineMeta}>
          {replayEvents.length} events loaded from PRDs and shipped stories.
        </p>
        <p className={styles.timelineHint}>
          Event groups and detail views land here in upcoming iterations.
        </p>
      </section>
    </div>
  );
}
