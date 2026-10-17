"use client";
import { useSyncExternalStore } from "react";
import { getPageCopy } from "@/lib/page-copy";
let seed: number | null = null;
const subscribe = () => () => {};
function getSeed() {
  if (seed === null) {
    try {
      const stored = Number(sessionStorage.getItem("recall.copy-seed") ?? -1);
      seed = Number.isFinite(stored) ? (stored + 1) % 6 : 0;
      sessionStorage.setItem("recall.copy-seed", String(seed));
    } catch {
      seed = Math.floor(Math.random() * 6);
    }
  }
  return seed;
}
export function usePageCopy() {
  return getPageCopy(useSyncExternalStore(subscribe, getSeed, () => 0));
}
