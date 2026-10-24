import { messages } from "@/lib/messages";
import { Emblem } from "./emblem";
import { JokeMachine } from "./joke-machine";

// The single main screen (DESIGN.md, section 1.1)
export default function Home() {
  return (
    <main className="relative z-10 flex flex-1 flex-col items-center px-6 pt-[calc(30px+env(safe-area-inset-top))] pb-[calc(32px+env(safe-area-inset-bottom))]">
      <div className="flex w-full max-w-md flex-col items-center gap-[22px]">
        <Emblem />
        <h1 className="bg-gold-gradient bg-clip-text pb-1 text-center font-display text-[40px] leading-[46px] font-black text-transparent drop-shadow-[0_0_10px_rgb(229_177_46/0.35)]">
          {messages.title}
        </h1>
        <JokeMachine />
      </div>
    </main>
  );
}
