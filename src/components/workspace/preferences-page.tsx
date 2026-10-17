"use client";
import { usePageCopy } from "@/hooks/use-page-copy";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useWorkspace } from "./workspace-context";
import { Icon } from "@/components/icon";
import { ThemeControl } from "@/components/theme-control";
import { authClient } from "@/lib/auth-client";
export function PreferencesPage() {
  const { workspace, user, busy, isPreview, mutate, setModal, setNotice } =
    useWorkspace();
  const copy = usePageCopy();
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">MAKE IT YOUR OWN</div>
          <h1>{copy.settings[0]}</h1>
          <p>{copy.settings[1]}</p>
        </div>
      </div>
      <section className="appearance-panel">
        <div>
          <h3>Set the mood.</h3>
          <p>A lighter day, a quieter night, or follow your device.</p>
        </div>
        <ThemeControl />
        <p className="appearance-hint">
          Saved on this device. System follows your device’s appearance.
        </p>
      </section>
      <form
        className="settings-panel"
        key={`${workspace.preferences.timezone}-${workspace.preferences.newCardLimit}`}
        onSubmit={async (e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          if (
            await mutate({
              type: "preferences",
              timezone: String(form.get("timezone")),
              newCardLimit: Number(form.get("limit")),
              editorMode: form.get("editorMode") as "simple" | "rich",
            })
          )
            setNotice("Your practice preferences are saved.");
        }}
      >
        <div className="settings-row">
          <div>
            <h3>New cards per day</h3>
            <p>
              A gentle limit on new material. Due reviews are always available.
            </p>
          </div>
          <input
            className="number-input"
            name="limit"
            type="number"
            min="0"
            max="200"
            required
            defaultValue={workspace.preferences.newCardLimit}
            aria-label="Daily new-card limit"
          />
        </div>
        <div className="settings-row">
          <div>
            <h3>Your timezone</h3>
            <p>
              Your learning day follows this timezone, including when you
              travel.
            </p>
          </div>
          <Select name="timezone" defaultValue={workspace.preferences.timezone}>
            <SelectTrigger aria-label="Timezone">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              {Array.from(
                new Set([
                  workspace.preferences.timezone,
                  "UTC",
                  ...Intl.supportedValuesOf("timeZone"),
                ]),
              ).map((zone) => (
                <SelectItem key={zone} value={zone}>
                  {zone}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="settings-row">
          <div>
            <h3>Card editor</h3>
            <p>
              Focus is a clean writing space. Canvas adds text formatting. Both
              editors support question and answer images. Your saved formatting
              is always shown during review.
            </p>
          </div>
          <Select
            name="editorMode"
            defaultValue={workspace.preferences.editorMode || "simple"}
          >
            <SelectTrigger aria-label="Card editor mode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="simple">Focus</SelectItem>
              <SelectItem value="rich">Canvas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="settings-footer">
          <button className="button primary" disabled={busy}>
            {busy ? "Saving…" : "Save preferences"}
          </button>
        </div>
      </form>
      <section className="account-panel">
        <div>
          <h3>{isPreview ? "Take your learning with you." : user?.name}</h3>
          <p>
            {isPreview
              ? "Sign in to keep your cards and progress together across devices. Preview cards stay separate from your account."
              : user?.email}
          </p>
        </div>
        {isPreview ? (
          <button
            className="button"
            onClick={() => setModal({ type: "signin" })}
          >
            Sign in to sync
            <Icon name="arrow" size={17} />
          </button>
        ) : (
          <button
            className="button"
            onClick={async () => {
              await authClient.signOut();
              location.reload();
            }}
          >
            Sign out
            <Icon name="logout" size={17} />
          </button>
        )}
      </section>
      <section className="ai-note">
        <Icon name="spark" size={24} />
        <div>
          <h3>A little help, when you need it.</h3>
          <p>
            Open any deck and choose Draft with AI to turn your notes into
            editable flashcards. You review every question before saving.
          </p>
          <span className="pill">NOTES → CARDS</span>
        </div>
      </section>
    </>
  );
}
