"use client";
import { useState } from "react";
import { ArrowRight, Search, Shuffle } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { Badge } from "@/components/ui/badge";
import {
  reviewCandidates,
  type ReviewMode,
  type CardFilter,
} from "@/lib/review-selection";
import { studyQueue } from "@/lib/study";
import { useWorkspace } from "./workspace-context";
export function ReviewPicker({ deckId }: { deckId?: string }) {
  const { workspace, setReviewPicker, startCustomStudy } = useWorkspace();
  const [mode, setMode] = useState<ReviewMode>(
    studyQueue(workspace, deckId).length ? "scheduled" : "practice",
  );
  const [scope, setScope] = useState(deckId || "all");
  const [filter, setFilter] = useState<CardFilter>("all");
  const [query, setQuery] = useState("");
  const [selection, setSelection] = useState<Set<string> | null>(null);
  const [limit, setLimit] = useState("20");
  const [shuffle, setShuffle] = useState(false);
  const [visible, setVisible] = useState(100);
  const cards = reviewCandidates(workspace, {
    mode,
    deckId: scope === "all" ? undefined : scope,
    filter,
    query,
  });
  const selected = cards.filter(
    (card) => selection === null || selection.has(card.id),
  );
  const count = Math.min(
    selected.length,
    limit === "all" ? Infinity : Number(limit),
  );
  function resetSelection() {
    setSelection(null);
    setVisible(100);
  }
  function toggle(id: string, checked: boolean) {
    const next = new Set(selection ?? cards.map((c) => c.id));
    if (checked) next.add(id);
    else next.delete(id);
    setSelection(next);
  }
  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) setReviewPicker(null);
      }}
    >
      <SheetContent side="right" className="review-picker">
        <SheetHeader>
          <span className="eyebrow">YOUR NEXT SESSION</span>
          <SheetTitle>What would you like to study?</SheetTitle>
          <SheetDescription>A little focus, on your terms.</SheetDescription>
        </SheetHeader>
        <ScrollArea className="review-picker-body">
          <div className="review-picker-fields">
            <Tabs
              value={mode}
              onValueChange={(value) => {
                setMode(value as ReviewMode);
                setFilter("all");
                resetSelection();
              }}
            >
              <TabsList className="review-mode-tabs" aria-label="Review mode">
                <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                <TabsTrigger value="practice">Free practice</TabsTrigger>
              </TabsList>
              <TabsContent value="practice" className="review-mode-help">
                Study any cards, even ahead of schedule. Your review dates stay
                unchanged.
              </TabsContent>
              <TabsContent value="scheduled" className="review-mode-help">
                Due cards and today’s new cards. Your ratings update the
                spaced-repetition schedule.
              </TabsContent>
            </Tabs>
            <div className="review-filter-grid">
              <div>
                <Label id="review-deck-label">Collection</Label>
                <Select
                  value={scope}
                  onValueChange={(value) => {
                    setScope(value);
                    resetSelection();
                  }}
                >
                  <SelectTrigger aria-labelledby="review-deck-label">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All decks</SelectItem>
                    {workspace.decks.map((deck) => (
                      <SelectItem key={deck.id} value={deck.id}>
                        {deck.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label id="review-filter-label">Cards</Label>
                <Select
                  value={filter}
                  onValueChange={(value) => {
                    setFilter(value as CardFilter);
                    resetSelection();
                  }}
                >
                  <SelectTrigger aria-labelledby="review-filter-label">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All matching</SelectItem>
                    <SelectItem value="due">Due now</SelectItem>
                    <SelectItem value="new">New cards</SelectItem>
                    <SelectItem value="learning">Learning</SelectItem>
                    <SelectItem value="difficult">
                      Previously forgotten
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="review-search">
              <Search size={16} />
              <Input
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  resetSelection();
                }}
                placeholder="Find a question or answer…"
                aria-label="Find cards to review"
              />
            </div>
            <div className="review-selection-heading">
              <Label>
                <Checkbox
                  aria-label="Select all matching cards"
                  checked={
                    cards.length > 0 && selected.length === cards.length
                      ? true
                      : selected.length > 0
                        ? "indeterminate"
                        : false
                  }
                  disabled={!cards.length}
                  onCheckedChange={(checked) =>
                    setSelection(checked === true ? null : new Set())
                  }
                />
                Select all
              </Label>
              <span>
                {selected.length} of {cards.length} selected
              </span>
            </div>
            <Separator className="review-picker-separator" />
            <div className="review-card-choices">
              {cards.slice(0, visible).map((card) => (
                <Label key={card.id} className="review-card-choice">
                  <Checkbox
                    checked={selection === null || selection.has(card.id)}
                    onCheckedChange={(checked) =>
                      toggle(card.id, checked === true)
                    }
                  />
                  <span>
                    <strong>{card.question}</strong>
                    <small>
                      {workspace.decks.find((d) => d.id === card.deckId)?.name}
                    </small>
                  </span>
                  <Badge variant="secondary">
                    {card.schedule.reps === 0
                      ? "New"
                      : new Date(card.schedule.due) <= new Date()
                        ? "Due"
                        : "Later"}
                  </Badge>
                </Label>
              ))}
              {!cards.length && (
                <Empty className="review-picker-empty">
                  <EmptyHeader>
                    <EmptyTitle>
                      {mode === "scheduled"
                        ? "Nothing scheduled here."
                        : "No matching cards."}
                    </EmptyTitle>
                    <EmptyDescription>
                      {mode === "scheduled"
                        ? "Switch to Free practice to study anytime, or adjust your filters."
                        : "Try another deck or search."}
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
              {cards.length > visible && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-button"
                  onClick={() => setVisible((v) => v + 100)}
                >
                  Show more cards
                </Button>
              )}
            </div>
          </div>
        </ScrollArea>
        <SheetFooter className="review-picker-footer">
          <div className="review-session-options">
            <Label className="shuffle-choice">
              <Checkbox
                checked={shuffle}
                onCheckedChange={(checked) => setShuffle(checked === true)}
              />
              <Shuffle size={14} />
              Shuffle
            </Label>
            <Select value={limit} onValueChange={setLimit}>
              <SelectTrigger aria-label="Session size">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">Up to 10 cards</SelectItem>
                <SelectItem value="20">Up to 20 cards</SelectItem>
                <SelectItem value="50">Up to 50 cards</SelectItem>
                <SelectItem value="all">All selected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            size="lg"
            className="button primary"
            disabled={!count}
            onClick={() =>
              startCustomStudy({
                mode,
                ids: selected.map((c) => c.id),
                shuffle,
                limit: limit === "all" ? undefined : Number(limit),
                title:
                  scope === "all"
                    ? mode === "practice"
                      ? "Free practice"
                      : "Today's review"
                    : workspace.decks.find((d) => d.id === scope)?.name ||
                      "Your session",
              })
            }
          >
            {mode === "practice" ? "Start practice" : "Start review"} · {count}{" "}
            {count === 1 ? "card" : "cards"}
            <ArrowRight size={16} />
          </Button>
          <p>
            {mode === "practice"
              ? "Practice is recorded. Scheduling stays as it is."
              : "New-card limits apply across all decks."}
          </p>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
