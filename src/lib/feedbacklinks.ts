import { expandWikilinks } from "./wikilinks";

/**
 * Matches a bare `#42` reference. The negative lookbehind excludes `#`
 * preceded by a word character or `/` so URL fragments (`page#42`,
 * `http://x.com/#42`) are left alone; ATX headings (`# 1 Title`) never match
 * because CommonMark requires a space after `#`, which this pattern doesn't.
 */
const ISSUE_REF_PATTERN = /(?<![\w/])#(\d+)\b/g;

/** Splits on fenced (```) and inline (`code`) spans so refs inside them are left as-is. */
const CODE_SEGMENT_PATTERN = /(```[\s\S]*?```|`[^`\n]*`)/g;

function linkifyIssueRefs(markdown: string): string {
  return markdown
    .split(CODE_SEGMENT_PATTERN)
    .map((segment, index) =>
      index % 2 === 1
        ? segment
        : segment.replace(ISSUE_REF_PATTERN, (_match, id: string) => `[#${id}](/feedback/${id})`),
    )
    .join("");
}

/**
 * Rewrites `[[Page Title]]` wikilinks and bare `#42` issue references before
 * handing the text to react-markdown. Feedback content only — chat and wiki
 * rendering must never pick up the `#N` transform.
 */
export function expandFeedbackLinks(markdown: string): string {
  return linkifyIssueRefs(expandWikilinks(markdown));
}
