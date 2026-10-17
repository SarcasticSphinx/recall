"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { applyPreview, createPreview } from "@/lib/preview";
import { studyQueue, type Workspace } from "@/lib/study";
import {
  actionSchema,
  workspaceSchema,
  type WorkspaceAction,
} from "@/lib/validation";
import type {
  WorkspaceProps,
  ModalState,
  StudySession,
} from "@/components/workspace/types";
const storageKey = "recall.preview.v1";
export function useWorkspaceController({
  user,
  initialWorkspace,
  authEnabled,
  loadError,
  uploadsEnabled,
  aiEnabled,
  authError = false,
}: WorkspaceProps) {
  const [workspace, setWorkspace] = useState<Workspace | null>(
    initialWorkspace,
  );
  const [view, setView] = useState<"today" | "decks" | "settings">("today");
  const [selectedDeck, setSelectedDeck] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>(
    authError && !user ? { type: "signin" } : null,
  );
  const [session, setSession] = useState<StudySession | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(
    authError && !user
      ? "Sign-in couldn't finish. Start a fresh Google sign-in below."
      : "",
  );
  const [refreshing, setRefreshing] = useState(false);
  const refreshingRef = useRef(false);
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [clock, setClock] = useState(() => new Date());
  const workspaceRef = useRef(workspace);
  const busyRef = useRef(false);
  const isPreview = !user;

  const refresh = useCallback(async () => {
    if (!user || busyRef.current || refreshingRef.current) return;
    refreshingRef.current = true;
    setRefreshing(true);
    try {
      const response = await fetch("/api/workspace", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.message || "Could not refresh your workspace.");
      workspaceRef.current = body;
      setWorkspace(body);
      setError("");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not refresh your workspace.",
      );
    } finally {
      refreshingRef.current = false;
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) return;
    try {
      const stored = localStorage.getItem(storageKey);
      const parsed = stored
        ? workspaceSchema.safeParse(JSON.parse(stored))
        : null;
      if (stored && !parsed?.success)
        throw new Error(
          "Saved preview data could not be read. Export or clear this site's storage to reset it.",
        );
      const next = parsed?.success
        ? (parsed.data as Workspace)
        : createPreview();
      workspaceRef.current = next;
      // Hydrate browser-only storage after the shared server/client loading state.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setWorkspace(next);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Browser storage is unavailable.",
      );
    }
  }, [user]);

  useEffect(() => {
    const tick = () => {
      setClock(new Date());
      void refresh();
    };
    window.addEventListener("focus", tick);
    const interval = window.setInterval(() => setClock(new Date()), 30000);
    return () => {
      window.removeEventListener("focus", tick);
      window.clearInterval(interval);
    };
  }, [refresh]);

  async function mutate(input: WorkspaceAction) {
    if (busyRef.current || !workspaceRef.current) return false;
    busyRef.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const action = actionSchema.parse(input);
      let next: Workspace;
      if (isPreview) {
        next = applyPreview(workspaceRef.current, action);
        localStorage.setItem(storageKey, JSON.stringify(next));
      } else {
        const response = await fetch("/api/workspace", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(action),
        });
        const body = await response.json();
        if (!response.ok)
          throw new Error(body.message || "Could not save. Please try again.");
        next = body;
      }
      workspaceRef.current = next;
      setWorkspace(next);
      return true;
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Could not save. Please try again.";
      setError(
        message.startsWith("[")
          ? "Please check the fields and try again."
          : message,
      );
      return false;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  function navigate(next: typeof view) {
    setView(next);
    setSelectedDeck(null);
    setSearch("");
    setError("");
    if (window.matchMedia("(max-width: 640px)").matches)
      window.scrollTo({ top: 0, behavior: "instant" });
    void refresh();
  }
  function startStudy(deckId?: string) {
    if (!workspace) return;
    const cards = studyQueue(workspace, deckId);
    if (!cards.length) {
      setNotice(
        "Nothing ready right now. Come back when your next cards are due.",
      );
      return;
    }
    setError("");
    setNotice("");
    setSession({
      cards,
      index: 0,
      title:
        workspace.decks.find((d) => d.id === deckId)?.name ||
        "Today's practice",
      revealed: false,
      operationId: crypto.randomUUID(),
    });
  }
  async function rate(rating: number) {
    if (!session || !session.revealed || busyRef.current) return;
    const card = session.cards[session.index];
    if (!card) return;
    const saved = await mutate({
      type: "review",
      id: card.id,
      version: card.version,
      rating,
      operationId: session.operationId,
    });
    if (saved)
      setSession((current) =>
        current
          ? {
              ...current,
              index: current.index + 1,
              revealed: false,
              operationId: crypto.randomUUID(),
            }
          : null,
      );
  }
  const rateRef = useRef(rate);
  useEffect(() => {
    rateRef.current = rate;
  });
  useEffect(() => {
    function keydown(event: KeyboardEvent) {
      if (
        !session ||
        modal ||
        event.repeat ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      )
        return;
      if (
        (event.target as HTMLElement).closest(
          "input, textarea, select, button, [contenteditable=true]",
        )
      )
        return;
      if (event.code === "Space") {
        event.preventDefault();
        setSession((s) => (s ? { ...s, revealed: true } : null));
      }
      if (session.revealed && /^[1-4]$/.test(event.key)) {
        event.preventDefault();
        void rateRef.current(Number(event.key));
      }
    }
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [session, modal]);

  async function signIn() {
    setBusy(true);
    setError("");
    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/",
        errorCallbackURL: "/?authError=signin",
      });
      if (result.error)
        throw new Error(
          result.error.message || "Sign-in failed. Please try again.",
        );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  return {
    workspace,
    user,
    view,
    setView,
    selectedDeck,
    setSelectedDeck,
    modal,
    setModal,
    session,
    setSession,
    busy,
    error,
    setError,
    notice,
    setNotice,
    search,
    setSearch,
    clock,
    isPreview,
    refresh,
    refreshing,
    mutate,
    navigate,
    startStudy,
    rate,
    signIn,
    authEnabled,
    loadError,
    uploadsEnabled,
    aiEnabled,
  };
}
