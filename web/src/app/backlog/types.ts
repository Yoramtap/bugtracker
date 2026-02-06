export type TrendPoint = {
  date: string;
  highest: number;
  high: number;
  medium: number;
  low: number;
  lowest: number;
};

export type TeamKey = "api" | "legacy" | "react";

export type CombinedTrendPoint = {
  date: string;
  api: TrendPoint;
  legacy: TrendPoint;
  react: TrendPoint;
};

export type BacklogSnapshot = {
  source: {
    mode: string;
    syncedAt: string;
    note: string;
  };
  combinedPoints: CombinedTrendPoint[];
};
