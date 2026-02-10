import type { ParsedItem } from "../types";
import styles from "../page.module.css";

type ImportExportToolsProps = {
  pasteText: string;
  onPasteTextChange: (text: string) => void;
  parsedItems: ParsedItem[];
  onApplyParsedItems: () => void;
};

export function ImportExportTools({
  pasteText,
  onPasteTextChange,
  parsedItems,
  onApplyParsedItems,
}: ImportExportToolsProps) {
  return (
    <section className={styles.toolsColumn}>
      <h2>Paste Helper</h2>

      <section className={styles.pasteSection}>
        <p className={styles.pasteHint}>
          Use one title per line. Lines ending with <code>:</code> are feature headers.
        </p>
        <textarea
          className={styles.pasteTextarea}
          value={pasteText}
          onChange={(event) => onPasteTextChange(event.target.value)}
          placeholder={"UI Modernization:\nPort Settings page to new UI\nPort Billing page to new UI\n\nProject X:\nBuild feature A"}
        />

        {parsedItems.length > 0 ? (
          <ul className={styles.parsedPreview}>
            {parsedItems.map((item, index) => (
              <li key={`${item.initiative}-${item.title}-${index}`}>
                <strong>{item.initiative}</strong> · {item.title}
              </li>
            ))}
          </ul>
        ) : null}

        <button
          type="button"
          className={styles.applyParsedButton}
          onClick={onApplyParsedItems}
          disabled={parsedItems.length === 0}
        >
          Apply pasted items
        </button>
      </section>
    </section>
  );
}
