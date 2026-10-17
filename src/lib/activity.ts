import { localDay, type Workspace } from "./study.ts";
export function weeklyActivity(workspace: Workspace, now = new Date()) {
  const today = localDay(now, workspace.preferences.timezone);
  const calendar = new Date(`${today}T12:00:00Z`);
  const counts = new Map<string, number>();
  for (const review of workspace.reviews) {
    const day = localDay(review.reviewedAt, workspace.preferences.timezone);
    counts.set(day, (counts.get(day) || 0) + 1);
  }
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(calendar);
    date.setUTCDate(calendar.getUTCDate() - 6 + index);
    const day = date.toISOString().slice(0, 10);
    return {
      day,
      label: new Intl.DateTimeFormat("en", {
        weekday: "short",
        timeZone: "UTC",
      }).format(date),
      reviews: counts.get(day) || 0,
    };
  });
}
