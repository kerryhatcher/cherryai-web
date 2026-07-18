export interface SSEEvent {
  event: string;
  data: string;
}

/**
 * Parses a text/event-stream response body into discrete SSE events.
 * Used instead of EventSource because the API streams over a POST request,
 * which EventSource cannot issue.
 */
export async function* parseSSEStream(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<SSEEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    // Per the SSE spec, lines may end in \r\n (sse-starlette does this).
    // Normalize the whole buffer each append so a \r\n pair split across
    // two reads is still collapsed once its second half arrives.
    buffer = buffer.replace(/\r\n/g, "\n");

    let boundary = buffer.indexOf("\n\n");
    while (boundary !== -1) {
      const chunk = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      const event = parseEventChunk(chunk);
      if (event) yield event;
      boundary = buffer.indexOf("\n\n");
    }
  }

  const trailing = parseEventChunk(buffer);
  if (trailing) yield trailing;
}

function parseEventChunk(chunk: string): SSEEvent | null {
  if (!chunk.trim()) return null;

  let event = "message";
  const dataLines: string[] = [];

  for (const line of chunk.split("\n")) {
    if (line.startsWith("event:")) {
      event = line.slice("event:".length).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice("data:".length).trim());
    }
  }

  if (dataLines.length === 0) return null;
  return { event, data: dataLines.join("\n") };
}
