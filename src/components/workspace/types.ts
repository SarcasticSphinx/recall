import type { Deck, StudyCard, Workspace } from "@/lib/study";
export type WorkspaceProps = {
  uploadsEnabled: boolean;
  aiEnabled: boolean;
  user: { name: string; email: string } | null;
  initialWorkspace: Workspace | null;
  authEnabled: boolean;
  loadError: boolean;
  authError?: boolean;
};
export type ModalState =
  | { type: "deck"; deck?: Deck }
  | { type: "card"; deckId: string; card?: StudyCard }
  | { type: "delete"; kind: "deck" | "card"; id: string; name: string }
  | { type: "ai"; deckId: string }
  | { type: "signin" }
  | null;
export type StudySession = {
  cards: StudyCard[];
  index: number;
  title: string;
  revealed: boolean;
  operationId: string;
};
