"use client";
import { useState } from "react";
import Image from "next/image";
import { Icon } from "@/components/icon";
import { ImageUpload } from "@/components/editor/image-upload";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { deckIconNames, type DeckIconName } from "@/lib/deck-icons";
import { colors } from "@/lib/validation";
import type { Deck } from "@/lib/study";
import { useWorkspace } from "./workspace-context";
export function DeckEditor({ deck }: { deck?: Deck }) {
  const { busy, mutate, setModal, setError, setNotice } = useWorkspace();
  const [icon, setIcon] = useState<DeckIconName>(
    (deck?.icon || "cards") as DeckIconName,
  );
  const [imageUrl, setImageUrl] = useState<string | null>(
    deck?.imageUrl || null,
  );
  const [uploading, setUploading] = useState(false);
  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const values = {
          name: String(data.get("name")),
          color: data.get("color") as (typeof colors)[number],
          icon,
          imageUrl,
        };
        if (
          await mutate(
            deck
              ? { type: "updateDeck", id: deck.id, ...values }
              : { type: "createDeck", ...values },
          )
        ) {
          setModal(null);
          setNotice("Your deck is saved.");
        }
      }}
    >
      <p className="modal-description">
        Give what you&apos;re learning a little home.
      </p>
      <label className="field">
        Deck name
        <input
          name="name"
          placeholder="e.g. Things I want to remember"
          maxLength={80}
          required
          defaultValue={deck?.name}
        />
      </label>
      <fieldset className="color-picker">
        <legend>Pick a little color</legend>
        {colors.map((color) => (
          <label key={color} className={`color-choice ${color}`}>
            <input
              type="radio"
              name="color"
              value={color}
              defaultChecked={color === (deck?.color || "indigo")}
            />
            <span className="sr-only">{color}</span>
            <Icon name="check" size={17} />
          </label>
        ))}
      </fieldset>
      <div className="deck-identity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="button"
              aria-label="Choose deck icon"
            >
              <Icon name={icon} />
              Choose icon
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="icon-picker-menu">
            {deckIconNames.map((name) => (
              <DropdownMenuItem key={name} onSelect={() => setIcon(name)}>
                <Icon name={name} />
                <span>{name}</span>
                {icon === name && <Icon name="check" size={14} />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <ImageUpload
          purpose="deck"
          onBusyChange={setUploading}
          onUpload={setImageUrl}
        />
      </div>
      {imageUrl && (
        <div className="deck-image-preview">
          <Image
            src={imageUrl}
            alt="Deck cover preview"
            width={400}
            height={160}
            unoptimized
          />
          <button
            type="button"
            className="text-button"
            onClick={() => setImageUrl(null)}
          >
            Remove image
          </button>
        </div>
      )}
      <p className="form-hint">
        An image takes the place of your deck icon. Remove it to show the icon
        again.
      </p>
      <div className="modal-actions">
        <button
          type="button"
          className="button"
          disabled={busy || uploading}
          onClick={() => {
            setModal(null);
            setError("");
          }}
        >
          Cancel
        </button>
        <button className="button primary" disabled={busy || uploading}>
          {busy
            ? "Saving…"
            : uploading
              ? "Uploading…"
              : deck
                ? "Save deck"
                : "Create deck"}
          <Icon name="arrow" size={17} />
        </button>
      </div>
    </form>
  );
}
