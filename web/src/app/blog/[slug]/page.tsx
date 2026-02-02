import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "./page.module.css";
import { posts } from "../posts";
import PostNav from "./post-nav";

export const dynamicParams = false;

export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

type Params = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function BlogPostPage({ params }: Params) {
  const { slug } = await params;
  const post = posts.find((entry) => entry.slug === slug);

  if (!post) {
    notFound();
  }

  const sortedPosts = [...posts].sort((a, b) => {
    const aTime = Date.parse(a.date);
    const bTime = Date.parse(b.date);
    return bTime - aTime;
  });

  const currentIndex = sortedPosts.findIndex((entry) => entry.slug === slug);
  const previousPost =
    currentIndex > 0 ? sortedPosts[currentIndex - 1] : null;
  const nextPost =
    currentIndex < sortedPosts.length - 1
      ? sortedPosts[currentIndex + 1]
      : null;

  return (
    <PostLayout
      post={post}
      previousPost={previousPost}
      nextPost={nextPost}
    />
  );
}

type PostLayoutProps = {
  post: typeof posts[number];
  previousPost: typeof posts[number] | null;
  nextPost: typeof posts[number] | null;
};

function PostLayout({ post, previousPost, nextPost }: PostLayoutProps) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.backLink} href="/blog">
          back to blog
        </Link>
        <p className={styles.meta}>
          <span>{post.category}</span>
          <span>{post.author}</span>
          <span>{post.date}</span>
        </p>
        <h1>{post.title}</h1>
      </header>

      <section className={styles.body}>
        <h2>What shipped</h2>
        <p>{post.whatShipped}</p>

        <h3>Files touched</h3>
        <ul>
          {post.files.map((file) => (
            <li key={file}>{file}</li>
          ))}
        </ul>

        <h3>Learnings</h3>
        <ul>
          {post.learnings.map((learning) => (
            <li key={learning}>{learning}</li>
          ))}
        </ul>

        <PostNav previousPost={previousPost} nextPost={nextPost} />
      </section>
    </div>
  );
}
