import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CherryMark } from "@/components/CherryMark";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types";

interface MessageBubbleProps {
  message: Pick<ChatMessage, "role" | "content">;
  /** Renders a blinking caret after the text while tokens are still arriving. */
  streaming?: boolean;
}

export function MessageBubble({ message, streaming }: MessageBubbleProps) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex w-full animate-message-in justify-end">
        <div className="max-w-[85%] rounded-3xl rounded-br-lg bg-gradient-to-br from-cherry to-cherry-deep px-4 py-2.5 text-sm leading-relaxed text-primary-foreground shadow-[0_8px_24px_-12px_color-mix(in_oklch,var(--cherry)_80%,transparent)] sm:max-w-[72%]">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full animate-message-in items-start gap-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-cherry/10 text-cherry ring-1 ring-cherry/15">
        <CherryMark className="size-4.5" />
      </span>
      <div
        className={cn(
          "min-w-0 max-w-[calc(100%-2.75rem)] rounded-3xl rounded-tl-lg bg-card px-4 py-3 text-sm leading-relaxed text-card-foreground shadow-sm ring-1 ring-border/70",
          streaming && "streaming-caret",
        )}
      >
        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1.5 prose-headings:mt-3 prose-headings:mb-1.5 prose-pre:my-2.5 prose-pre:overflow-x-auto prose-pre:rounded-xl prose-pre:bg-muted prose-pre:text-foreground prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:text-cherry prose-code:before:content-[''] prose-code:after:content-[''] prose-a:text-cherry prose-a:underline-offset-2 prose-strong:text-foreground">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
