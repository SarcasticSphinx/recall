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
  const [selectedColor, setColor] = useState(deck?.color || "indigo");
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
        Make this collection yours. Add a cover, choose an icon, and give it a
        name.
      </p>
      <div className={`deck-profile ${selectedColor}`}>
        <ImageUpload
          purpose="deck"
          dropzone
          onBusyChange={setUploading}
          onUpload={setImageUrl}
          label={imageUrl ? "Change cover" : "Add a cover image"}
        >
          {imageUrl && (
            <Image
              src={imageUrl}
              alt="Deck cover"
              fill
              sizes="(max-width: 640px) 90vw, 520px"
              unoptimized
              className="deck-cover-image"
            />
          )}
        </ImageUpload>
        <div className="deck-profile-bottom">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="deck-avatar-button"
                aria-label="Change deck icon"
              >
                <Icon name={icon} size={22} />
                Change icon
                <span>
                  <Icon name="edit" size={14} />
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="icon-picker-menu">
              {deckIconNames.map((name) => (
                <DropdownMenuItem key={name} onSelect={() => setIcon(name)}>
                  <Icon name={name} />
                  <span>
                    {name === "cards"
                      ? "Flashcards"
                      : name.charAt(0).toUpperCase() + name.slice(1)}
                  </span>
                  {icon === name && <Icon name="check" size={14} />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {imageUrl && (
            <button
              type="button"
              className="text-button"
              onClick={() => setImageUrl(null)}
            >
              Remove cover
            </button>
          )}
        </div>
      </div>
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
        <legend>Accent color</legend>
        {colors.map((color) => (
          <label key={color} className={`color-choice ${color}`}>
            <input
              type="radio"
              name="color"
              value={color}
              checked={color === selectedColor}
              onChange={() => setColor(color)}
            />
            <span className="sr-only">{color}</span>
            <Icon name="check" size={17} />
          </label>
        ))}
      </fieldset>
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
