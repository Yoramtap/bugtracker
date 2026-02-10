export type Deliverable = {
  id: string;
  title: string;
  initiative: string;
  complexity: number;
  progress: number;
};

export type PersistedState = {
  deliverables: Deliverable[];
  featureSizeByKey?: Record<string, FeatureSize>;
};

export type ParsedItem = {
  title: string;
  initiative: string;
};

export type FeatureGroup = {
  key: string;
  label: string;
  size: FeatureSize;
  items: Deliverable[];
  totalComplexity: number;
};

export type TreeMapRenderVariant = "A" | "B";

export type FeatureSize = "small" | "medium" | "large";
export const FEATURE_SIZES: FeatureSize[] = ["small", "medium", "large"];
export const DEFAULT_FEATURE_SIZE: FeatureSize = "medium";
export const VALID_PROGRESS_VALUES = [0, 25, 50, 75, 100];
export const STORAGE_KEY = "treemapToolState_v2";

export const normalizeInitiativeKey = (value: string) => value.trim().toLowerCase();
