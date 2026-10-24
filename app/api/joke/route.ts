import { generateJoke } from "@/lib/joke-service";
import { MAX_TOPIC_LENGTH } from "@/lib/messages";

// No `dynamic` export: it is not supported with cacheComponents, and POST
// handlers already run on every request (ARCHITECTURE.md, ADR-6).
export const maxDuration = 60;

function invalidRequest() {
  return Response.json({ error: "invalid_request" }, { status: 400 });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return invalidRequest();
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return invalidRequest();
  }

  const rawTopic = (body as { topic?: unknown }).topic;
  if (rawTopic !== undefined && typeof rawTopic !== "string") {
    return invalidRequest();
  }

  const topic = (rawTopic ?? "").trim();
  if (topic.length > MAX_TOPIC_LENGTH) {
    return invalidRequest();
  }

  try {
    const joke = await generateJoke(topic);
    return Response.json({ joke });
  } catch {
    // Detailed error mapping and logging come in Milestone 3
    return Response.json({ error: "server_error" }, { status: 500 });
  }
}
