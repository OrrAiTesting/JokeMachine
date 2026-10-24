"use client";

import { useRef, useState, type FormEvent } from "react";
import { MAX_TOPIC_LENGTH, messages } from "@/lib/messages";

type ErrorReason = keyof typeof messages.error;
type Result =
  | { kind: "joke"; text: string }
  | { kind: "error"; reason: ErrorReason }
  | null;

// Client-side limit; the server always answers sooner (ARCHITECTURE.md, ADR-5)
const REQUEST_TIMEOUT_MS = 30_000;

// Alert icon for Card · Message: line circle with an exclamation mark
function AlertIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="mt-[3.5px] shrink-0"
    >
      <g fill="none" stroke="#f07167" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="12" cy="12" r="9.5" />
        <path d="M12 7.5v5.5" />
      </g>
      <circle cx="12" cy="16.4" r="1.1" fill="#f07167" />
    </svg>
  );
}

export function JokeMachine() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  // Last shown content; kept while loading so the previous card stays visible
  const [result, setResult] = useState<Result>(null);
  // Blocks double submits before the loading state re-renders
  const inFlight = useRef(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;

    // No connection: show the message without sending a request
    if (!navigator.onLine) {
      setResult({ kind: "error", reason: "offline" });
      return;
    }

    inFlight.current = true;
    setLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      let response: Response;
      try {
        response = await fetch("/api/joke", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic: topic.trim() }),
          signal: controller.signal,
        });
      } catch (error) {
        // TypeError = network failure; AbortError = our timeout
        const reason = error instanceof TypeError ? "offline" : "general";
        setResult({ kind: "error", reason });
        return;
      }

      // Any non-200 status, or a 200 without a joke, shows the general message
      const data: { joke?: unknown } | null = response.ok
        ? await response.json().catch(() => null)
        : null;
      if (typeof data?.joke === "string" && data.joke) {
        setResult({ kind: "joke", text: data.joke });
      } else {
        setResult({ kind: "error", reason: "general" });
      }
    } catch {
      setResult({ kind: "error", reason: "general" });
    } finally {
      clearTimeout(timer);
      inFlight.current = false;
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-[22px]">
      <label htmlFor="topic" className="sr-only">
        {messages.inputLabel}
      </label>
      <div className="group transition-[filter] focus-within:glow-gold">
        <div className="lozenge bg-silver-gradient p-[1.5px] group-focus-within:bg-gold-gradient group-focus-within:p-[2px]">
          <div className="lozenge h-[53px] bg-navy [--tip:21px] group-focus-within:h-[52px]">
            <input
              id="topic"
              type="text"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              maxLength={MAX_TOPIC_LENGTH}
              placeholder={messages.placeholder}
              autoComplete="off"
              enterKeyHint="send"
              className="h-full w-full truncate bg-transparent px-[26px] text-base leading-6 text-white placeholder:text-silver-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className={loading ? "" : "glow-gold"}>
        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className={`lozenge block h-[58px] w-full ${
            loading ? "bg-silver-400/70 p-[1.5px]" : "bg-gold-gradient cursor-pointer"
          }`}
        >
          <span
            className={`lozenge flex h-full w-full items-center justify-center px-7 text-[20px] leading-6 [--tip:21px] ${
              loading
                ? "bg-gradient-to-b from-indigo to-navy font-medium text-silver-400"
                : "font-bold text-midnight"
            }`}
          >
            {loading ? messages.loading : messages.button}
          </span>
        </button>
      </div>

      <div aria-live="polite" className="mt-[10px]">
        {result?.kind === "joke" && (
          <div className="rounded-[22px] bg-gold-gradient p-[2px] shadow-[0_0_30px_rgb(61_123_255/0.55)]">
            <div className="rounded-[20px] bg-card px-6 py-6">
              <p
                dir="auto"
                className="whitespace-pre-line text-start text-lg leading-[29px] text-white"
              >
                {result.text}
              </p>
            </div>
          </div>
        )}
        {result?.kind === "error" && (
          <div className="flex items-start gap-3 rounded-[22px] border-2 border-coral bg-card px-6 py-6">
            <AlertIcon />
            <p className="text-start text-lg leading-[29px] text-white">
              {messages.error[result.reason]}
            </p>
          </div>
        )}
      </div>
    </form>
  );
}
