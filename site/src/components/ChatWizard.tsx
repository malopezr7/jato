import { useState, useEffect, useRef } from "react";

const CHAT_SCRIPT = [
  { role: "user", text: "I need a rig for my React Native project with Expo. We use Supabase and GitHub." },
  { role: "ai", text: "I'll create a mobile rig for you. Let me set that up with the right MCPs and skills." },
  { role: "ai", type: "action", text: "Creating ~/.rig/rigs/mobile/rig.yaml" },
  { role: "ai", type: "action", text: "Adding MCPs: github, supabase, filesystem" },
  { role: "ai", type: "action", text: "Generating instructions.md — RN conventions" },
  { role: "ai", type: "action", text: "Generating skills/testing-rn.md" },
  { role: "ai", type: "action", text: "Generating providers/claude.md" },
  { role: "ai", type: "run", text: "$ rig use mobile" },
  { role: "ai", text: "Done! Your mobile rig is active. Claude Code and Codex are configured with 3 MCPs, RN testing skills, and provider-specific instructions. Want to add anything else?" },
  { role: "user", text: "Add a code review skill focused on performance." },
  { role: "ai", type: "action", text: "Creating skills/perf-review.md" },
  { role: "ai", type: "run", text: "$ rig use mobile" },
  { role: "ai", text: "Added. The skill covers bundle size analysis, re-render detection, and memory leak patterns for React Native." },
];

function TypingDots() {
  return (
    <span className="inline-flex gap-[3px] items-center h-5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-[5px] h-[5px] rounded-full bg-rig-chat-dot"
          style={{ animation: `dotPulse 1.2s ease-in-out ${i * 0.2}s infinite` }}
        />
      ))}
    </span>
  );
}

interface ChatMsg {
  role: string;
  text: string;
  type?: string;
}

function ChatBubble({ msg, visible, typing }: { msg: ChatMsg; visible: boolean; typing: boolean }) {
  const isUser = msg.role === "user";
  const isAction = msg.type === "action";
  const isRun = msg.type === "run";

  if (!visible) return null;

  if (isAction || isRun) {
    return (
      <div className={`flex justify-start pl-2 transition-all duration-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
        <div className={`font-mono text-xs flex items-center gap-1.5 py-0.5 ${isRun ? "text-rig-accent" : "text-rig-text-faint"}`}>
          <span className="text-rig-accent text-[10px]">{isRun ? "▶" : "✓"}</span>
          {typing ? <TypingDots /> : msg.text}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} transition-all duration-400 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
      <div
        className={`max-w-[82%] px-3.5 py-2.5 rounded-xl text-[13.5px] leading-relaxed ${
          isUser
            ? "bg-rig-chat-user-bg text-rig-chat-user rounded-br-[4px]"
            : "bg-rig-chat-ai-bg text-rig-chat-ai border border-rig-chat-ai-border rounded-bl-[4px]"
        }`}
      >
        {typing ? <TypingDots /> : msg.text}
      </div>
    </div>
  );
}

export default function ChatWizard() {
  const [step, setStep] = useState(0);
  const [typing, setTyping] = useState(false);
  const [started, setStarted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          obs.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!started || step >= CHAT_SCRIPT.length) return;
    const msg = CHAT_SCRIPT[step];
    const isAction = msg.type === "action" || msg.type === "run";
    const typingDelay = msg.role === "user" ? 600 : isAction ? 300 : 900;
    const showDelay = msg.role === "user" ? 800 : isAction ? 500 : 1600;

    const t1 = setTimeout(() => setTyping(true), typingDelay);
    const t2 = setTimeout(() => {
      setTyping(false);
      setStep((s) => s + 1);
    }, showDelay);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [step, started]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [step, typing]);

  return (
    <div
      ref={wrapperRef}
      className="bg-rig-surface border border-rig-border rounded-2xl overflow-hidden max-w-[520px] w-full shadow-lg transition-colors"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-rig-border flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-rig-accent-soft flex items-center justify-center font-mono text-xs font-medium text-rig-accent">
          r
        </div>
        <div>
          <div className="text-[13px] font-medium text-rig-text">rig manager</div>
          <div className="text-[11px] text-rig-text-ghost">skill active</div>
        </div>
        <div className="ml-auto flex gap-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-rig-term-dot" />
          ))}
        </div>
      </div>

      {/* Messages */}
      <div ref={containerRef} className="p-4 flex flex-col gap-2.5 h-[340px] overflow-y-auto scroll-smooth">
        {CHAT_SCRIPT.map((msg, i) => (
          <ChatBubble key={i} msg={msg} visible={i < step || (i === step && typing)} typing={i === step && typing} />
        ))}
        {step >= CHAT_SCRIPT.length && (
          <div className="text-center pt-3 pb-1 text-xs text-rig-text-ghost font-mono animate-[fadeUp_0.5s_ease_both]">
            rig created conversationally ✦
          </div>
        )}
      </div>
    </div>
  );
}
