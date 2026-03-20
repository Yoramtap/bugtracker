#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_TARGET = "/Users/yoramtap/Documents/AI/tracker";
const SAFE_FILES = [
  "backlog-snapshot.json",
  "contributors-snapshot.json",
  "product-cycle-snapshot.json",
  "pr-cycle-snapshot.json",
  "index.html",
  "dashboard-styles.css",
  "dashboard-preload.js",
  "dashboard-view-utils.js",
  "dashboard-data-utils.js",
  "dashboard-chart-core.js",
  "dashboard-charts-backlog.js",
  "dashboard-charts-delivery.js",
  "dashboard-charts-product.js",
  "dashboard-app.js",
  "agentation-local-loader.js",
  "vendor/react.production.min.js",
  "vendor/react-dom.production.min.js",
  "vendor/prop-types.min.js",
  "vendor/recharts.umd.js"
];

function sanitizePrCycleStage(stage) {
  return {
    key: String(stage?.key || "").trim(),
    label: String(stage?.label || "").trim(),
    days: Number.isFinite(stage?.days) ? stage.days : 0,
    sampleCount: Number.isFinite(stage?.sampleCount) ? stage.sampleCount : 0
  };
}

function sanitizePrCycleTeam(team) {
  return {
    key: String(team?.key || "").trim(),
    label: String(team?.label || "").trim(),
    issueCount: Number.isFinite(team?.issueCount) ? team.issueCount : 0,
    totalCycleDays: Number.isFinite(team?.totalCycleDays) ? team.totalCycleDays : 0,
    bottleneckLabel: String(team?.bottleneckLabel || "").trim(),
    stages: Array.isArray(team?.stages) ? team.stages.map(sanitizePrCycleStage) : []
  };
}

function sanitizePrCycleWindow(windowSnapshot) {
  return {
    windowLabel: String(windowSnapshot?.windowLabel || "").trim(),
    teams: Array.isArray(windowSnapshot?.teams) ? windowSnapshot.teams.map(sanitizePrCycleTeam) : []
  };
}

function sanitizePrCycleSnapshot(snapshot) {
  const windows =
    snapshot?.windows && typeof snapshot.windows === "object"
      ? Object.fromEntries(
          Object.entries(snapshot.windows).map(([key, windowSnapshot]) => [
            key,
            sanitizePrCycleWindow(windowSnapshot)
          ])
        )
      : undefined;

  return {
    updatedAt: String(snapshot?.updatedAt || "").trim(),
    defaultTeam: String(snapshot?.defaultTeam || "").trim(),
    defaultWindow: String(snapshot?.defaultWindow || "").trim(),
    ...(windows ? { windows } : {}),
    ...(Array.isArray(snapshot?.teams) ? { teams: snapshot.teams.map(sanitizePrCycleTeam) } : {}),
    ...(String(snapshot?.windowLabel || "").trim()
      ? { windowLabel: String(snapshot?.windowLabel || "").trim() }
      : {})
  };
}

function getArg(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return "";
  return (process.argv[index + 1] ?? "").trim();
}

async function ensureDir(dirPath) {
  const stat = await fs.stat(dirPath);
  if (!stat.isDirectory()) {
    throw new Error(`Target path is not a directory: ${dirPath}`);
  }
}

async function copySafeFiles(sourceDir, targetDir) {
  for (const fileName of SAFE_FILES) {
    const sourcePath = path.join(sourceDir, fileName);
    const targetPath = path.join(targetDir, fileName);

    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    if (fileName === "pr-cycle-snapshot.json") {
      const raw = await fs.readFile(sourcePath, "utf8");
      const sanitized = sanitizePrCycleSnapshot(JSON.parse(raw));
      await fs.writeFile(targetPath, `${JSON.stringify(sanitized, null, 2)}\n`, "utf8");
    } else {
      await fs.copyFile(sourcePath, targetPath);
    }
    console.log(`Copied ${fileName} -> ${targetPath}`);
  }
}

async function main() {
  const sourceDir = process.cwd();
  const targetDir = path.resolve(getArg("--target") || DEFAULT_TARGET);

  if (path.resolve(sourceDir) === targetDir) {
    throw new Error("Refusing to export into the same directory.");
  }

  await ensureDir(targetDir);

  // Sanity check for expected public repo shape.
  for (const expected of ["index.html", "dashboard-app.js", "dashboard-styles.css", ".git"]) {
    const expectedPath = path.join(targetDir, expected);
    try {
      await fs.stat(expectedPath);
    } catch {
      throw new Error(`Target does not look like tracker repo (missing ${expected}).`);
    }
  }

  await copySafeFiles(sourceDir, targetDir);
  console.log(`Export complete. Tracker repo updated at: ${targetDir}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
