import OpenAI from "openai";
import { EmptyResponseError, generateJoke, MissingApiKeyError } from "@/lib/joke-service";
import { MAX_TOPIC_LENGTH } from "@/lib/messages";

// No `dynamic` export: it is not supported with cacheComponents, and POST
// handlers already run on every request (ARCHITECTURE.md, ADR-6).
export const maxDuration = 60;

function invalidRequest() {
  return Response.json({ error: "invalid_request" }, { status: 400 });
}

// Maps a failure to the API error code and a log-safe type label.
// Labels are explicit strings because class names may be minified in production.
function classifyError(error: unknown) {
  if (error instanceof EmptyResponseError) {
    return { code: "empty_response", status: 502, type: "empty_response" };
  }
  if (error instanceof OpenAI.APIConnectionTimeoutError) {
    return { code: "ai_error", status: 502, type: "ai_timeout" };
  }
  if (error instanceof OpenAI.APIConnectionError) {
    return { code: "ai_error", status: 502, type: "ai_connection" };
  }
  if (error instanceof OpenAI.APIError) {
    return { code: "ai_error", status: 502, type: "ai_api_error", aiStatus: error.status };
  }
  if (error instanceof MissingApiKeyError) {
    return { code: "server_error", status: 500, type: "missing_api_key" };
  }
  return { code: "server_error", status: 500, type: "unexpected" };
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
  } catch (error) {
    const { code, status, type, aiStatus } = classifyError(error);
    // Log only the error type and status: never the topic, joke, message or key
    console.error("joke_error", { type, status: aiStatus ?? status });
    return Response.json({ error: code }, { status });
  }
}
