"use client";

import { useEffect, useSyncExternalStore, type CSSProperties } from "react";
import { Icon } from "./icon";

type Preference = "light" | "dark" | "system";
const key = "recall.theme";
let memoryPreference: Preference | null = null;
let fadeTimer: number | undefined;
const options: { value: Preference; label: string; icon: string }[] = [
  { value: "light", label: "Light", icon: "sun" },
  { value: "dark", label: "Dark", icon: "moon" },
  { value: "system", label: "System", icon: "monitor" },
];
function readPreference(): Preference {
  if (memoryPreference) return memoryPreference;
  try {
    const stored = localStorage.getItem(key);
    if (stored === "light" || stored === "dark" || stored === "system")
      return stored;
  } catch {
    /* Use the in-memory choice when storage is unavailable. */
  }
  return "system";
}
function resolveTheme(preference: Preference) {
  return preference === "system"
    ? matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light"
    : preference;
}
function snapshot() {
  const preference = readPreference();
  return `${preference}:${resolveTheme(preference)}`;
}
function applyTheme(preference: Preference) {
  const resolved = resolveTheme(preference);
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
}
function subscribe(callback: () => void) {
  const update = () => {
    applyTheme(readPreference());
    callback();
  };
  const storageUpdate = () => {
    memoryPreference = null;
    update();
  };
  const media = matchMedia("(prefers-color-scheme: dark)");
  window.addEventListener("storage", storageUpdate);
  window.addEventListener("recall-theme-change", update);
  media.addEventListener("change", update);
  return () => {
    window.removeEventListener("storage", storageUpdate);
    window.removeEventListener("recall-theme-change", update);
    media.removeEventListener("change", update);
  };
}
function commitTheme(preference: Preference) {
  try {
    localStorage.setItem(key, preference);
    memoryPreference = null;
  } catch {
    memoryPreference = preference;
  }
  applyTheme(preference);
  window.dispatchEvent(new Event("recall-theme-change"));
}
function selectTheme(preference: Preference) {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sameAppearance =
    resolveTheme(preference) === document.documentElement.dataset.theme;
  window.clearTimeout(fadeTimer);
  const root = document.documentElement;
  root.classList.toggle("theme-color-transition", !reduced && !sameAppearance);
  // Change only colors on existing surfaces: no page snapshots, masks, or forced layout.
  commitTheme(preference);
  if (!reduced && !sameAppearance) {
    fadeTimer = window.setTimeout(
      () => root.classList.remove("theme-color-transition"),
      220,
    );
  }
}

export function ThemeControl({ compact = false }: { compact?: boolean }) {
  const state = useSyncExternalStore(subscribe, snapshot, () => "system:light");
  const [preference, resolved] = state.split(":") as [
    Preference,
    "light" | "dark",
  ];
  useEffect(() => {
    applyTheme(readPreference());
  }, []);
  if (compact)
    return (
      <button
        type="button"
        className={`theme-toggle ${resolved === "dark" ? "is-dark" : ""}`}
        aria-label={`Switch to ${resolved === "dark" ? "light" : "dark"} theme`}
        title={`${resolved === "dark" ? "Light" : "Dark"} appearance`}
        onClick={() => selectTheme(resolved === "dark" ? "light" : "dark")}
      >
        <span className="theme-toggle-orbit">
          <span className="theme-toggle-sun">
            <Icon name="sun" size={18} />
          </span>
          <span className="theme-toggle-moon">
            <Icon name="moon" size={18} />
          </span>
        </span>
      </button>
    );
  return (
    <div
      className="theme-control"
      style={
        {
          "--theme-index": options.findIndex((o) => o.value === preference),
        } as CSSProperties
      }
      role="group"
      aria-label="Color theme"
    >
      <span className="theme-selection" aria-hidden="true" />
      {options.map(({ value, label, icon }) => (
        <button
          key={value}
          type="button"
          aria-label={`${label} theme`}
          aria-pressed={preference === value}
          onClick={() => selectTheme(value)}
        >
          <Icon name={icon} size={17} />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
