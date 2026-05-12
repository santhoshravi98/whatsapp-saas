"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { Icons } from "./Icons";
import { Bubble } from "./Primitives";
import { useMouseParallax } from "./hooks";

const heroMessages = [
  { f: "them" as const, name: "Priya · Salon", t: "Hi! Booking a hair spa for Saturday 4pm?", time: "10:22" },
  { f: "me" as const, name: "let's chat", t: "Confirmed ✓ Reminder sent 1hr before.", time: "10:22" },
  { f: "them" as const, name: "Ramesh · Hyundai", t: "Is my Creta service due?", time: "10:23" },
  { f: "me" as const, name: "let's chat", t: "Yes — service due 12 May. Slot at 9:30?", time: "10:23" },
  { f: "them" as const, name: "Anita · Admissions", t: "Need info on B.Tech CSE.", time: "10:24" },
  { f: "me" as const, name: "let's chat", t: "Sending brochure + counsellor link.", time: "10:24" },
  { f: "them" as const, name: "Vikram · Insurance", t: "Renewed my policy?", time: "10:25" },
  { f: "me" as const, name: "let's chat", t: "Renewed. PDF receipt sent.", time: "10:25" },
];

const HeroPhoneScreen = () => (
  <div className="relative h-full w-full overflow-hidden">
    <div className="flex items-center gap-2 border-b border-white/5 bg-[#0e1117]/95 px-3 py-2.5">
      <div className="h-7 w-7 rounded-full bg-gradient-to-br from-accent to-accent-deep flex items-center justify-center text-[10px] font-bold text-[#042311]">
        LC
      </div>
      <div className="flex-1">
        <div className="text-[11.5px] font-medium text-ink-100">let&apos;s chat — Inbox</div>
        <div className="flex items-center gap-1 text-[9.5px] text-accent">
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          12,481 live conversations
        </div>
      </div>
      <Icons.Filter size={14} className="text-ink-300" />
    </div>

    <div className="relative h-[calc(100%-42px)] overflow-hidden bg-[#0a0c10]">
      <div
        className="absolute inset-x-0 top-0 flex flex-col gap-2 px-3 py-3"
        style={{ animation: "hero-stream 24s linear infinite" }}
      >
        {[...heroMessages, ...heroMessages, ...heroMessages].map((m, i) => (
          <div key={i} className="flex flex-col gap-0.5">
            <div className="text-[9.5px] text-ink-400 px-1 font-mono uppercase tracking-wider">
              {m.name}
            </div>
            <Bubble from={m.f} time={m.time}>
              {m.t}
            </Bubble>
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-[#0a0c10] to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0a0c10] to-transparent" />
    </div>
  </div>
);

// 3D perspective floor grid receding behind the phone
const PerspectiveFloor = ({ parallax }: { parallax: { x: number; y: number } }) => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
    <div
      className="absolute left-1/2 top-[68%] h-[700px] w-[160vw] -translate-x-1/2"
      style={{
        transform: `translateX(-50%) rotateX(${66 + parallax.y * 1.5}deg) rotateZ(${parallax.x * 1.2}deg)`,
        transformOrigin: "50% 0%",
        backgroundImage:
          "linear-gradient(to right, rgba(37,211,102,0.10) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)",
        backgroundSize: "64px 64px, 64px 64px",
        maskImage: "radial-gradient(60% 60% at 50% 0%, #000 30%, transparent 80%)",
        WebkitMaskImage: "radial-gradient(60% 60% at 50% 0%, #000 30%, transparent 80%)",
        transition: "transform .3s ease-out",
      }}
    />
  </div>
);

// 8-card conversation deck flanking the phone — uniform orientation
type MsgCard = { kind: "msg"; who: string; msg: string; tick?: boolean };
type MetricCard = { kind: "metric"; label: string; big: string; sub: string };
type ChartCard = { kind: "chart"; label: string; val: string; spark: number[] };
type FlowCard = { kind: "flow"; label: string; steps: string[] };
type BadgeCard = { kind: "badge"; label: string; sub: string };
type DeckCard = (MsgCard | MetricCard | ChartCard | FlowCard | BadgeCard) & {
  dx: number;
  dy: number;
  dz: number;
  rot: number;
  w: number;
};

const deckCards: DeckCard[] = [
  // Left column — dx = -450 (cards grow rightward from their anchor, so this pushes the right edges close to the phone)
  { kind: "msg", who: "Naturals · Spa", msg: "Booked! See you Sat 11:30", tick: true, dx: -450, dy: -170, dz: 0, rot: 0, w: 210 },
  { kind: "metric", label: "Messages · 24h", big: "412,808", sub: "+18% vs yest", dx: -450, dy: -20, dz: 0, rot: 0, w: 210 },
  { kind: "msg", who: "BITS Admissions", msg: "Counsellor call at 4pm", tick: false, dx: -450, dy: 130, dz: 0, rot: 0, w: 210 },
  { kind: "flow", label: "Salon flow · live", steps: ["Service ✓", "Stylist ✓", "Payment …"], dx: -450, dy: 270, dz: 0, rot: 0, w: 210 },
  // Right column — dx = 240
  { kind: "msg", who: "Hyundai Service", msg: "₹4,200 paid ✓", tick: true, dx: 240, dy: -170, dz: 0, rot: 0, w: 210 },
  { kind: "chart", label: "Read rate", val: "87.4%", spark: [20, 28, 22, 38, 34, 52, 46, 58], dx: 240, dy: -20, dz: 0, rot: 0, w: 210 },
  { kind: "msg", who: "Apollo Clinic", msg: "Pre-visit form sent →", tick: true, dx: 240, dy: 130, dz: 0, rot: 0, w: 210 },
  { kind: "badge", label: "Reply auto-routed", sub: "avg 0.4s", dx: 240, dy: 270, dz: 0, rot: 0, w: 210 },
];

const ConversationDeck = ({ parallax }: { parallax: { x: number; y: number } }) => (
  <div
    className="pointer-events-none absolute inset-0 hidden md:flex items-center justify-center"
    aria-hidden="true"
  >
    <div
      className="relative"
      style={{
        transformStyle: "preserve-3d",
        transform: `rotateX(${6 + parallax.y * 2}deg) rotateY(${parallax.x * 3}deg)`,
        transition: "transform .3s ease-out",
      }}
    >
      {deckCards.map((c, i) => {
        const style: CSSProperties = {
          width: c.w,
          transform: `translate3d(${c.dx + parallax.x * (Math.abs(c.dz) / 8)}px, ${c.dy + parallax.y * (Math.abs(c.dz) / 10)}px, ${c.dz}px) rotateZ(${c.rot}deg)`,
          transition: "transform .3s ease-out",
        };
        return (
          <div
            key={i}
            className="absolute rounded-2xl bg-[#11141a]/90 backdrop-blur-md ring-1 ring-white/10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] px-3.5 py-2.5"
            style={style}
          >
            {c.kind === "msg" && (
              <>
                <div className="flex items-center justify-between text-[10.5px] text-ink-400 font-mono uppercase tracking-wider">
                  <span>{c.who}</span>
                  {c.tick && <span className="text-accent">✓✓</span>}
                </div>
                <div className="mt-1 text-[12.5px] text-ink-100 leading-snug">{c.msg}</div>
              </>
            )}
            {c.kind === "metric" && (
              <>
                <div className="text-[10px] text-ink-400 font-mono uppercase tracking-wider">
                  {c.label}
                </div>
                <div className="mt-1 font-display text-[22px] tracking-tight text-ink-100">
                  {c.big}
                </div>
                <div className="text-[10.5px] text-accent">{c.sub}</div>
              </>
            )}
            {c.kind === "chart" && (
              <>
                <div className="flex items-center justify-between">
                  <div className="text-[10px] text-ink-400 font-mono uppercase tracking-wider">
                    {c.label}
                  </div>
                  <div className="text-[12px] text-accent font-medium">{c.val}</div>
                </div>
                <svg viewBox="0 0 100 28" className="mt-2 w-full h-7" preserveAspectRatio="none">
                  <polyline
                    points={c.spark
                      .map(
                        (v, j) =>
                          `${j * (100 / (c.spark.length - 1))},${28 - (v / 60) * 24}`,
                      )
                      .join(" ")}
                    fill="none"
                    stroke="#25D366"
                    strokeWidth="1.6"
                  />
                </svg>
              </>
            )}
            {c.kind === "flow" && (
              <>
                <div className="text-[10px] text-ink-400 font-mono uppercase tracking-wider">
                  {c.label}
                </div>
                <div className="mt-1.5 space-y-1 text-[11.5px] text-ink-100">
                  {c.steps.map((s, j) => (
                    <div key={j} className="flex items-center gap-1.5">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          s.includes("…") ? "bg-accent animate-pulse" : "bg-accent"
                        }`}
                      />
                      {s}
                    </div>
                  ))}
                </div>
              </>
            )}
            {c.kind === "badge" && (
              <>
                <div className="flex items-center gap-1.5 text-[11px] text-ink-100">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  {c.label}
                </div>
                <div className="text-[10.5px] text-ink-400 font-mono mt-0.5">{c.sub}</div>
              </>
            )}
          </div>
        );
      })}
    </div>
  </div>
);

export const Hero = () => {
  const parallax = useMouseParallax(1);
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const on = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const phoneRY = -22 + parallax.x * 4;
  const phoneRX = 14 + parallax.y * 3 - Math.min(28, scrollY * 0.04);

  return (
    <section
      className="relative isolate overflow-hidden pt-32 pb-24 sm:pt-36 sm:pb-40"
      style={{ perspective: "1800px" }}
    >
      <div className="pointer-events-none absolute inset-0 dot-grid opacity-40 [mask-image:radial-gradient(60%_50%_at_50%_30%,#000_30%,transparent_80%)]" />
      <PerspectiveFloor parallax={parallax} />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="flex justify-center">
          <a
            href="#"
            className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[12px] text-ink-200 hover:bg-white/[0.06] transition"
          >
            <span className="rounded-full bg-accent/15 px-1.5 py-[1px] text-[10px] font-mono uppercase tracking-wider text-accent">
              new
            </span>
            Service Automation 2.0 — multi-step flows &amp; live agent handoff
            <Icons.Arrow size={12} stroke={2} />
          </a>
        </div>

        <div className="mx-auto mt-7 max-w-4xl text-center">
          <h1 className="font-display text-[clamp(2.8rem,7vw,6.4rem)] leading-[0.92] tracking-[-0.045em] text-balance">
            <span className="text-gradient">Your entire business.</span>
            <br />
            <span className="text-gradient">Running on </span>
            <span className="font-serif-it text-accent-grad">WhatsApp</span>
            <span className="text-gradient">.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-[clamp(1rem,1.25vw,1.18rem)] leading-[1.55] text-ink-300 text-pretty">
            Run campaigns, automate services and send intelligent reminders — all from one
            cinematic admin portal. The platform 50,000+ ops teams use to turn conversations into
            revenue.
          </p>
          <div className="mt-9 flex items-center justify-center gap-3">
            <a
              href="#cta"
              className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-[14px] font-medium btn-accent transition"
            >
              Book a demo <Icons.Arrow size={14} stroke={2.2} />
            </a>
            <a
              href="#"
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-medium btn-ghost transition"
            >
              <Icons.Play size={12} stroke={2} /> Start free trial
            </a>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[12px] text-ink-400">
            <span className="inline-flex items-center gap-1.5">
              <Icons.Check size={12} className="text-accent" /> Free 14-day trial
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icons.Check size={12} className="text-accent" /> No credit card
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icons.Check size={12} className="text-accent" /> Meta-verified BSP
            </span>
          </div>
        </div>

        <div
          className="relative mt-16 flex items-center justify-center"
          style={{ perspective: "1600px" }}
        >
          <ConversationDeck parallax={parallax} />

          <div
            className="relative"
            style={{
              transformStyle: "preserve-3d",
              transform: `rotateX(${phoneRX}deg) rotateY(${phoneRY}deg)`,
              transition: "transform .15s linear",
            }}
          >
            <div
              className="relative h-[560px] w-[280px] rounded-[44px] bg-gradient-to-b from-ink-700 to-ink-900 p-[6px] shadow-[0_60px_120px_-30px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.04)]"
              style={{ transformStyle: "preserve-3d" }}
            >
              <div
                className="pointer-events-none absolute -inset-10 -z-10 rounded-[60px]"
                style={{
                  background:
                    "radial-gradient(closest-side, rgba(37,211,102,0.06), transparent 70%)",
                }}
              />
              <div
                className="relative h-full w-full overflow-hidden rounded-[38px] bg-[#050608]"
                style={{ transform: "translateZ(20px)" }}
              >
                <div className="absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-black ring-soft" />
                <HeroPhoneScreen />
              </div>
              <div className="absolute -right-[3px] top-28 h-14 w-[3px] rounded-r bg-ink-600" />
            </div>
            <div
              className="absolute -bottom-12 left-1/2 -z-10 h-12 w-[300px] -translate-x-1/2 rounded-[50%] blur-2xl"
              style={{
                background: "radial-gradient(closest-side, rgba(0,0,0,0.7), transparent 70%)",
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
