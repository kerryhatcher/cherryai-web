/**
 * Derives a wiki slug from a title: lowercase, alphanumerics and hyphens
 * only, repeated separators collapsed, leading/trailing hyphens trimmed.
 * Must match the slug derivation in cherryai-api's `wiki.py` — this is what
 * lets wikilinks (`[[Page Title]]`) resolve to the right entry without a
 * round trip to the server.
 */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Best-effort reverse of `slugify`, used only to prefill the title field when
 * jumping from a missing wikilink into the "create it" flow — the user can
 * always edit it before saving.
 */
export function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}
