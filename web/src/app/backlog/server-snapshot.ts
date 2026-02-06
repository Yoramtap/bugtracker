import fs from "node:fs/promises";
import path from "node:path";
import { BOARD_38_TREND, BOARD_39_TREND, BOARD_46_TREND, backlogSource } from "./data";
import type { BacklogSnapshot, CombinedTrendPoint, TrendPoint } from "./types";

const SNAPSHOT_PATH = path.resolve(process.cwd(), "src/app/backlog/snapshot.json");

function normalizeTrendDate(date: string) {
  return date.startsWith("API ") ? date.slice(4) : date;
}

function emptyTrendPoint(date: string): TrendPoint {
  return { date, highest: 0, high: 0, medium: 0, low: 0, lowest: 0 };
}

function buildSnapshotFromModuleData(): BacklogSnapshot {
  const apiTrend = BOARD_38_TREND.map((point) => ({
    ...point,
    date: normalizeTrendDate(point.date),
  }));
  const legacyTrend = BOARD_39_TREND;
  const reactTrend = BOARD_46_TREND;

  const apiByDate = new Map(apiTrend.map((point) => [point.date, point]));
  const legacyByDate = new Map(legacyTrend.map((point) => [point.date, point]));
  const reactByDate = new Map(reactTrend.map((point) => [point.date, point]));

  const allDates = Array.from(
    new Set([
      ...apiTrend.map((point) => point.date),
      ...legacyTrend.map((point) => point.date),
      ...reactTrend.map((point) => point.date),
    ]),
  ).sort();

  const combinedPoints: CombinedTrendPoint[] = allDates.map((date) => ({
    date,
    api: apiByDate.get(date) ?? emptyTrendPoint(date),
    legacy: legacyByDate.get(date) ?? emptyTrendPoint(date),
    react: reactByDate.get(date) ?? emptyTrendPoint(date),
  }));

  return {
    source: backlogSource,
    combinedPoints,
  };
}

export async function getBacklogSnapshot(): Promise<BacklogSnapshot> {
  try {
    const raw = await fs.readFile(SNAPSHOT_PATH, "utf8");
    const parsed = JSON.parse(raw) as BacklogSnapshot;
    if (Array.isArray(parsed.combinedPoints) && parsed.source?.syncedAt) {
      return parsed;
    }
  } catch {
    // Fallback to module data below.
  }

  return buildSnapshotFromModuleData();
}
