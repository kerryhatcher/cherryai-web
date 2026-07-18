import { useCallback, useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { CherryMark } from "@/components/CherryMark";
import { ChatThread } from "@/components/chat/ChatThread";
import { Composer } from "@/components/chat/Composer";
import { OfflineBanner } from "@/components/chat/OfflineBanner";
import { Sidebar } from "@/components/chat/Sidebar";
import { useApiStatus } from "@/hooks/useApiStatus";
import { useMessages } from "@/hooks/useMessages";
import { useSessions } from "@/hooks/useSessions";

function App() {
  const { isOnline, retry } = useApiStatus();
  const {
    sessions,
    activeSessionId,
    setActiveSessionId,
    newSession,
    refresh: refreshSessions,
    loading: sessionsLoading,
  } = useSessions({ isOnline });

  // After a session's first reply the backend assigns it a real title, so
  // refresh the list to replace the "New chat" placeholder in the sidebar.
  const handleExchangeComplete = useCallback(
    ({ firstInSession }: { firstInSession: boolean }) => {
      if (firstInSession) void refreshSessions();
    },
    [refreshSessions],
  );

  const {
    messages,
    loading: messagesLoading,
    send,
    streamingText,
    isSending,
    reload: reloadMessages,
  } = useMessages({
    sessionId: activeSessionId,
    isOnline,
    onExchangeComplete: handleExchangeComplete,
  });
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // iOS suspends the page (and kills in-flight streams) when the app is
  // backgrounded. On return, pull fresh state from the server so replies that
  // completed while suspended still appear. The short delay lets an aborted
  // send settle before the thread is replaced.
  useEffect(() => {
    const onReturn = () => {
      if (document.visibilityState !== "visible") return;
      void retry();
      void refreshSessions();
      window.setTimeout(() => void reloadMessages(), 300);
    };
    document.addEventListener("visibilitychange", onReturn);
    window.addEventListener("pageshow", onReturn);
    return () => {
      document.removeEventListener("visibilitychange", onReturn);
      window.removeEventListener("pageshow", onReturn);
    };
  }, [retry, refreshSessions, reloadMessages]);

  const activeSession = sessions.find((session) => session.id === activeSessionId);
  const composerDisabled = !isOnline || isSending || !activeSessionId;
  const canSend = isOnline && !isSending && Boolean(activeSessionId);

  const handleSelect = (id: string) => {
    setActiveSessionId(id);
    setMobileNavOpen(false);
  };

  const handleNewChat = () => {
    void newSession();
    setMobileNavOpen(false);
  };

  const handleInteract = () => {
    if (!isOnline) void retry();
  };

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background text-foreground">
      <aside className="hidden w-72 shrink-0 border-r border-border md:flex">
        <Sidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelect={handleSelect}
          onNewChat={handleNewChat}
          disabled={!isOnline}
          isOnline={isOnline}
        />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile header */}
        <header className="flex items-center gap-2 border-b border-border bg-background/80 px-3 py-2.5 backdrop-blur-md md:hidden">
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open sessions">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <Sidebar
                sessions={sessions}
                activeSessionId={activeSessionId}
                onSelect={handleSelect}
                onNewChat={handleNewChat}
                disabled={!isOnline}
                isOnline={isOnline}
              />
            </SheetContent>
          </Sheet>
          <span className="flex items-center gap-1.5 truncate text-sm font-semibold tracking-tight">
            <span className="text-cherry">
              <CherryMark className="size-4" />
            </span>
            <span className="truncate">{activeSession?.title || "CherryAI"}</span>
          </span>
        </header>

        {/* Desktop header */}
        <header className="hidden items-center justify-between border-b border-border px-6 py-3 md:flex">
          <h2 className="truncate text-sm font-medium text-foreground/90">
            {activeSession?.title || "New conversation"}
          </h2>
        </header>

        {!isOnline && <OfflineBanner />}

        <ChatThread
          messages={messages}
          streamingText={streamingText}
          loading={sessionsLoading || messagesLoading}
          isSending={isSending}
          onSuggestion={send}
          canSend={canSend}
        />

        <Composer
          onSend={send}
          onInteract={handleInteract}
          disabled={composerDisabled}
          offline={!isOnline}
        />
      </div>
    </div>
  );
}

export default App;
