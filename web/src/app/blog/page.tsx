import styles from "./page.module.css";
import { posts } from "./posts";
import KeyboardCardGrid from "../components/keyboard-card-grid";

export default function BlogIndexPage() {
  const sortedPosts = [...posts].sort((a, b) => {
    const aTime = Date.parse(a.date);
    const bTime = Date.parse(b.date);
    if (aTime !== bTime) return bTime - aTime;
    return 0;
  });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>build notes</p>
          <h1>Stories that shipped it.</h1>
          <p className={styles.subtitle}>
            Each entry captures what shipped, what changed, and what we learned.
          </p>
        </div>
      </header>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionKicker}>build notes</p>
            <h2>Stories that shipped it</h2>
          </div>
        </div>
        <KeyboardCardGrid
          items={sortedPosts.map((post) => ({
            ...post,
            category: "story",
        }))}
        classNames={{
          grid: styles.cards,
          card: styles.card,
          meta: styles.cardMeta,
          excerpt: styles.cardExcerpt,
          link: styles.cardLink,
          focused: styles.cardFocused,
        }}
        linkLabel="Read the note"
        backspaceHref="/"
      />
      </section>

      <div className={styles.pagination}>
        <a href="#" aria-disabled="true">
          older notes
        </a>
      </div>
    </div>
  );
}
