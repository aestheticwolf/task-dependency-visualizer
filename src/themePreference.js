import { useCallback, useEffect, useSyncExternalStore } from "react";

const THEME_KEY = "tg-dark";

function readThemePreference() {
  try {
    return localStorage.getItem(THEME_KEY) !== "false";
  } catch {
    return true;
  }
}

let themeValue = readThemePreference();
const listeners = new Set();
let storageListenerAttached = false;

function notifyThemeListeners() {
  listeners.forEach(listener => listener());
}

function attachStorageListener() {
  if (storageListenerAttached || typeof window === "undefined") return;

  window.addEventListener("storage", event => {
    if (event.key && event.key !== THEME_KEY) return;
    themeValue = readThemePreference();
    notifyThemeListeners();
  });

  storageListenerAttached = true;
}

function setThemeValue(nextDark) {
  themeValue = nextDark;
  try {
    localStorage.setItem(THEME_KEY, String(nextDark));
  } catch {}
  notifyThemeListeners();
}

function subscribe(listener) {
  attachStorageListener();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return themeValue;
}

export function useThemePreference() {
  const dark = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    if (typeof document === "undefined") return;

    document.documentElement.dataset.tgTheme = dark ? "dark" : "light";
    document.body?.setAttribute("data-tg-theme", dark ? "dark" : "light");
  }, [dark]);

  const setDark = useCallback(updater => {
    const resolved =
      typeof updater === "function"
        ? Boolean(updater(themeValue))
        : Boolean(updater);
    setThemeValue(resolved);
  }, []);

  return { dark, setDark };
}
