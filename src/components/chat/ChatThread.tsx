import { useEffect, useRef } from "react";
import { CherryMark } from "@/components/CherryMark";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChatMessage } from "@/types";
import { MessageBubble } from "./MessageBubble";

interface ChatThreadProps {
  messages: ChatMessage[];
  streamingText: string;
  loading: boolean;
  isSending: boolean;
  onSuggestion: (prompt: string) => void;
  canSend: boolean;
}

const SUGGESTIONS = [
  "Explain a tricky concept simply",
  "Search the web for today's headlines",
  "Draft a short, punchy email",
  "Brainstorm names for a project",
];

/** A message is worth showing only if it has non-whitespace content. */
function hasContent(message: ChatMessage) {
  return message.content.trim().length > 0;
}

export function ChatThread({
  messages,
  streamingText,
  loading,
  isSending,
  onSuggestion,
  canSend,
}: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const visible = messages.filter(hasContent);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText, isSending]);

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 overflow-y-auto px-4 py-8 sm:px-6">
        <div className="flex items-start gap-3">
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <Skeleton className="h-16 w-2/3 rounded-3xl" />
        </div>
        <Skeleton className="ml-auto h-10 w-1/2 rounded-3xl" />
        <div className="flex items-start gap-3">
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <Skeleton className="h-24 w-3/4 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (visible.length === 0 && !streamingText && !isSending) {
    return (
      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-6">
        {/* soft cherry glow behind the hero */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[38%] size-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklch, var(--cherry) 22%, transparent), transparent 68%)",
            animation: "glow-drift 9s ease-in-out infinite",
          }}
        />
        <div className="relative flex max-w-xl flex-col items-center text-center">
          <span
            className="animate-rise-in text-cherry drop-shadow-[0_10px_30px_color-mix(in_oklch,var(--cherry)_45%,transparent)]"
            style={{ animationDelay: "40ms" }}
          >
            <CherryMark className="size-16" bob />
          </span>
          <h1
            className="animate-rise-in mt-6 text-balance text-3xl font-semibold tracking-tight sm:text-4xl"
            style={{ animationDelay: "120ms" }}
          >
            What can I help you discover?
          </h1>
          <p
            className="animate-rise-in mt-3 text-pretty text-[15px] leading-relaxed text-muted-foreground"
            style={{ animationDelay: "200ms" }}
          >
            CherryAI can search the web, remember what matters, and think through
            problems with you. Ask anything to begin.
          </p>

          {canSend && (
            <div
              className="animate-rise-in mt-8 grid w-full grid-cols-1 gap-2.5 sm:grid-cols-2"
              style={{ animationDelay: "300ms" }}
            >
              {SUGGESTIONS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => onSuggestion(prompt)}
                  className="group rounded-2xl border border-border bg-card/60 px-4 py-3 text-left text-sm text-card-foreground/90 shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-cherry/40 hover:bg-card hover:text-foreground hover:shadow-[0_10px_30px_-16px_color-mix(in_oklch,var(--cherry)_75%,transparent)]"
                >
                  <span className="mr-1 text-cherry/70 transition-colors group-hover:text-cherry">
                    ↳
                  </span>
                  {prompt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 overflow-y-auto px-4 py-8 sm:px-6">
      {visible.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      {streamingText ? (
        <MessageBubble
          message={{ role: "assistant", content: streamingText }}
          streaming
        />
      ) : (
        isSending && <ThinkingIndicator />
      )}
      <div ref={bottomRef} className="h-px" />
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div className="flex w-full animate-message-in items-start gap-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-cherry/10 text-cherry ring-1 ring-cherry/15">
        <CherryMark className="size-4.5" />
      </span>
      <div className="flex items-center gap-1.5 rounded-3xl rounded-tl-lg bg-card px-4 py-4 shadow-sm ring-1 ring-border/70">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="thinking-dot size-2 rounded-full bg-cherry"
            style={{ animationDelay: `${i * 0.18}s` }}
          />
        ))}
      </div>
    </div>
  );
}
