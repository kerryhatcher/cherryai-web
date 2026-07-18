import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
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
    loading: sessionsLoading,
  } = useSessions({ isOnline });
  const {
    messages,
    loading: messagesLoading,
    send,
    streamingText,
    isSending,
  } = useMessages({ sessionId: activeSessionId, isOnline });
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const activeSession = sessions.find((session) => session.id === activeSessionId);
  const composerDisabled = !isOnline || isSending || !activeSessionId;

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
        />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 border-b border-border p-3 md:hidden">
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
              />
            </SheetContent>
          </Sheet>
          <span className="truncate text-sm font-medium">
            {activeSession?.title || "CherryAI"}
          </span>
        </header>

        {!isOnline && <OfflineBanner />}

        <ChatThread
          messages={messages}
          streamingText={streamingText}
          loading={sessionsLoading || messagesLoading}
        />

        <Composer onSend={send} onInteract={handleInteract} disabled={composerDisabled} />
      </div>
    </div>
  );
}

export default App;
