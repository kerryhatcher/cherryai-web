import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { useNavigate } from "react-router";
import { expandFeedbackLinks } from "@/lib/feedbacklinks";
import { expandWikilinks } from "@/lib/wikilinks";

interface MarkdownProps {
  content: string;
  className?: string;
  /** Expand `[[Page Title]]` wikilinks before rendering — wiki bodies only. */
  wikilinks?: boolean;
  /** Expand wikilinks AND bare `#42` issue references — feedback content only. */
  feedbackLinks?: boolean;
}

/**
 * Intercepts same-origin relative links (chat replies linking to `/wiki/...`,
 * or wiki bodies linking to other pages) so they navigate client-side
 * instead of doing a full page reload. External/absolute links open in a
 * new tab as normal anchors.
 */
const LinkRenderer: Components["a"] = ({ node: _node, href, children, ...props }) => {
  const navigate = useNavigate();

  if (href?.startsWith("/")) {
    return (
      <a
        href={href}
        {...props}
        onClick={(event) => {
          event.preventDefault();
          navigate(href);
        }}
      >
        {children}
      </a>
    );
  }

  return (
    <a href={href} target="_blank" rel="noreferrer" {...props}>
      {children}
    </a>
  );
};

const components: Components = { a: LinkRenderer };

/**
 * react-markdown (v10, no rehype-raw) doesn't drop raw HTML — it renders it as escaped text, so
 * `<!-- cherryai:triage -->` marker comments would otherwise show up verbatim. Comments carry no
 * visible content in any Markdown renderer, so strip them unconditionally before parsing.
 */
function stripHtmlComments(text: string): string {
  return text.replace(/<!--[\s\S]*?-->/g, "");
}

export function Markdown({ content, className, wikilinks, feedbackLinks }: MarkdownProps) {
  const expanded = feedbackLinks ? expandFeedbackLinks(content) : wikilinks ? expandWikilinks(content) : content;
  const text = stripHtmlComments(expanded);
  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {text}
      </ReactMarkdown>
    </div>
  );
}
