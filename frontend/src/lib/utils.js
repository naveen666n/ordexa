import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Resolve an image URL from the DB to a displayable src.
// - Relative paths (/uploads/...) are prefixed with the backend origin.
// - Full URLs (https://...) are returned as-is.
const _BACKEND_ORIGIN = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api/v1', '')
  : 'http://localhost:5000';

export const getImageSrc = (url) => {
  if (!url) return null;
  if (url.startsWith('/')) return `${_BACKEND_ORIGIN}${url}`;
  return url;
};
