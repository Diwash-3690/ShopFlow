import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function safeJsonParse(str, fallback = null) {
  if (!str || str === "undefined" || str === "null") return fallback;
  try {
    return JSON.parse(str);
  } catch (e) {
    console.warn("safeJsonParse error:", e);
    return fallback;
  }
}

export function safeSetStorage(key, value) {
  try {
    if (value === undefined || value === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
    }
  } catch (e) {
    console.warn(`safeSetStorage failed for ${key}:`, e);
  }
}
