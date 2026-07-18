import { useCallback, useEffect, useState } from "react";
import { AppFrame } from "@/components/layout/AppFrame";
import { ChatThread } from "@/components/chat/ChatThread";
import { Composer } from "@/components/chat/Composer";
import { OfflineBanner } from "@/components/chat/OfflineBanner";
import { Sidebar } from "@/components/chat/Sidebar";
import { useMessages } from "@/hooks/useMessages";
import { useSessions } from "@/hooks/useSessions";

interface ChatViewProps {
  isOnline: boolean;
  retry: () => Promise<void>;
}

/**
 * The `/` route. This is the pre-router App.tsx body, unchanged in behavior:
 * same streaming, offline-cache, and iOS visibility-recovery handling — only
 * relocated into a route component and given the shared Sidebar/AppFrame.
 */
export function ChatView({ isOnline, retry }: ChatViewProps) {
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

  const sidebar = (
    <Sidebar
      section="chat"
      sessions={sessions}
      activeSessionId={activeSessionId}
      onSelect={handleSelect}
      onNewChat={handleNewChat}
      disabled={!isOnline}
      isOnline={isOnline}
    />
  );

  return (
    <AppFrame
      sidebar={sidebar}
      mobileTitle={activeSession?.title || "CherryAI"}
      mobileNavOpen={mobileNavOpen}
      onMobileNavOpenChange={setMobileNavOpen}
    >
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
    </AppFrame>
  );
}
