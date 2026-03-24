const THEME_KEY = "cls_theme";
const API_BASE_KEY = "cls_api_base";

export function getStoredTheme() {
  return window.localStorage.getItem(THEME_KEY) || "light";
}

export function setStoredTheme(theme) {
  window.localStorage.setItem(THEME_KEY, theme);
}

export function getStoredApiBase() {
  return window.localStorage.getItem(API_BASE_KEY) || "";
}

export function setStoredApiBase(value) {
  window.localStorage.setItem(API_BASE_KEY, value);
}

