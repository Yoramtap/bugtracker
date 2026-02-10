"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createUniqueId,
  loadState,
  normalizeDeliverableRecord,
  parsePastedText,
  persistState,
  resolveInitiativeName,
  toReadableCase,
} from "./data";
import { buildPlotlyTreemapData } from "./plot";
import {
  type Deliverable,
  DEFAULT_FEATURE_SIZE,
  type FeatureGroup,
  type FeatureSize,
  type ParsedItem,
  type TreeMapRenderVariant,
  normalizeInitiativeKey,
} from "./types";
import { FeatureTreeEditor } from "./components/FeatureTreeEditor";
import { ImportExportTools } from "./components/ImportExportTools";
import { MapCanvas } from "./components/MapCanvas";
import styles from "./page.module.css";

export default function TreeMapPage() {
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isControlPanelOpen, setIsControlPanelOpen] = useState(true);
  const [isMapViewMode, setIsMapViewMode] = useState(false);
  const [collapsedGroupKeys, setCollapsedGroupKeys] = useState<string[]>([]);
  const [featureSizeByKey, setFeatureSizeByKey] = useState<Record<string, FeatureSize>>({});
  const [featureNameDrafts, setFeatureNameDrafts] = useState<Record<string, string>>({});
  const [pasteText, setPasteText] = useState("");
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [renderVariant, setRenderVariant] = useState<TreeMapRenderVariant>("A");

  useEffect(() => {
    let active = true;

    async function initApp() {
      const loaded = await loadState();
      if (!active) return;
      setDeliverables(loaded.deliverables.map(normalizeDeliverableRecord));
      setFeatureSizeByKey(loaded.featureSizeByKey ?? {});
      setIsLoaded(true);
    }

    void initApp();

    return () => {
      active = false;
    };
  }, []);

  const hasDeliverables = deliverables.length > 0;

  const featureGroups = useMemo<FeatureGroup[]>(() => {
    const groups = new Map<string, { label: string; items: Deliverable[] }>();
    deliverables.forEach((item) => {
      const key = normalizeInitiativeKey(item.initiative);
      const existing = groups.get(key);
      if (existing) {
        existing.items.push(item);
      } else {
        groups.set(key, { label: item.initiative, items: [item] });
      }
    });

    return [...groups.entries()]
      .map(([key, value]) => ({
        key,
        label: value.label,
        size: featureSizeByKey[key] ?? DEFAULT_FEATURE_SIZE,
        items: value.items,
        totalComplexity: value.items.reduce((sum, item) => sum + item.complexity, 0),
      }))
      .sort((a, b) => b.totalComplexity - a.totalComplexity);
  }, [deliverables, featureSizeByKey]);

  const plotData = useMemo(
    () => buildPlotlyTreemapData(deliverables, featureSizeByKey, renderVariant),
    [deliverables, featureSizeByKey, renderVariant],
  );

  const plotTrace = useMemo(
    () => ({
      type: "treemap",
      ids: plotData.ids,
      labels: plotData.labels,
      parents: plotData.parents,
      values: plotData.values,
      branchvalues: "total",
      sort: false,
      textinfo: "label",
      textfont: { size: 13, color: "#10253d", family: "var(--font-body), Nunito Sans, sans-serif" },
      texttemplate: "%{label}",
      textposition: "top center",
      hoverinfo: "text",
      hovertext: plotData.hovers,
      marker: {
        colors: plotData.colors,
        line: {
          color: "rgba(0,0,0,0.55)",
          width: 0.6,
        },
      },
      pathbar: { visible: false },
      tiling: { packing: "squarify", squarifyratio: 1.2, pad: 0 },
      hoverlabel: { bgcolor: "#0f1f38", font: { color: "#f5fbff", size: 12 } },
    }),
    [plotData],
  );

  const plotLayout = useMemo(
    () => ({
      margin: { t: 0, r: 0, b: 0, l: 0 },
      paper_bgcolor: "transparent",
      plot_bgcolor: "transparent",
      dragmode: false,
      uirevision: `tree-map-${renderVariant}`,
    }),
    [renderVariant],
  );

  useEffect(() => {
    if (!isLoaded) return;
    persistState(deliverables, featureSizeByKey);
  }, [deliverables, featureSizeByKey, isLoaded]);

  useEffect(() => {
    setFeatureNameDrafts((current) => {
      const next: Record<string, string> = {};
      featureGroups.forEach((group) => {
        next[group.key] = current[group.key] ?? group.label;
      });
      return next;
    });
  }, [featureGroups]);

  function updateDeliverable(id: string, patch: Partial<Deliverable>) {
    setDeliverables((current) =>
      current.map((item) => {
        if (item.id !== id) return item;
        return normalizeDeliverableRecord({ ...item, ...patch });
      }),
    );
  }

  function updateDeliverableTitleDraft(id: string, title: string) {
    setDeliverables((current) =>
      current.map((item) => (item.id === id ? { ...item, title } : item)),
    );
  }

  function createFeatureGroup() {
    const baseLabel = "New Feature Group";
    const usedKeys = new Set(deliverables.map((item) => normalizeInitiativeKey(item.initiative)));
    let label = baseLabel;
    let index = 2;
    while (usedKeys.has(normalizeInitiativeKey(label))) {
      label = `${baseLabel} ${index}`;
      index += 1;
    }

    const entry: Deliverable = {
      id: createUniqueId(),
      title: "New Feature",
      initiative: label,
      complexity: 1,
      progress: 0,
    };

    const nextKey = normalizeInitiativeKey(label);
    setFeatureSizeByKey((current) => ({ ...current, [nextKey]: DEFAULT_FEATURE_SIZE }));
    setDeliverables((current) => [...current, entry]);
  }

  function isGroupExpanded(groupKey: string) {
    return !collapsedGroupKeys.includes(groupKey);
  }

  function toggleGroup(groupKey: string) {
    setCollapsedGroupKeys((current) =>
      current.includes(groupKey)
        ? current.filter((key) => key !== groupKey)
        : [...current, groupKey],
    );
  }

  function collapseAllGroups() {
    setCollapsedGroupKeys(featureGroups.map((group) => group.key));
  }

  function expandAllGroups() {
    setCollapsedGroupKeys([]);
  }

  function renameFeatureGroup(groupKey: string, rawNextName: string) {
    const nextName = toReadableCase(rawNextName) || "Unassigned";
    setDeliverables((current) => {
      const mergedName = resolveInitiativeName(nextName, current);
      const nextKey = normalizeInitiativeKey(mergedName);
      setFeatureSizeByKey((sizes) => {
        const currentSize = sizes[groupKey] ?? DEFAULT_FEATURE_SIZE;
        const nextSizes = { ...sizes };
        delete nextSizes[groupKey];
        nextSizes[nextKey] = currentSize;
        return nextSizes;
      });
      return current.map((item) =>
        normalizeInitiativeKey(item.initiative) === groupKey
          ? normalizeDeliverableRecord({ ...item, initiative: mergedName })
          : item,
      );
    });
  }

  function commitFeatureGroupRename(groupKey: string, fallbackLabel: string) {
    const draft = featureNameDrafts[groupKey] ?? fallbackLabel;
    renameFeatureGroup(groupKey, draft);
  }

  function createTitleUnderFeature(group: FeatureGroup) {
    const initiative = group.label || "Unassigned";
    const entry: Deliverable = {
      id: createUniqueId(),
      title: "New Feature",
      initiative,
      complexity: 1,
      progress: 0,
    };
    setDeliverables((current) => {
      const firstGroupIndex = current.findIndex(
        (item) => normalizeInitiativeKey(item.initiative) === group.key,
      );
      if (firstGroupIndex === -1) return [...current, entry];

      const next = [...current];
      next.splice(firstGroupIndex, 0, entry);
      return next;
    });
  }

  function updateFeatureSize(groupKey: string, nextSize: FeatureSize) {
    setFeatureSizeByKey((current) => ({ ...current, [groupKey]: nextSize }));
  }

  function deleteDeliverable(id: string) {
    setDeliverables((current) => current.filter((item) => item.id !== id));
  }

  function deleteFeatureGroup(groupKey: string) {
    setCollapsedGroupKeys((current) => current.filter((key) => key !== groupKey));
    setFeatureSizeByKey((current) => {
      const next = { ...current };
      delete next[groupKey];
      return next;
    });
    setDeliverables((current) =>
      current.filter((item) => normalizeInitiativeKey(item.initiative) !== groupKey),
    );
  }

  function onPasteTextChange(text: string) {
    setPasteText(text);
    setParsedItems(parsePastedText(text));
  }

  function applyParsedItems() {
    if (parsedItems.length === 0) return;

    const created = parsedItems.map((item) => ({
      id: createUniqueId(),
      title: item.title,
      initiative: resolveInitiativeName(item.initiative, deliverables),
      complexity: 1,
      progress: 0,
    }));

    setDeliverables((current) => [...current, ...created]);
    setPasteText("");
    setParsedItems([]);
  }

  function updateFeatureNameDraft(groupKey: string, value: string) {
    setFeatureNameDrafts((current) => ({
      ...current,
      [groupKey]: value,
    }));
  }

  return (
    <div className={styles.page}>
      <section className={`${styles.panel} ${isMapViewMode ? styles.panelWide : ""}`}>
        <header className={styles.header}>
          <p className={styles.kicker}>experimental tool</p>
          <h1>Tree map</h1>
          <p className={styles.subhead}>
            Items grouped by feature group, sized by complexity, and colored by progress.
          </p>
        </header>

        {!isLoaded ? <p className={styles.emptyState}>Loading features…</p> : null}

        {isLoaded && !hasDeliverables ? (
          <p className={styles.emptyState}>No features found. Add entries to data.json.</p>
        ) : null}

        <div className={`${styles.contentGrid} ${isMapViewMode ? styles.contentGridMapOnly : ""}`}>
          {hasDeliverables ? (
            <MapCanvas
              deliverableCount={deliverables.length}
              featureCount={featureGroups.length}
              isMapViewMode={isMapViewMode}
              onToggleMapView={() => setIsMapViewMode((current) => !current)}
              renderVariant={renderVariant}
              onRenderVariantChange={setRenderVariant}
              plotTrace={plotTrace}
              plotLayout={plotLayout}
            />
          ) : null}

          <section className={styles.controlsSection} id="tree-map-controls" hidden={isMapViewMode}>
            <div className={styles.controlsHeader}>
              <button
                type="button"
                className={styles.controlsToggle}
                onClick={() => setIsControlPanelOpen((current) => !current)}
                aria-expanded={isControlPanelOpen}
                aria-controls="tree-map-controls-panel"
              >
                {isControlPanelOpen ? "Hide Controls" : "Show Controls"}
              </button>
            </div>

            <aside
              id="tree-map-controls-panel"
              className={`${styles.detailsPanel} ${
                isControlPanelOpen ? styles.detailsPanelOpen : styles.detailsPanelClosed
              }`}
              aria-live="polite"
              aria-hidden={!isControlPanelOpen}
            >
              <div className={styles.editorColumns}>
                <FeatureTreeEditor
                  featureGroups={featureGroups}
                  featureNameDrafts={featureNameDrafts}
                  isGroupExpanded={isGroupExpanded}
                  onToggleGroup={toggleGroup}
                  onFeatureNameDraftChange={updateFeatureNameDraft}
                  onFeatureNameCommit={commitFeatureGroupRename}
                  onCreateFeatureGroup={createFeatureGroup}
                  onCreateTitle={createTitleUnderFeature}
                  onUpdateFeatureSize={updateFeatureSize}
                  onDeleteFeatureGroup={deleteFeatureGroup}
                  onUpdateDeliverableTitleDraft={updateDeliverableTitleDraft}
                  onUpdateDeliverable={updateDeliverable}
                  onDeleteDeliverable={deleteDeliverable}
                  onCollapseAll={collapseAllGroups}
                  onExpandAll={expandAllGroups}
                />

                <ImportExportTools
                  pasteText={pasteText}
                  onPasteTextChange={onPasteTextChange}
                  parsedItems={parsedItems}
                  onApplyParsedItems={applyParsedItems}
                />
              </div>
            </aside>
          </section>
        </div>
      </section>
    </div>
  );
}
