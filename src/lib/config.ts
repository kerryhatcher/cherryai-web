// Empty string means same-origin: the app calls /api/... on its own host and
// the dev/preview server (or production reverse proxy) routes it to the API.
export const API_URL: string = import.meta.env.VITE_API_URL ?? "";
