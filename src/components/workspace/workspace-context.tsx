"use client";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useWorkspaceController } from "@/hooks/use-workspace-controller";
import { studyQueue, todayReviews, type Workspace } from "@/lib/study";
import type { WorkspaceProps, StudySession } from "./types";
function derive(
  workspace: Workspace | null,
  clock: Date,
  selectedDeck: string | null,
  session: StudySession | null,
) {
  if (!workspace) return null;
  const queue = studyQueue(workspace, undefined, clock);
  const todaysReviews = todayReviews(workspace, clock);
  const dueCount = queue.filter((c) => c.schedule.reps > 0).length;
  const deck = workspace.decks.find((d) => d.id === selectedDeck);
  return {
    workspace,
    queue,
    todaysReviews,
    dueCount,
    newCount: queue.length - dueCount,
    deck,
    deckCards: workspace.cards.filter((c) => c.deckId === deck?.id),
    currentCard: session?.cards[session.index],
    sessionDone: session && session.index >= session.cards.length,
    date: new Intl.DateTimeFormat("en", {
      timeZone: workspace.preferences.timezone,
      weekday: "long",
      month: "long",
      day: "numeric",
    }).format(clock),
  };
}
type State = ReturnType<typeof useWorkspaceController> & {
  derived: ReturnType<typeof derive>;
};
const Context = createContext<State | null>(null);
export function WorkspaceProvider({
  children,
  ...props
}: WorkspaceProps & { children: ReactNode }) {
  const controller = useWorkspaceController(props);
  const { workspace, clock, selectedDeck, session } = controller;
  const derived = useMemo(
    () => derive(workspace, clock, selectedDeck, session),
    [workspace, clock, selectedDeck, session],
  );
  return (
    <Context.Provider value={{ ...controller, derived }}>
      {children}
    </Context.Provider>
  );
}
export function useControllerContext() {
  const value = useContext(Context);
  if (!value) throw new Error("Workspace provider is missing.");
  return value;
}
export function useWorkspace() {
  const value = useControllerContext();
  if (!value.derived) throw new Error("Workspace has not loaded.");
  return { ...value, ...value.derived };
}
