import { useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComposerProps {
  onSend: (content: string) => void;
  onInteract?: () => void;
  disabled?: boolean;
  offline?: boolean;
  placeholder?: string;
}

export function Composer({ onSend, onInteract, disabled, offline, placeholder }: ComposerProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow the textarea with its content, capped by max-height in CSS.
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  const canSubmit = !disabled && value.trim().length > 0;

  return (
    <div className="pb-safe px-4 pt-2 sm:px-6" onClickCapture={onInteract}>
      <div className="mx-auto w-full max-w-3xl pb-4">
        <div
          className={cn(
            "flex items-end gap-2 rounded-[1.75rem] border border-input bg-card/80 p-2 pl-4 shadow-[0_12px_40px_-24px_rgba(0,0,0,0.6)] backdrop-blur-md transition-all duration-200",
            "focus-within:border-cherry/50 focus-within:shadow-[0_16px_44px_-22px_color-mix(in_oklch,var(--cherry)_60%,transparent)]",
            disabled && "opacity-70",
          )}
        >
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={placeholder ?? "Message CherryAI…"}
            rows={1}
            className="max-h-[200px] min-h-9 flex-1 resize-none bg-transparent py-2 text-[15px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/70 disabled:cursor-not-allowed"
          />
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            aria-label="Send message"
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-full transition-all duration-200",
              canSubmit
                ? "bg-cherry text-primary-foreground shadow-[0_6px_18px_-6px_color-mix(in_oklch,var(--cherry)_85%,transparent)] hover:bg-cherry-bright hover:scale-105 active:scale-95"
                : "bg-muted text-muted-foreground",
            )}
          >
            <ArrowUp className="size-5" strokeWidth={2.5} />
          </button>
        </div>
        <p className="mt-2 px-2 text-center text-[11px] text-muted-foreground/60">
          {offline
            ? "Reconnect to send new messages."
            : "CherryAI can make mistakes. Press Enter to send, Shift + Enter for a new line."}
        </p>
      </div>
    </div>
  );
}
