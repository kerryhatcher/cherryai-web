import { useEffect, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChatMessage } from "@/types";
import { MessageBubble } from "./MessageBubble";

interface ChatThreadProps {
  messages: ChatMessage[];
  streamingText: string;
  loading: boolean;
}

export function ChatThread({ messages, streamingText, loading }: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
        <Skeleton className="h-16 w-2/3 rounded-2xl" />
        <Skeleton className="ml-auto h-10 w-1/2 rounded-2xl" />
        <Skeleton className="h-20 w-3/4 rounded-2xl" />
      </div>
    );
  }

  if (messages.length === 0 && !streamingText) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 text-center text-sm text-muted-foreground">
        Start the conversation — ask CherryAI anything.
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      {streamingText && (
        <MessageBubble message={{ role: "assistant", content: streamingText }} />
      )}
      <div ref={bottomRef} />
    </div>
  );
}
