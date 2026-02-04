import Link from "next/link";
import styles from "./page.module.css";
import { getPrdEntries } from "../prds/data";
import { getPrdSlugsFromTags, posts } from "./posts";

export default function BlogIndexPage() {
  const prdEntries = getPrdEntries();
  const sortedPosts = [...posts].sort((a, b) => {
    const aTime = Date.parse(a.date);
    const bTime = Date.parse(b.date);
    if (aTime !== bTime) return bTime - aTime;
    return 0;
  });
  const prdGroups = prdEntries.map((entry) => {
    const relatedStories = sortedPosts.filter((post) =>
      getPrdSlugsFromTags(post.tags).includes(entry.slug)
    );
    return {
      ...entry,
      relatedStories,
    };
  });
  const unassignedStories = sortedPosts.filter(
    (post) => getPrdSlugsFromTags(post.tags).length === 0
  );

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
        <ul className={styles.groupList}>
          {prdGroups.map((group) => (
            <li key={group.slug} className={styles.groupItem}>
              <Link className={styles.noteLink} href={`/prds/${group.slug}`}>
                <h3 className={styles.noteTitle}>{group.title}</h3>
              </Link>
              {group.relatedStories.length > 0 ? (
                <ul className={styles.storyList}>
                  {group.relatedStories.map((post) => (
                    <li key={post.slug} className={styles.storyItem}>
                      <Link className={styles.noteLink} href={`/blog/${post.slug}`}>
                        <span className={styles.storyTitle}>{post.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.emptyNote}>No related stories yet.</p>
              )}
            </li>
          ))}
          <li className={styles.groupItem}>
            <p className={styles.unassignedTitle}>Unassigned</p>
            {unassignedStories.length > 0 ? (
              <ul className={styles.storyList}>
                {unassignedStories.map((post) => (
                  <li key={post.slug} className={styles.storyItem}>
                    <Link className={styles.noteLink} href={`/blog/${post.slug}`}>
                      <span className={styles.storyTitle}>{post.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.emptyNote}>No unassigned stories yet.</p>
            )}
          </li>
        </ul>
      </section>

      <div className={styles.pagination}>
        <a href="#" aria-disabled="true">
          older notes
        </a>
      </div>
    </div>
  );
}
