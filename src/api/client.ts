import { API_URL } from "@/lib/config";
import type { ChatMessage, Session } from "@/types";
import { ApiError } from "./errors";
import { parseSSEStream } from "./sse";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiError(`Network request to ${path} failed`);
  }

  if (!res.ok) {
    throw new ApiError(`${path} responded with ${res.status}`, res.status);
  }

  return (await res.json()) as T;
}

export function getHealth(): Promise<unknown> {
  return request("/api/health");
}

export function listSessions(): Promise<Session[]> {
  return request("/api/sessions");
}

export function createSession(): Promise<Session> {
  return request("/api/sessions", { method: "POST" });
}

export function getMessages(sessionId: string): Promise<ChatMessage[]> {
  return request(`/api/sessions/${sessionId}/messages`);
}

export interface SendMessageHandlers {
  onToken: (text: string) => void;
  onDone: (message: ChatMessage) => void;
}

export async function sendMessage(
  sessionId: string,
  content: string,
  handlers: SendMessageHandlers,
): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/sessions/${sessionId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
  } catch {
    throw new ApiError("Network request to send message failed");
  }

  if (!res.ok || !res.body) {
    throw new ApiError(`Send message responded with ${res.status}`, res.status);
  }

  for await (const event of parseSSEStream(res.body)) {
    if (event.event === "token") {
      handlers.onToken(event.data);
    } else if (event.event === "done") {
      handlers.onDone(parseDoneEvent(event.data));
    }
  }
}

function parseDoneEvent(data: string): ChatMessage {
  try {
    const parsed = JSON.parse(data);
    if (parsed && typeof parsed === "object" && "content" in parsed) {
      return {
        id: parsed.id ?? crypto.randomUUID(),
        role: parsed.role === "user" ? "user" : "assistant",
        content: parsed.content,
        created_at: parsed.created_at ?? new Date().toISOString(),
      };
    }
  } catch {
    // Not JSON — treat the raw data as the message text.
  }

  return {
    id: crypto.randomUUID(),
    role: "assistant",
    content: data,
    created_at: new Date().toISOString(),
  };
}
