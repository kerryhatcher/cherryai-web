import { slugify } from "./slugify";

const WIKILINK_PATTERN = /\[\[([^[\]]+)\]\]/g;

/**
 * Rewrites `[[Page Title]]` wikilinks into standard markdown links
 * (`[Page Title](/wiki/page-title)`) before handing the text to
 * react-markdown. Existing-vs-missing targets are not checked here — the
 * destination route resolves that when the link is followed.
 */
export function expandWikilinks(markdown: string): string {
  return markdown.replace(WIKILINK_PATTERN, (_match, title: string) => {
    const trimmed = title.trim();
    return `[${trimmed}](/wiki/${slugify(trimmed)})`;
  });
}
