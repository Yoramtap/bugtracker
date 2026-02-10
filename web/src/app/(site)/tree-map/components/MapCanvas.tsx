import dynamic from "next/dynamic";
import type { TreeMapRenderVariant } from "../types";
import styles from "../page.module.css";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

type MapCanvasProps = {
  deliverableCount: number;
  featureCount: number;
  isMapViewMode: boolean;
  onToggleMapView: () => void;
  renderVariant: TreeMapRenderVariant;
  onRenderVariantChange: (next: TreeMapRenderVariant) => void;
  plotTrace: object;
  plotLayout: object;
};

export function MapCanvas({
  deliverableCount,
  featureCount,
  isMapViewMode,
  onToggleMapView,
  renderVariant,
  onRenderVariantChange,
  plotTrace,
  plotLayout,
}: MapCanvasProps) {
  return (
    <div
      className={`${styles.chartWrap} ${isMapViewMode ? styles.chartWrapExpanded : ""}`}
      role="img"
      aria-label="Features treemap"
    >
      <div className={styles.mapLegend}>
        <div className={styles.variantSwitch} role="group" aria-label="Tree map render option">
          <button
            type="button"
            className={styles.variantButton}
            data-active={renderVariant === "A" ? "true" : "false"}
            aria-pressed={renderVariant === "A"}
            onClick={() => onRenderVariantChange("A")}
          >
            Option A
          </button>
          <button
            type="button"
            className={styles.variantButton}
            data-active={renderVariant === "B" ? "true" : "false"}
            aria-pressed={renderVariant === "B"}
            onClick={() => onRenderVariantChange("B")}
          >
            Option B
          </button>
        </div>
        <span className={styles.legendLabel}>Progress color</span>
        <div className={styles.legendScaleGroup} aria-hidden="true">
          <div className={styles.progressLegendBar} />
          <div className={styles.legendTickRow}>
            <span className={styles.legendScale}>0%</span>
            <span className={styles.legendScale}>25%</span>
            <span className={styles.legendScale}>50%</span>
            <span className={styles.legendScale}>75%</span>
            <span className={styles.legendScale}>100%</span>
          </div>
        </div>
        <button
          type="button"
          className={`${styles.mapViewToggle} ${isMapViewMode ? styles.mapViewToggleActive : ""}`}
          onClick={onToggleMapView}
          aria-pressed={isMapViewMode}
          title={isMapViewMode ? "Exit expanded map view" : "Expand map view"}
          aria-label={isMapViewMode ? "Exit expanded map view" : "Expand map view"}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
            {isMapViewMode ? (
              <path
                d="M8 4H4v4h2V6h2V4zm10 0h-4v2h2v2h2V4zM6 16H4v4h4v-2H6v-2zm14 0h-2v2h-2v2h4v-4z"
                fill="currentColor"
              />
            ) : (
              <path
                d="M9 3H3v6h2V5h4V3zm12 0h-6v2h4v4h2V3zM5 15H3v6h6v-2H5v-4zm16 0h-2v4h-4v2h6v-6z"
                fill="currentColor"
              />
            )}
          </svg>
        </button>
        <span className={styles.count}>{`${deliverableCount} items · ${featureCount} features`}</span>
      </div>
      <Plot
        className={styles.plot}
        data={[plotTrace as never]}
        layout={plotLayout as never}
        config={{ responsive: true, displayModeBar: false }}
        useResizeHandler
      />
    </div>
  );
}
