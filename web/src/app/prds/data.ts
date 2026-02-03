import fs from "fs";
import path from "path";

export type PrdEntry = {
  slug: string;
  title: string;
  summary: string;
  date: string;
  content?: string;
};

export type PrdCard = Pick<
  PrdEntry,
  "slug" | "title" | "summary" | "date"
> & { category: string };

const TASKS_DIR = path.resolve(process.cwd(), "..", "tasks");

const formatDate = (value: Date) =>
  value.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const getTitleFromMarkdown = (markdown: string) => {
  const line = markdown.split("\n").find((row) => row.startsWith("# "));
  return line ? line.replace(/^#\s+/, "").trim() : "Untitled PRD";
};

const getSummaryFromMarkdown = (markdown: string) => {
  const lines = markdown.split("\n");
  const introIndex = lines.findIndex((line) =>
    line.trim().startsWith("## 1. Introduction/Overview")
  );
  const startIndex = introIndex >= 0 ? introIndex + 1 : 1;
  const summaryLines: string[] = [];

  for (let i = startIndex; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line) {
      if (summaryLines.length > 0) break;
      continue;
    }
    if (line.startsWith("## ")) break;
    summaryLines.push(line);
    if (summaryLines.join(" ").length > 160) break;
  }

  return summaryLines.join(" ").trim() || "Product brief and implementation plan.";
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
      return {
        slug: file.replace(/^prd-/, "").replace(/\.md$/, ""),
        title: getTitleFromMarkdown(content),
        summary: getSummaryFromMarkdown(content),
        date: formatDate(stat.mtime),
      };
    })
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
};

export const getPrdEntry = (slug: string): PrdEntry | null => {
  if (!fs.existsSync(TASKS_DIR)) return null;
  const filePath = path.join(TASKS_DIR, `prd-${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, "utf-8");
  const stat = fs.statSync(filePath);
  return {
    slug,
    title: getTitleFromMarkdown(content),
    summary: getSummaryFromMarkdown(content),
    date: formatDate(stat.mtime),
    content,
  };
};

export const getPrdCards = (): PrdCard[] =>
  getPrdEntries().map((entry) => ({
    slug: entry.slug,
    title: entry.title,
    summary: entry.summary,
    date: entry.date,
    category: "PRD",
  }));
