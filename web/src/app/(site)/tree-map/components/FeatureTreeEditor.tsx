import { FEATURE_SIZES, type Deliverable, type FeatureGroup, type FeatureSize, VALID_PROGRESS_VALUES } from "../types";
import { toReadableCase } from "../data";
import styles from "../page.module.css";

type FeatureTreeEditorProps = {
  featureGroups: FeatureGroup[];
  featureNameDrafts: Record<string, string>;
  isGroupExpanded: (groupKey: string) => boolean;
  onToggleGroup: (groupKey: string) => void;
  onFeatureNameDraftChange: (groupKey: string, value: string) => void;
  onFeatureNameCommit: (groupKey: string, fallbackLabel: string) => void;
  onCreateFeatureGroup: () => void;
  onCreateTitle: (group: FeatureGroup) => void;
  onUpdateFeatureSize: (groupKey: string, nextSize: FeatureSize) => void;
  onDeleteFeatureGroup: (groupKey: string) => void;
  onUpdateDeliverableTitleDraft: (id: string, title: string) => void;
  onUpdateDeliverable: (id: string, patch: Partial<Deliverable>) => void;
  onDeleteDeliverable: (id: string) => void;
  onCollapseAll: () => void;
  onExpandAll: () => void;
};

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <path
        d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 6h2v8h-2V9zm4 0h2v8h-2V9zM7 9h2v8H7V9zm-1 12h12a2 2 0 0 0 2-2V8H4v11a2 2 0 0 0 2 2z"
        fill="currentColor"
      />
    </svg>
  );
}

export function FeatureTreeEditor({
  featureGroups,
  featureNameDrafts,
  isGroupExpanded,
  onToggleGroup,
  onFeatureNameDraftChange,
  onFeatureNameCommit,
  onCreateFeatureGroup,
  onCreateTitle,
  onUpdateFeatureSize,
  onDeleteFeatureGroup,
  onUpdateDeliverableTitleDraft,
  onUpdateDeliverable,
  onDeleteDeliverable,
  onCollapseAll,
  onExpandAll,
}: FeatureTreeEditorProps) {
  return (
    <section className={styles.editColumn}>
      <h2>Feature Tree</h2>
      <p className={styles.treeHint}>
        Manage feature groups and titles directly here. This editor is independent from map clicks.
      </p>

      <button type="button" className={styles.addButton} onClick={onCreateFeatureGroup}>
        + Add feature group
      </button>
      <div className={styles.treeBulkActions}>
        <button type="button" className={styles.bulkActionButton} onClick={onCollapseAll}>
          Collapse all
        </button>
        <button type="button" className={styles.bulkActionButton} onClick={onExpandAll}>
          Expand all
        </button>
      </div>

      <div className={styles.treeList}>
        {featureGroups.map((group) => (
          <section key={group.key} className={styles.treeGroupCard}>
            <div className={styles.treeGroupHeader}>
              <div className={styles.treeGroupTitleRow}>
                <button
                  type="button"
                  className={styles.treeToggle}
                  onClick={() => onToggleGroup(group.key)}
                  aria-expanded={isGroupExpanded(group.key)}
                  aria-controls={`group-${group.key}`}
                >
                  {isGroupExpanded(group.key) ? "▾" : "▸"}
                </button>
                <label className={styles.treeGroupNameField}>
                  <input
                    type="text"
                    value={featureNameDrafts[group.key] ?? group.label}
                    onChange={(event) => onFeatureNameDraftChange(group.key, event.target.value)}
                    onBlur={() => onFeatureNameCommit(group.key, group.label)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        (event.currentTarget as HTMLInputElement).blur();
                      }
                    }}
                    aria-label="Feature name"
                  />
                </label>
                <button
                  type="button"
                  className={styles.treeAddTitleButton}
                  onClick={() => onCreateTitle(group)}
                >
                  + Add title
                </button>
                <label className={styles.treeSizeField}>
                  <span>Size</span>
                  <select
                    value={group.size}
                    onChange={(event) => onUpdateFeatureSize(group.key, event.target.value as FeatureSize)}
                  >
                    {FEATURE_SIZES.map((size) => (
                      <option key={size} value={size}>
                        {size.charAt(0).toUpperCase() + size.slice(1)}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className={styles.deleteGroupIconButton}
                  onClick={() => onDeleteFeatureGroup(group.key)}
                  aria-label="Delete feature group"
                  title="Delete feature group"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>

            {isGroupExpanded(group.key) ? (
              <div className={styles.treeItems} id={`group-${group.key}`}>
                <div className={styles.treeChildrenBox}>
                  {group.items.map((item) => (
                    <div key={item.id} className={styles.treeItemRow}>
                      <div className={styles.treeItemTitleRow}>
                        <label className={styles.treeItemTitleField}>
                          <span>Title</span>
                          <input
                            type="text"
                            value={item.title}
                            onChange={(event) =>
                              onUpdateDeliverableTitleDraft(item.id, event.target.value)
                            }
                            onBlur={(event) =>
                              onUpdateDeliverable(item.id, {
                                title: toReadableCase(event.target.value),
                              })
                            }
                          />
                        </label>
                        <button
                          type="button"
                          className={styles.deleteItemIconButton}
                          onClick={() => onDeleteDeliverable(item.id)}
                          aria-label="Delete title"
                          title="Delete title"
                        >
                          <TrashIcon />
                        </button>
                      </div>

                      <div className={styles.treeMetaGrid}>
                        <label className={styles.treeSmallField}>
                          <span>Complexity</span>
                          <select
                            value={item.complexity}
                            onChange={(event) =>
                              onUpdateDeliverable(item.id, {
                                complexity: Number(event.target.value),
                              })
                            }
                          >
                            {[1, 2, 3, 4, 5].map((value) => (
                              <option key={value} value={value}>
                                {value}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className={styles.treeSmallField}>
                          <span>Progress</span>
                          <select
                            value={item.progress}
                            onChange={(event) =>
                              onUpdateDeliverable(item.id, {
                                progress: Number(event.target.value),
                              })
                            }
                          >
                            {VALID_PROGRESS_VALUES.map((value) => (
                              <option key={value} value={value}>
                                {value}%
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        ))}
      </div>
    </section>
  );
}
