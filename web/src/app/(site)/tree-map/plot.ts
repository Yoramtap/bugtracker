import {
  DEFAULT_FEATURE_SIZE,
  type Deliverable,
  type FeatureSize,
  type TreeMapRenderVariant,
  normalizeInitiativeKey,
} from "./types";
import { toReadableCase } from "./data";

export type PlotlyTreemapData = {
  ids: string[];
  labels: string[];
  parents: string[];
  values: number[];
  colors: string[];
  hovers: string[];
};

export function buildPlotlyTreemapData(
  deliverables: Deliverable[],
  featureSizeByKey: Record<string, FeatureSize> = {},
  renderVariant: TreeMapRenderVariant = "A",
): PlotlyTreemapData {
  const rootId = "root";
  const avgProgress =
    deliverables.length > 0
      ? Math.round(
          deliverables.reduce((sum, item) => sum + item.progress, 0) / deliverables.length,
        )
      : 0;
  const ids: string[] = [rootId];
  const labels: string[] = [`All features · ${avgProgress}%`];
  const parents: string[] = [""];
  const values: number[] = [0];
  const colors: string[] = ["#f6f9ff"];
  const hovers: string[] = [`All features · ${deliverables.length} items · avg ${avgProgress}%`];

  const groups = new Map<string, { label: string; items: Deliverable[] }>();
  deliverables.forEach((item) => {
    const label = item.initiative || "Unassigned";
    const key = normalizeInitiativeKey(label);
    const existing = groups.get(key);
    if (existing) {
      existing.items.push(item);
    } else {
      groups.set(key, { label, items: [item] });
    }
  });

  const orderedGroups = [...groups.entries()].sort((a, b) => {
    const aTotal = a[1].items.reduce((sum, item) => sum + item.complexity, 0);
    const bTotal = b[1].items.reduce((sum, item) => sum + item.complexity, 0);
    return bTotal - aTotal;
  });

  const SIZE_FACTOR: Record<FeatureSize, number> = {
    small: 1,
    medium: 2,
    large: 3,
  };

  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const rgb = (r: number, g: number, b: number) =>
    `rgb(${Math.round(clamp(r, 0, 255))} ${Math.round(clamp(g, 0, 255))} ${Math.round(clamp(b, 0, 255))})`;

  const START = { r: 229, g: 91, b: 78 }; // richer red
  const MID = { r: 238, g: 203, b: 126 }; // warm amber
  const END = { r: 122, g: 205, b: 146 }; // pastel green

  function colorForProgress(progress: number) {
    if (renderVariant === "B") {
      // Option B intentionally mirrors A for now; this branch is the upcoming A/B hook point.
    }
    const t = clamp(progress / 100, 0, 1);
    if (t <= 0.5) {
      const local = t / 0.5;
      return rgb(
        lerp(START.r, MID.r, local),
        lerp(START.g, MID.g, local),
        lerp(START.b, MID.b, local),
      );
    }
    const local = (t - 0.5) / 0.5;
    return rgb(
      lerp(MID.r, END.r, local),
      lerp(MID.g, END.g, local),
      lerp(MID.b, END.b, local),
    );
  }
  let weightedRootTotal = 0;

  orderedGroups.forEach(([initiativeKey, group]) => {
    const initiative = toReadableCase(group.label) || "Unassigned";
    const items = group.items;
    const groupId = `cat:${initiativeKey}`;
    const featureSize = featureSizeByKey[initiativeKey] ?? DEFAULT_FEATURE_SIZE;
    const groupWeight = SIZE_FACTOR[featureSize];
    const complexityTotal = items.reduce((sum, item) => sum + item.complexity, 0);
    const isVariantB = renderVariant === "B";
    const effectiveGroupWeight = isVariantB ? Math.max(1, complexityTotal) : groupWeight;
    weightedRootTotal += effectiveGroupWeight;
    const avgProgress = Math.round(items.reduce((sum, item) => sum + item.progress, 0) / items.length);
    ids.push(groupId);
    labels.push(`${initiative} · ${avgProgress}%`);
    parents.push(rootId);
    values.push(effectiveGroupWeight);
    colors.push("#f5f8fe");
    hovers.push(
      isVariantB
        ? `${initiative} · ${items.length} items · avg ${avgProgress}%`
        : `${initiative} · ${items.length} items · avg ${avgProgress}% · size ${featureSize}`,
    );

    items.forEach((item) => {
      const nodeId = `feat:${item.id}`;
      const displayTitle = toReadableCase(item.title) || "Untitled";
      const displayFeature = toReadableCase(item.initiative) || "Unassigned";
      const nodeWeight = isVariantB
        ? item.complexity
        : complexityTotal > 0
          ? (groupWeight * item.complexity) / complexityTotal
          : groupWeight / items.length;
      ids.push(nodeId);
      labels.push(`${displayTitle} · ${item.progress}%`);
      parents.push(groupId);
      values.push(nodeWeight);
      colors.push(colorForProgress(item.progress));
      hovers.push(
        `<b>${displayTitle}</b><br>Feature: ${displayFeature}<br>Complexity: ${item.complexity}<br>Progress: ${item.progress}%`,
      );
    });
  });

  values[0] = weightedRootTotal;

  return { ids, labels, parents, values, colors, hovers };
}
