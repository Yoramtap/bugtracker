"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import styles from "./page.module.css";

type PostSummary = {
  slug: string;
  title: string;
};

type PostNavProps = {
  previousPost: PostSummary | null;
  nextPost: PostSummary | null;
};

const isTextInputTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  return target.isContentEditable;
};

export default function PostNav({ previousPost, nextPost }: PostNavProps) {
  const router = useRouter();

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTextInputTarget(event.target)) return;

      const key = event.key;
      const goNext =
        key === "j" || key === "ArrowDown" || key === "ArrowRight";
      const goPrev = key === "k" || key === "ArrowUp" || key === "ArrowLeft";
      const goBack = key === "Backspace";

      if (!goNext && !goPrev && !goBack) return;

      if (goBack) {
        event.preventDefault();
        router.push("/prds");
        return;
      }

      if (goNext && nextPost) {
        event.preventDefault();
        router.push(`/prds/story/${nextPost.slug}`);
        return;
      }

      if (goPrev && previousPost) {
        event.preventDefault();
        router.push(`/prds/story/${previousPost.slug}`);
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [previousPost, nextPost, router]);

  if (!previousPost && !nextPost) return null;

  return (
    <div className={styles.postNav}>
      {previousPost ? (
        <Link className={styles.postNavLink} href={`/prds/story/${previousPost.slug}`}>
          <span className={styles.postNavLabel}>Previous</span>
          <span className={styles.postNavTitle}>{previousPost.title}</span>
        </Link>
      ) : (
        <div />
      )}
      {nextPost ? (
        <Link className={styles.postNavLink} href={`/prds/story/${nextPost.slug}`}>
          <span className={styles.postNavLabel}>Next</span>
          <span className={styles.postNavTitle}>{nextPost.title}</span>
        </Link>
      ) : (
        <div />
      )}
    </div>
  );
}
