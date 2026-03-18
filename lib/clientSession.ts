"use client";

import {
  APP_VERSION,
  LAST_ACTIVITY_KEY,
  RELEASE_TRIGGER_KEY,
  SESSION_VERSION_KEY,
} from "./appConfig";

export function markSessionActiveForCurrentVersion() {
  const now = Date.now().toString();
  localStorage.setItem(SESSION_VERSION_KEY, APP_VERSION);
  localStorage.setItem(LAST_ACTIVITY_KEY, now);
}

export function triggerReleaseNotesForCurrentVersion() {
  sessionStorage.setItem(RELEASE_TRIGGER_KEY, APP_VERSION);
}

export function clearClientSessionMetadata() {
  localStorage.removeItem(LAST_ACTIVITY_KEY);
  localStorage.removeItem(SESSION_VERSION_KEY);
  sessionStorage.removeItem(RELEASE_TRIGGER_KEY);
}
