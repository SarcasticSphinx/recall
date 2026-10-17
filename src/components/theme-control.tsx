"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Icon } from "./icon";

type Preference = "light" | "dark" | "system";
const key = "recall.theme";
let memoryPreference: Preference = "system";
const options: { value: Preference; label: string; icon: string }[] = [
  { value: "light", label: "Light", icon: "sun" },
  { value: "dark", label: "Dark", icon: "moon" },
  { value: "system", label: "System", icon: "monitor" },
];
function readPreference(): Preference {
  try {
    const stored = localStorage.getItem(key);
    if (stored === "light" || stored === "dark" || stored === "system")
      return stored;
  } catch {
    /* Keep the selection usable if storage is unavailable. */
  }
  return memoryPreference;
}
function applyTheme(preference: Preference) {
  const resolved =
    preference === "system"
      ? matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : preference;
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
}
function subscribe(callback: () => void) {
  const update = () => {
    applyTheme(readPreference());
    callback();
  };
  const media = matchMedia("(prefers-color-scheme: dark)");
  window.addEventListener("storage", update);
  window.addEventListener("recall-theme-change", update);
  media.addEventListener("change", update);
  return () => {
    window.removeEventListener("storage", update);
    window.removeEventListener("recall-theme-change", update);
    media.removeEventListener("change", update);
  };
}
export function ThemeControl({ compact = false }: { compact?: boolean }) {
  const preference = useSyncExternalStore(
    subscribe,
    readPreference,
    () => "system" as Preference,
  );
  useEffect(() => {
    applyTheme(readPreference());
  }, []);
  return (
    <div
      className={`theme-control ${compact ? "theme-compact" : ""}`}
      role="group"
      aria-label="Color theme"
    >
      {options.map(({ value, label, icon }) => (
        <button
          key={value}
          type="button"
          aria-label={`${label} theme`}
          aria-pressed={preference === value}
          title={`${label} theme`}
          onClick={() => {
            memoryPreference = value;
            try {
              localStorage.setItem(key, value);
            } catch {
              /* The theme still works for this session. */
            }
            applyTheme(value);
            window.dispatchEvent(new Event("recall-theme-change"));
          }}
        >
          <Icon name={icon} size={16} />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
