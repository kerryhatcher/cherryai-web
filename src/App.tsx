import { BrowserRouter, Route, Routes } from "react-router";
import { useApiStatus } from "@/hooks/useApiStatus";
import { ChatView } from "@/routes/ChatView";
import { FeedbackEditor } from "@/routes/FeedbackEditor";
import { FeedbackIndex } from "@/routes/FeedbackIndex";
import { FeedbackView } from "@/routes/FeedbackView";
import { WikiEditor } from "@/routes/WikiEditor";
import { WikiIndex } from "@/routes/WikiIndex";
import { WikiView } from "@/routes/WikiView";

function App() {
  // A single API-reachability check shared by every route (chat, wiki, and
  // feedback alike), matching the pre-router behavior of one poll instance
  // for the whole app.
  const { isOnline, retry } = useApiStatus();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ChatView isOnline={isOnline} retry={retry} />} />
        <Route path="/wiki" element={<WikiIndex isOnline={isOnline} />} />
        <Route path="/wiki/new" element={<WikiEditor mode="create" isOnline={isOnline} />} />
        <Route path="/wiki/:slug" element={<WikiView isOnline={isOnline} />} />
        <Route path="/wiki/:slug/edit" element={<WikiEditor mode="edit" isOnline={isOnline} />} />
        <Route path="/feedback" element={<FeedbackIndex isOnline={isOnline} />} />
        <Route path="/feedback/new" element={<FeedbackEditor mode="create" isOnline={isOnline} />} />
        <Route path="/feedback/:id" element={<FeedbackView isOnline={isOnline} />} />
        <Route path="/feedback/:id/edit" element={<FeedbackEditor mode="edit" isOnline={isOnline} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
