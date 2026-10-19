"use client";

import { useSyncExternalStore } from "react";

export const ANALYTICS_KEY = "nh_analytics";
const CHANGE_EVENT = "nh-analytics-change";

export type AnalyticsChoice = "granted" | "denied" | null;

function subscribe(onStoreChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function readChoice(): AnalyticsChoice {
  try {
    const value = localStorage.getItem(ANALYTICS_KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    return "denied";
  }
}

export function useAnalyticsChoice(): AnalyticsChoice {
  return useSyncExternalStore(subscribe, readChoice, () => null);
}

export function setAnalyticsChoice(next: Exclude<AnalyticsChoice, null>) {
  localStorage.setItem(ANALYTICS_KEY, next);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}
