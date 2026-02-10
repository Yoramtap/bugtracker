import {
  type Deliverable,
  type FeatureSize,
  FEATURE_SIZES,
  type ParsedItem,
  type PersistedState,
  STORAGE_KEY,
  VALID_PROGRESS_VALUES,
  normalizeInitiativeKey,
} from "./types";

export function toReadableCase(value: string) {
  const compact = value.trim().replace(/\s+/g, " ");
  return compact.replace(/\b([A-Za-z][A-Za-z']*)\b/g, (word) => {
    if (word.length <= 4 && word === word.toUpperCase()) return word;
    return `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`;
  });
}

export function normalizeDeliverableRecord(item: Deliverable): Deliverable {
  return {
    ...item,
    title: toReadableCase(item.title) || "Untitled",
    initiative: toReadableCase(item.initiative) || "Unassigned",
    complexity: Math.min(5, Math.max(1, Math.round(item.complexity))),
    progress: VALID_PROGRESS_VALUES.includes(item.progress)
      ? item.progress
      : Math.max(0, Math.min(100, Math.round(item.progress / 25) * 25)),
  };
}

export function normalizeDeliverables(input: unknown): Deliverable[] {
  if (!Array.isArray(input)) return [];

  return input
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => {
      const rawComplexity = Number(item.complexity);
      const complexity = Number.isInteger(rawComplexity)
        ? Math.min(5, Math.max(1, rawComplexity))
        : 1;
      const progress = Number(item.progress);

      return {
        id: typeof item.id === "string" ? item.id : `item-${Math.random().toString(36).slice(2)}`,
        title:
          typeof item.title === "string" && item.title.trim()
            ? toReadableCase(item.title)
            : "Untitled",
        initiative:
          typeof item.initiative === "string" && item.initiative.trim()
            ? toReadableCase(item.initiative)
            : "Unassigned",
        complexity,
        progress: Number.isFinite(progress) ? progress : 0,
      };
    });
}

export async function loadState(): Promise<PersistedState> {
  if (typeof window !== "undefined") {
    try {
      const rawPersisted = window.localStorage.getItem(STORAGE_KEY);
      if (rawPersisted) {
        const parsed = JSON.parse(rawPersisted) as {
          deliverables?: unknown;
          featureSizeByKey?: unknown;
        };
        const deliverables = normalizeDeliverables(parsed.deliverables);
        const featureSizeByKey = parseFeatureSizeByKey(parsed.featureSizeByKey);
        return { deliverables, featureSizeByKey };
      }
    } catch {
      // Invalid localStorage data should not break startup; fall through to data.json.
    }
  }

  try {
    const response = await fetch("/tree-map/data.json", { cache: "no-store" });
    if (!response.ok) return { deliverables: [], featureSizeByKey: {} };
    const raw = (await response.json()) as unknown;
    return {
      deliverables: normalizeDeliverables(raw),
      featureSizeByKey: {},
    };
  } catch {
    return { deliverables: [], featureSizeByKey: {} };
  }
}

function parseFeatureSizeByKey(input: unknown): Record<string, FeatureSize> {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const raw = input as Record<string, unknown>;
  const parsed: Record<string, FeatureSize> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (FEATURE_SIZES.includes(value as FeatureSize)) {
      parsed[normalizeInitiativeKey(key)] = value as FeatureSize;
    }
  }
  return parsed;
}

export function persistState(
  deliverables: Deliverable[],
  featureSizeByKey: Record<string, FeatureSize>,
) {
  if (typeof window === "undefined") return;

  const nextState = JSON.stringify({
    deliverables,
    featureSizeByKey,
  } satisfies PersistedState);
  window.localStorage.setItem(STORAGE_KEY, nextState);
}

export function resolveInitiativeName(
  rawInitiative: string,
  existingDeliverables: Deliverable[],
  excludingId?: string,
) {
  const fallback = toReadableCase(rawInitiative) || "Unassigned";
  const targetKey = normalizeInitiativeKey(fallback);
  const existing = existingDeliverables.find(
    (item) => item.id !== excludingId && normalizeInitiativeKey(item.initiative) === targetKey,
  );
  return existing?.initiative ?? fallback;
}

export function parsePastedText(text: string): ParsedItem[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  let currentInitiative = "Unassigned";
  const parsedItems: ParsedItem[] = [];

  for (const line of lines) {
    const explicitHeader = line.match(/^(feature|initiative|category)\s*:\s*(.+)$/i);
    if (explicitHeader) {
      const header = explicitHeader[2].trim();
      currentInitiative = toReadableCase(header) || "Unassigned";
      continue;
    }

    const sectionHeader = line.match(/^(.+?)\s*:\s*$/);
    if (sectionHeader) {
      const header = sectionHeader[1].trim();
      currentInitiative = toReadableCase(header) || "Unassigned";
      continue;
    }

    parsedItems.push({
      title: toReadableCase(line),
      initiative: currentInitiative,
    });
  }

  return parsedItems;
}

export function createUniqueId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `d-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
