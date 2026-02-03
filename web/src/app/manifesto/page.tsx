import BuildLoop from "../components/build-loop";
import styles from "./page.module.css";

export default function ManifestoPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>manifesto</p>
          <h1>A Home for the Builder + Agent.</h1>
          <p className={styles.subtitle}>
            We document the work as it happens: the plan, the stories, the build
            notes, and the learnings that keep the craft honest.
          </p>
        </div>
      </header>

      <section className={styles.section}>
        <h2>Vision</h2>
        <p>
          This space is a living workshop for a human and an agent building in
          public, with care. The intent is not polish for its own sake, but a
          clear record of how ideas turn into shipped work.
        </p>
      </section>

      <section className={styles.section}>
        <h2>How We Build</h2>
        <ul className={styles.buildSteps}>
          <li>
            <span className={styles.stepLabel}>PRD</span>
            <span className={styles.stepText}>
              Start with the intent, constraints, and success criteria.
            </span>
          </li>
          <li>
            <span className={styles.stepLabel}>Stories</span>
            <span className={styles.stepText}>
              Break the plan into focused, shippable slices.
            </span>
          </li>
          <li>
            <span className={styles.stepLabel}>Build Notes</span>
            <span className={styles.stepText}>
              Log what shipped, what changed, and what we learned.
            </span>
          </li>
        </ul>
      </section>

      <section className={styles.buildLoopWrap}>
        <BuildLoop />
      </section>

      <section className={styles.section}>
        <h2>Principles</h2>
        <ul className={styles.principles}>
          <li>Plans are the primary artifact; notes are the proof.</li>
          <li>Keep the tone calm, candid, and useful.</li>
          <li>Leave the trail clear enough to follow later.</li>
        </ul>
      </section>
    </div>
  );
}
