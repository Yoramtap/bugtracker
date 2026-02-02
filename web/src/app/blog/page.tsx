import Link from "next/link";
import styles from "./page.module.css";
import { posts } from "./posts";
import KeyboardCardGrid from "../components/keyboard-card-grid";

export default function BlogIndexPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>build notes</p>
          <h1>All notes, gentle and steady.</h1>
          <p className={styles.subtitle}>
            Recent build logs to warm the week, each with a small change and a calm,
            considered rhythm.
          </p>
        </div>
        <Link className={styles.backLink} href="/">
          back to home
        </Link>
      </header>

      <KeyboardCardGrid
        items={[...posts].reverse()}
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

      <div className={styles.pagination}>
        <a href="#" aria-disabled="true">
          older notes
        </a>
      </div>
    </div>
  );
}
