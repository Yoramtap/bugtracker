import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "./page.module.css";
import { getPrdEntries, getPrdEntry } from "../data";
import { renderMarkdown } from "../markdown";

export const dynamicParams = false;

export function generateStaticParams() {
  return getPrdEntries().map((entry) => ({ slug: entry.slug }));
}

type Params = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function PrdPage({ params }: Params) {
  const { slug } = await params;
  const prd = getPrdEntry(slug);

  if (!prd || !prd.content) {
    notFound();
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.backLink} href="/prds">
          back to PRDs
        </Link>
        <p className={styles.meta}>
          <span>PRD</span>
          <span>{prd.date}</span>
        </p>
        <h1>{prd.title}</h1>
      </header>

      <section className={styles.body}>{renderMarkdown(prd.content)}</section>
    </div>
  );
}
