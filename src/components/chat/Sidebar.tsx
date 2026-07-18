import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Session } from "@/types";

interface SidebarProps {
  sessions: Session[];
  activeSessionId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  disabled?: boolean;
}

export function Sidebar({
  sessions,
  activeSessionId,
  onSelect,
  onNewChat,
  disabled,
}: SidebarProps) {
  return (
    <div className="flex h-full w-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="p-3">
        <Button
          className="w-full justify-start gap-2"
          onClick={onNewChat}
          disabled={disabled}
        >
          <Plus className="size-4" />
          New chat
        </Button>
      </div>
      <ScrollArea className="min-h-0 flex-1 px-2">
        <nav className="flex flex-col gap-1 pb-3">
          {sessions.map((session) => (
            <button
              key={session.id}
              type="button"
              onClick={() => onSelect(session.id)}
              aria-current={session.id === activeSessionId}
              className={cn(
                "truncate rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                session.id === activeSessionId &&
                  "bg-sidebar-accent text-sidebar-accent-foreground",
              )}
            >
              {session.title || "New conversation"}
            </button>
          ))}
          {sessions.length === 0 && (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              No conversations yet
            </p>
          )}
        </nav>
      </ScrollArea>
    </div>
  );
}
