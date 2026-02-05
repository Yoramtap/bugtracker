import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { getPrdSlugsFromTags, posts } from "./story/posts";

export type PrdEntry = {
  slug: string;
  title: string;
  summary: string;
  date: string;
  content?: string;
  relatedStories?: {
    slug: string;
    title: string;
    date: string;
  }[];
};

export type PrdCard = Pick<
  PrdEntry,
  "slug" | "title" | "summary" | "date"
> & { category: string; storyCount: number };

const TASKS_DIR = path.resolve(process.cwd(), "..", "tasks");
const REPO_ROOT = path.resolve(process.cwd(), "..");

const formatDate = (value: Date) =>
  value.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const getGitCommitDate = (filePath: string): Date | null => {
  try {
    const relativePath = path.relative(REPO_ROOT, filePath);
    const output = execFileSync(
      "git",
      ["log", "-1", "--format=%cs", "--", relativePath],
      {
        cwd: REPO_ROOT,
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "ignore"],
      }
    ).trim();
    if (!output) return null;
    return new Date(`${output}T00:00:00Z`);
  } catch {
    return null;
  }
};

const stripVersionSuffix = (value: string) =>
  value.replace(/\s*\(v\d+\)\s*$/i, "").trim();

const getTitleFromMarkdown = (markdown: string) => {
  const line = markdown.split("\n").find((row) => row.startsWith("# "));
  if (!line) return "Untitled PRD";
  return stripVersionSuffix(line.replace(/^#\s+/, "").trim());
};

const getSummaryFromMarkdown = (markdown: string) => {
  const lines = markdown.split("\n");
  const introIndex = lines.findIndex((line) => {
    const trimmed = line.trim().toLowerCase();
    return (
      trimmed.startsWith("## 1. introduction/overview") ||
      trimmed.startsWith("## introduction/overview") ||
      trimmed.startsWith("## introduction") ||
      trimmed.startsWith("## overview")
    );
  });
  const startIndex = introIndex >= 0 ? introIndex + 1 : 1;
  const summaryLines: string[] = [];

  const collectSummary = (start: number) => {
    summaryLines.length = 0;
    for (let i = start; i < lines.length; i += 1) {
      const line = lines[i].trim();
      if (!line) {
        if (summaryLines.length > 0) break;
        continue;
      }
      if (line.startsWith("## ")) break;
      if (line.startsWith("# ")) break;
      summaryLines.push(line);
      if (summaryLines.join(" ").length > 180) break;
    }
  };

  collectSummary(startIndex);
  if (summaryLines.length === 0) {
    const afterTitleIndex = lines.findIndex((line) => line.startsWith("# "));
    collectSummary(afterTitleIndex >= 0 ? afterTitleIndex + 1 : 0);
  }

  return summaryLines.join(" ").trim() || "Overview pending.";
};

export const getPrdEntries = (): PrdEntry[] => {
  if (!fs.existsSync(TASKS_DIR)) return [];

  const files = fs
    .readdirSync(TASKS_DIR)
    .filter((file) => file.startsWith("prd-") && file.endsWith(".md"));

  return files
    .map((file) => {
      const filePath = path.join(TASKS_DIR, file);
      const content = fs.readFileSync(filePath, "utf-8");
      const stat = fs.statSync(filePath);
      const gitDate = getGitCommitDate(filePath) ?? stat.mtime;
      return {
        sortTime: gitDate instanceof Date ? gitDate.getTime() : stat.mtimeMs,
        entry: {
          slug: file.replace(/^prd-/, "").replace(/\.md$/, ""),
          title: getTitleFromMarkdown(content),
          summary: getSummaryFromMarkdown(content),
          date: formatDate(gitDate),
        },
      };
    })
    .sort((a, b) => b.sortTime - a.sortTime)
    .map(({ entry }) => entry);
};

export const getPrdEntry = (slug: string): PrdEntry | null => {
  if (!fs.existsSync(TASKS_DIR)) return null;
  const filePath = path.join(TASKS_DIR, `prd-${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, "utf-8");
  const stat = fs.statSync(filePath);
  const gitDate = getGitCommitDate(filePath) ?? stat.mtime;
  const relatedStories = posts
    .filter((post) => getPrdSlugsFromTags(post.tags).includes(slug))
    .map((post: { slug: string; title: string; date: string }) => ({
      slug: post.slug,
      title: post.title,
      date: post.date,
    }));
  return {
    slug,
    title: getTitleFromMarkdown(content),
    summary: getSummaryFromMarkdown(content),
    date: formatDate(gitDate),
    content,
    relatedStories,
  };
};

export const getPrdCards = (): PrdCard[] => {
  return getPrdEntries().map((entry) => ({
    slug: entry.slug,
    title: entry.title,
    summary: entry.summary,
    date: entry.date,
    category: "PRD",
    storyCount: posts.filter((post) => getPrdSlugsFromTags(post.tags).includes(entry.slug))
      .length,
  }));
};
