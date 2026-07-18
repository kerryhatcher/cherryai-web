import { BookOpen, MessageSquare, Plus } from "lucide-react";
import { Link, NavLink } from "react-router";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CherryMark } from "@/components/CherryMark";
import { cn } from "@/lib/utils";
import type { Session } from "@/types";

interface SidebarProps {
  section: "chat" | "wiki";
  sessions: Session[];
  activeSessionId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  disabled?: boolean;
  isOnline?: boolean;
}

export function Sidebar({
  section,
  sessions,
  activeSessionId,
  onSelect,
  onNewChat,
  disabled,
  isOnline = true,
}: SidebarProps) {
  return (
    <div className="flex h-full w-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2.5 px-5 pt-6 pb-5">
        <span className="text-cherry drop-shadow-[0_2px_8px_color-mix(in_oklch,var(--cherry)_45%,transparent)]">
          <CherryMark className="size-7" />
        </span>
        <div className="leading-none">
          <span className="text-[15px] font-semibold tracking-tight">
            Cherry<span className="text-cherry">AI</span>
          </span>
        </div>
      </div>

      <div className="px-3 pb-4">
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-sidebar-accent/40 p-1">
          <NavLink
            to="/"
            end
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-all duration-200",
              section === "chat"
                ? "bg-sidebar text-sidebar-accent-foreground shadow-sm"
                : "text-sidebar-foreground/60 hover:text-sidebar-foreground",
            )}
          >
            <MessageSquare className="size-3.5" />
            Chat
          </NavLink>
          <NavLink
            to="/wiki"
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-all duration-200",
              section === "wiki"
                ? "bg-sidebar text-sidebar-accent-foreground shadow-sm"
                : "text-sidebar-foreground/60 hover:text-sidebar-foreground",
            )}
          >
            <BookOpen className="size-3.5" />
            Wiki
          </NavLink>
        </div>
      </div>

      {section === "chat" ? (
        <>
          <div className="px-3 pb-4">
            <Button
              className="group w-full justify-start gap-2 rounded-xl bg-cherry font-medium text-primary-foreground shadow-[0_6px_20px_-8px_color-mix(in_oklch,var(--cherry)_75%,transparent)] transition-all hover:bg-cherry-bright hover:shadow-[0_10px_28px_-8px_color-mix(in_oklch,var(--cherry)_85%,transparent)] disabled:shadow-none"
              onClick={onNewChat}
              disabled={disabled}
            >
              <Plus className="size-4 transition-transform group-hover:rotate-90" />
              New chat
            </Button>
          </div>

          <ScrollArea className="min-h-0 flex-1 px-3">
            {sessions.length > 0 && (
              <p className="px-2 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
                Recent
              </p>
            )}
            <nav className="flex flex-col gap-0.5 pb-4">
              {sessions.map((session) => {
                const active = session.id === activeSessionId;
                return (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => onSelect(session.id)}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "group relative truncate rounded-lg py-2 pl-4 pr-3 text-left text-sm transition-all duration-200",
                      active
                        ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute left-1 top-1/2 h-4 w-1 -translate-y-1/2 rounded-full bg-cherry transition-all duration-200",
                        active ? "opacity-100" : "opacity-0 group-hover:opacity-40",
                      )}
                    />
                    {session.title || "New conversation"}
                  </button>
                );
              })}
              {sessions.length === 0 && (
                <p className="px-2 py-2 text-sm text-muted-foreground">
                  No conversations yet
                </p>
              )}
            </nav>
          </ScrollArea>
        </>
      ) : (
        <>
          <div className="px-3 pb-4">
            <Button
              asChild
              className="group w-full justify-start gap-2 rounded-xl bg-cherry font-medium text-primary-foreground shadow-[0_6px_20px_-8px_color-mix(in_oklch,var(--cherry)_75%,transparent)] transition-all hover:bg-cherry-bright hover:shadow-[0_10px_28px_-8px_color-mix(in_oklch,var(--cherry)_85%,transparent)] aria-disabled:pointer-events-none aria-disabled:opacity-50 aria-disabled:shadow-none"
              aria-disabled={disabled}
            >
              <Link to={disabled ? "#" : "/wiki/new"} tabIndex={disabled ? -1 : undefined}>
                <Plus className="size-4 transition-transform group-hover:rotate-90" />
                New page
              </Link>
            </Button>
          </div>

          <nav className="flex flex-1 flex-col gap-0.5 px-3 pb-4">
            <NavLink
              to="/wiki"
              end
              className={({ isActive }) =>
                cn(
                  "group relative truncate rounded-lg py-2 pl-4 pr-3 text-left text-sm transition-all duration-200",
                  isActive
                    ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                )
              }
            >
              All pages
            </NavLink>
          </nav>
        </>
      )}

      <div className="border-t border-sidebar-border px-5 py-3.5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="relative flex size-2">
            {isOnline && (
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500/60" />
            )}
            <span
              className={cn(
                "relative inline-flex size-2 rounded-full",
                isOnline ? "bg-emerald-500" : "bg-amber-500",
              )}
            />
          </span>
          {isOnline ? "Connected" : "Offline — cached view"}
        </div>
      </div>
    </div>
  );
}
