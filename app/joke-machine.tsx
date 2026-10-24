"use client";

import { useRef, useState, type FormEvent } from "react";
import { MAX_TOPIC_LENGTH, messages } from "@/lib/messages";

type Result = { kind: "joke"; text: string } | { kind: "error" } | null;

export function JokeMachine() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  // Last shown content; kept while loading so the previous joke stays visible
  const [result, setResult] = useState<Result>(null);
  // Blocks double submits before the loading state re-renders
  const inFlight = useRef(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);

    try {
      const response = await fetch("/api/joke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim() }),
      });
      const data: { joke?: string } = await response.json();
      if (response.ok && data.joke) {
        setResult({ kind: "joke", text: data.joke });
      } else {
        setResult({ kind: "error" });
      }
    } catch {
      // Offline/timeout handling comes in Milestone 3
      setResult({ kind: "error" });
    } finally {
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
        {result && (
          <div className="rounded-[22px] bg-gold-gradient p-[2px] shadow-[0_0_30px_rgb(61_123_255/0.55)]">
            <div className="rounded-[20px] bg-card px-6 py-6">
              <p
                dir="auto"
                className="whitespace-pre-line text-start text-lg leading-[29px] text-white"
              >
                {result.kind === "joke" ? result.text : messages.error.general}
              </p>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
