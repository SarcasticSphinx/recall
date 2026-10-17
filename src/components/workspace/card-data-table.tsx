"use client";
import { useState } from "react";
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/icon";
import { useWorkspace } from "./workspace-context";
import type { StudyCard } from "@/lib/study";
export function CardDataTable({ cards }: { cards: StudyCard[] }) {
  const { setModal, deck, workspace } = useWorkspace();
  const [sort, setSort] = useState<"question" | "due">("question");
  const [ascending, setAscending] = useState(true);
  const [page, setPage] = useState(0);
  const lastPage = Math.max(0, Math.ceil(cards.length / 10) - 1);
  const current = Math.min(page, lastPage);
  const sorted = [...cards].sort(
    (a, b) =>
      (sort === "question"
        ? a.question.localeCompare(b.question)
        : a.schedule.due.localeCompare(b.schedule.due)) * (ascending ? 1 : -1),
  );
  function order(key: typeof sort) {
    setAscending(sort === key ? !ascending : true);
    setSort(key);
  }
  return (
    <div className="card-data-table">
      <Table>
        <TableCaption>
          {cards.length} {cards.length === 1 ? "card" : "cards"} in this view
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead
              aria-sort={
                sort === "question"
                  ? ascending
                    ? "ascending"
                    : "descending"
                  : "none"
              }
            >
              <button className="table-sort" onClick={() => order("question")}>
                Question
                <ArrowUpDown size={14} />
              </button>
            </TableHead>
            <TableHead>Answer</TableHead>
            <TableHead
              aria-sort={
                sort === "due"
                  ? ascending
                    ? "ascending"
                    : "descending"
                  : "none"
              }
            >
              <button className="table-sort" onClick={() => order("due")}>
                Next review
                <ArrowUpDown size={14} />
              </button>
            </TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.slice(current * 10, current * 10 + 10).map((card) => (
            <TableRow key={card.id}>
              <TableCell>
                <span className="table-question">{card.question}</span>
              </TableCell>
              <TableCell>
                <span className="table-answer">
                  {card.answer || "Image attachment"}
                </span>
              </TableCell>
              <TableCell>
                {card.schedule.reps ? (
                  new Intl.DateTimeFormat("en", {
                    timeZone: workspace.preferences.timezone,
                    month: "short",
                    day: "numeric",
                  }).format(new Date(card.schedule.due))
                ) : (
                  <Badge variant="secondary">New</Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="table-actions">
                  <button
                    className="icon-button"
                    aria-label={`Edit card: ${card.question}`}
                    onClick={() =>
                      setModal({ type: "card", deckId: deck!.id, card })
                    }
                  >
                    <Icon name="edit" size={16} />
                  </button>
                  <button
                    className="icon-button"
                    aria-label={`Delete card: ${card.question}`}
                    onClick={() =>
                      setModal({
                        type: "delete",
                        kind: "card",
                        id: card.id,
                        name: card.question,
                      })
                    }
                  >
                    <Icon name="trash" size={16} />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="table-pagination">
        <span>
          Page {current + 1} of {lastPage + 1}
        </span>
        <button
          className="icon-button"
          aria-label="Previous page"
          disabled={current === 0}
          onClick={() => setPage(current - 1)}
        >
          <ChevronLeft size={17} />
        </button>
        <button
          className="icon-button"
          aria-label="Next page"
          disabled={current === lastPage}
          onClick={() => setPage(current + 1)}
        >
          <ChevronRight size={17} />
        </button>
      </div>
    </div>
  );
}
