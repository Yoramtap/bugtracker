import Link from "next/link";
import styles from "./page.module.css";
import { type ReplayEvent, getReplayEvents } from "./data";

type ReplayEventGroup = {
  id: string;
  label: string;
  events: ReplayEvent[];
};

const formatDateLabel = (dateValue: string): string => {
  const timestamp = Date.parse(dateValue);
  if (Number.isNaN(timestamp)) return dateValue;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(timestamp));
};

const getDateGroupId = (dateValue: string): string => {
  const timestamp = Date.parse(dateValue);
  if (Number.isNaN(timestamp)) return `raw:${dateValue}`;
  return new Date(timestamp).toISOString().slice(0, 10);
};

const groupReplayEventsByDate = (events: ReplayEvent[]): ReplayEventGroup[] => {
  const groups = new Map<string, ReplayEventGroup>();

  events.forEach((event) => {
    const groupId = getDateGroupId(event.date);
    const existingGroup = groups.get(groupId);

    if (existingGroup) {
      existingGroup.events.push(event);
      return;
    }

    groups.set(groupId, {
      id: groupId,
      label: formatDateLabel(event.date),
      events: [event],
    });
  });

  return Array.from(groups.values());
};

const getEventTypeLabel = (type: ReplayEvent["type"]): string =>
  type === "prd_created" ? "PRD created" : "Story shipped";

const getEventLinkLabel = (type: ReplayEvent["type"]): string =>
  type === "prd_created" ? "Open PRD" : "Open Story";

export default function ReplayPage() {
  const replayEvents = getReplayEvents();
  const replayEventGroups = groupReplayEventsByDate(replayEvents);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.kicker}>replay</p>
        <h1>Build Replay Timeline</h1>
        <p className={styles.subtitle}>
          Follow each build arc from PRD kickoff to shipped stories in one
          chronological view.
        </p>
      </header>

      <section
        className={styles.timeline}
        aria-label="Replay timeline events"
        aria-live="polite"
      >
        <h2 className={styles.timelineTitle}>Timeline</h2>
        <p className={styles.timelineMeta}>
          {replayEvents.length} events loaded from PRDs and shipped stories.
        </p>
        {replayEventGroups.length > 0 ? (
          <ol className={styles.groupList}>
            {replayEventGroups.map((group) => (
              <li key={group.id} className={styles.groupItem}>
                <h3 className={styles.groupDate}>{group.label}</h3>
                <ul className={styles.cardList}>
                  {group.events.map((event) => (
                    <li key={event.id} className={styles.cardItem}>
                      <p className={styles.cardType}>{getEventTypeLabel(event.type)}</p>
                      <h4 className={styles.cardTitle}>{event.title}</h4>
                      <Link className={styles.cardLink} href={event.href}>
                        {getEventLinkLabel(event.type)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        ) : (
          <p className={styles.emptyState}>
            No replay events yet. Shipped stories and PRDs will appear here once
            they are recorded.
          </p>
        )}
      </section>
    </div>
  );
}
