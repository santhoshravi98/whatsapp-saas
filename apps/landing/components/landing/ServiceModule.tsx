"use client";

import { useEffect, useRef, useState } from "react";
import { Icons } from "./Icons";
import { BigHeading, Bubble, Reveal, Scroll3D, SectionLabel, Sub } from "./Primitives";
import { useScrollProgress } from "./hooks";

type FlowMsg = {
  who: "them" | "bot";
  msg: string;
  t: string;
  chips?: string[];
  pay?: boolean;
};

type Industry = {
  label: string;
  Icon: (props: { size?: number; className?: string }) => JSX.Element;
  flow: FlowMsg[];
};

const industries: Record<"salon" | "admissions" | "clinic", Industry> = {
  salon: {
    label: "Naturals Salon",
    Icon: Icons.Scissors,
    flow: [
      { who: "them", msg: "Hey, what slots are open today?", t: "11:02" },
      {
        who: "bot",
        msg: "Hi Anjali! Please pick a service:",
        t: "11:02",
        chips: ["Haircut · ₹600", "Hair Spa · ₹2,400", "Keratin · ₹6,500"],
      },
      { who: "them", msg: "Hair Spa", t: "11:03" },
      { who: "bot", msg: "Pick a stylist:", t: "11:03", chips: ["Ravi", "Meera", "Akhil"] },
      { who: "them", msg: "Meera", t: "11:03" },
      {
        who: "bot",
        msg: "Available slots today:",
        t: "11:03",
        chips: ["2:00 PM", "4:30 PM", "6:00 PM"],
      },
      { who: "them", msg: "4:30 PM", t: "11:04" },
      { who: "bot", msg: "Confirm & pay ₹2,400 to lock the slot →", t: "11:04", pay: true },
      { who: "them", msg: "Paid ✓", t: "11:04" },
      {
        who: "bot",
        msg: "Booked! Reminder 1hr before. Want to add a manicure?",
        t: "11:04",
        chips: ["Yes (+₹500)", "No"],
      },
    ],
  },
  admissions: {
    label: "College Admissions",
    Icon: Icons.Cap,
    flow: [
      { who: "them", msg: "Need info on B.Tech CSE.", t: "09:14" },
      {
        who: "bot",
        msg: "Welcome! What's your 12th board %?",
        t: "09:14",
        chips: ["<70%", "70–85%", ">85%"],
      },
      { who: "them", msg: ">85%", t: "09:15" },
      {
        who: "bot",
        msg: "You're eligible for our merit pathway. Pick a counsellor slot:",
        t: "09:15",
        chips: ["Today · 6 PM", "Tomorrow · 11 AM", "Sat · 4 PM"],
      },
      { who: "them", msg: "Today · 6 PM", t: "09:16" },
      {
        who: "bot",
        msg: "Sending brochure + scholarship details. Pay ₹500 to confirm interview slot.",
        t: "09:16",
        pay: true,
      },
      { who: "them", msg: "Paid ✓", t: "09:17" },
      {
        who: "bot",
        msg: "Slot locked. Meet link sent. Any docs you'd like reviewed?",
        t: "09:17",
        chips: ["SOP", "Marksheet", "Both"],
      },
    ],
  },
  clinic: {
    label: "Apollo Clinic",
    Icon: Icons.Spark,
    flow: [
      { who: "them", msg: "Need a derma appointment.", t: "14:21" },
      {
        who: "bot",
        msg: "Hi Karthik. Symptom?",
        t: "14:21",
        chips: ["Acne", "Hair fall", "Skin allergy"],
      },
      { who: "them", msg: "Acne", t: "14:22" },
      {
        who: "bot",
        msg: "Dr. Reema · Tue/Thu/Sat. Pick a slot:",
        t: "14:22",
        chips: ["Tue 11 AM", "Thu 5 PM", "Sat 10 AM"],
      },
      { who: "them", msg: "Thu 5 PM", t: "14:23" },
      { who: "bot", msg: "Consultation fee ₹800. Pay to confirm.", t: "14:23", pay: true },
      { who: "them", msg: "Paid ✓", t: "14:23" },
      {
        who: "bot",
        msg: "Booked! Pre-visit form sent. Reminder 2hr before.",
        t: "14:24",
      },
    ],
  },
};

type FlowKind = keyof typeof industries;

const nodesByIndustry: Record<
  FlowKind,
  { id: string; x: number; y: number; label: string; t: string }[]
> = {
  salon: [
    { id: "trig", x: 50, y: 30, label: "Trigger · message in", t: "trigger" },
    { id: "serv", x: 230, y: 30, label: "Ask service", t: "ask" },
    { id: "styl", x: 410, y: 30, label: "Ask stylist", t: "ask" },
    { id: "slot", x: 410, y: 140, label: "Ask slot", t: "ask" },
    { id: "pay", x: 230, y: 140, label: "Razorpay link", t: "pay" },
    { id: "conf", x: 50, y: 140, label: "Confirm + reminder", t: "send" },
    { id: "upsell", x: 50, y: 250, label: "Upsell · manicure", t: "branch" },
    { id: "crm", x: 230, y: 250, label: "Write CRM", t: "crm" },
    { id: "rem", x: 410, y: 250, label: "Schedule reminder", t: "wait" },
  ],
  admissions: [
    { id: "trig", x: 50, y: 30, label: "Trigger · inquiry", t: "trigger" },
    { id: "score", x: 230, y: 30, label: "Qualify · 12th %", t: "ask" },
    { id: "br", x: 410, y: 30, label: "Branch · score", t: "branch" },
    { id: "counsel", x: 410, y: 140, label: "Book counsellor", t: "ask" },
    { id: "pay", x: 230, y: 140, label: "Pay ₹500 hold", t: "pay" },
    { id: "broch", x: 50, y: 140, label: "Send brochure", t: "send" },
    { id: "crm", x: 50, y: 250, label: "CRM · lead score", t: "crm" },
    { id: "meet", x: 230, y: 250, label: "Generate meet link", t: "send" },
    { id: "rev", x: 410, y: 250, label: "Doc review queue", t: "wait" },
  ],
  clinic: [
    { id: "trig", x: 50, y: 30, label: "Trigger · appt request", t: "trigger" },
    { id: "sym", x: 230, y: 30, label: "Ask symptom", t: "ask" },
    { id: "doc", x: 410, y: 30, label: "Assign doctor", t: "branch" },
    { id: "slot", x: 410, y: 140, label: "Ask slot", t: "ask" },
    { id: "pay", x: 230, y: 140, label: "Pay ₹800 fee", t: "pay" },
    { id: "form", x: 50, y: 140, label: "Send pre-visit form", t: "send" },
    { id: "crm", x: 50, y: 250, label: "CRM · patient", t: "crm" },
    { id: "rem", x: 230, y: 250, label: "Reminder · 2h", t: "wait" },
    { id: "follow", x: 410, y: 250, label: "Follow-up · D+7", t: "wait" },
  ],
};

const edges: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 8],
];

const colorFor = (t: string) =>
  ({
    trigger: "#6cf09e",
    ask: "#25D366",
    branch: "#b8a4ff",
    pay: "#ffd66c",
    send: "#7cc9ff",
    crm: "#ff8fb3",
    wait: "#8b94a3",
  })[t] ?? "#fff";

const FlowGraph = ({ industry, progress }: { industry: FlowKind; progress: number }) => {
  const ns = nodesByIndustry[industry];
  const visibleSteps = Math.ceil(progress * ns.length);

  return (
    <svg viewBox="0 0 520 320" className="w-full h-full">
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {edges.map(([a, b], i) => {
        const A = ns[a];
        const B = ns[b];
        if (!A || !B) return null;
        const active = visibleSteps > b;
        const x1 = A.x + 70;
        const y1 = A.y + 22;
        const x2 = B.x + 0;
        const y2 = B.y + 22;
        const cx = (x1 + x2) / 2;
        return (
          <path
            key={i}
            d={`M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`}
            fill="none"
            stroke={active ? "#25D366" : "rgba(255,255,255,0.08)"}
            strokeWidth={active ? 1.5 : 1}
            strokeDasharray={active ? "0" : "3 3"}
            style={{ transition: "stroke .4s" }}
          />
        );
      })}
      {ns.map((n, i) => {
        const active = visibleSteps > i;
        const current = visibleSteps === i + 1;
        const c = colorFor(n.t);
        return (
          <g
            key={n.id}
            transform={`translate(${n.x},${n.y})`}
            style={{ opacity: i < visibleSteps + 2 ? 1 : 0.35, transition: "opacity .4s" }}
          >
            <rect
              width="140"
              height="44"
              rx="10"
              fill={active ? "rgba(37,211,102,0.08)" : "rgba(255,255,255,0.03)"}
              stroke={active ? c : "rgba(255,255,255,0.1)"}
              strokeWidth={current ? 1.6 : 1}
            />
            <circle cx="14" cy="22" r="4" fill={c} filter={current ? "url(#glow)" : ""} />
            <text
              x="26"
              y="20"
              fontSize="9"
              fill="#8b94a3"
              fontFamily="Geist Mono, monospace"
              letterSpacing="0.06em"
            >
              {n.t.toUpperCase()}
            </text>
            <text
              x="26"
              y="33"
              fontSize="10.5"
              fill={active ? "#e8eaed" : "#5a6373"}
              fontFamily="Geist, sans-serif"
            >
              {n.label}
            </text>
            {current && (
              <circle cx="134" cy="22" r="3" fill="#25D366">
                <animate
                  attributeName="opacity"
                  values="0.3;1;0.3"
                  dur="1.2s"
                  repeatCount="indefinite"
                />
              </circle>
            )}
          </g>
        );
      })}
    </svg>
  );
};

export const ServiceModule = () => {
  const ref = useRef<HTMLElement>(null);
  const p = useScrollProgress(ref);
  const [industry, setIndustry] = useState<FlowKind>("salon");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (touched) return;
    if (p > 0.66) setIndustry("admissions");
    else if (p > 0.33) setIndustry("clinic");
    else setIndustry("salon");
  }, [p, touched]);

  const data = industries[industry];

  const local = Math.max(0, Math.min(1, (p - 0.1) / 0.75));
  const visibleCount = Math.ceil(local * data.flow.length);

  return (
    <section
      id="service"
      ref={ref}
      className="relative py-28 sm:py-36 border-t hairline bg-ink-950"
    >
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <SectionLabel num="02" label="Service Automation" />
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
            <div className="lg:col-span-7">
              <BigHeading>
                Drag-and-drop flows.
                <br />
                <span className="font-serif-it text-accent-grad">That close the customer.</span>
              </BigHeading>
            </div>
            <div className="lg:col-span-5">
              <Sub>
                Build the booking, qualification, payment and follow-up flow once — let it run
                forever. Branching logic, conditions, agent handoff, payments and CRM writes, all
                without code.
              </Sub>
            </div>
          </div>
        </Reveal>

        <div className="mt-12 flex flex-wrap items-center gap-2">
          {(Object.entries(industries) as [FlowKind, Industry][]).map(([k, v]) => {
            const I = v.Icon;
            const active = industry === k;
            return (
              <button
                key={k}
                onClick={() => {
                  setTouched(true);
                  setIndustry(k);
                }}
                className={`group inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12.5px] transition ${
                  active
                    ? "bg-accent text-[#042311] glow-accent"
                    : "border border-white/10 bg-white/[0.03] text-ink-200 hover:bg-white/[0.06]"
                }`}
              >
                <I size={13} />
                {v.label}
              </button>
            );
          })}
          <span className="ml-auto hidden sm:inline-flex items-center gap-1.5 text-[11px] text-ink-400">
            <Icons.Bolt size={11} className="text-accent" /> Scroll to play the flow →
          </span>
        </div>

        <div
          className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6"
          style={{ perspective: "2000px", perspectiveOrigin: "50% 30%" }}
        >
          <div className="lg:col-span-7">
            <Scroll3D
              className="glass relative h-[560px] rounded-2xl p-4 overflow-hidden"
              intensity={0.7}
              lift={0.7}
              axis="y"
            >
              <div className="absolute inset-0 dot-grid opacity-30 [mask-image:linear-gradient(180deg,#000,transparent)]" />
              <div className="relative flex items-center justify-between">
                <div className="text-[11px] font-mono uppercase tracking-wider text-ink-300">
                  flow canvas · {data.label.toLowerCase().replace(/\s+/g, "-")}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-accent">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                  running
                </div>
              </div>

              <div className="relative mt-6 h-[470px]">
                <FlowGraph industry={industry} progress={local} />
              </div>
            </Scroll3D>
          </div>

          <div className="lg:col-span-5">
            <Scroll3D
              className="glass rounded-2xl p-2 sm:p-3 h-[560px] overflow-hidden flex flex-col"
              intensity={0.5}
              lift={0.8}
              axis="y"
            >
              <div className="flex items-center gap-2 px-3 py-2 border-b hairline">
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-accent to-accent-deep flex items-center justify-center text-[10px] font-bold text-[#042311]">
                  {data.label
                    .split(" ")
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <div className="flex-1">
                  <div className="text-[12.5px] text-ink-100 font-medium">{data.label}</div>
                  <div className="text-[10px] text-accent flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                    auto-replying
                  </div>
                </div>
                <Icons.Phone size={14} className="text-ink-300" />
              </div>

              <div
                className="relative flex-1 overflow-hidden bg-[#0a0c10]"
                style={{
                  backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><circle cx='2' cy='2' r='1' fill='%23ffffff' fill-opacity='0.03'/></svg>")`,
                }}
              >
                <div className="absolute inset-0 overflow-y-auto px-3 py-3 space-y-2">
                  {data.flow.slice(0, visibleCount).map((m, i) => (
                    <div
                      key={`${industry}-${i}`}
                      className="space-y-1"
                      style={{ animation: "fadeUp .35s ease-out both" }}
                    >
                      <Bubble from={m.who === "them" ? "them" : "me"} time={m.t}>
                        {m.msg}
                      </Bubble>
                      {m.chips && (
                        <div className="flex justify-end gap-1.5 flex-wrap">
                          {m.chips.map((c, j) => (
                            <span
                              key={j}
                              className="rounded-md bg-[#1f3a2a]/70 text-[#a7f3c8] px-2 py-1 text-[10.5px] ring-1 ring-accent/20"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      )}
                      {m.pay && (
                        <div className="flex justify-end">
                          <div className="rounded-lg bg-[#1f3a2a] text-[#e9fbf0] p-2 ring-1 ring-accent/30 w-[210px]">
                            <div className="text-[10px] text-accent font-mono uppercase tracking-wider">
                              Razorpay
                            </div>
                            <div className="text-[12px] mt-1 flex items-center justify-between">
                              <span>Pay now</span>
                              <span className="font-mono">
                                {industry === "salon"
                                  ? "₹2,400"
                                  : industry === "admissions"
                                    ? "₹500"
                                    : "₹800"}
                              </span>
                            </div>
                            <div className="mt-2 rounded bg-accent text-[#042311] px-2 py-1 text-[11px] font-medium text-center">
                              Open secure link →
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {visibleCount < data.flow.length && local > 0 && (
                    <div className="flex items-center gap-1.5 text-ink-400 text-[11px] ml-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-ink-400 animate-pulse" />
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-ink-400 animate-pulse"
                        style={{ animationDelay: ".15s" }}
                      />
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-ink-400 animate-pulse"
                        style={{ animationDelay: ".3s" }}
                      />
                      <span className="ml-1 font-mono">bot typing</span>
                    </div>
                  )}
                </div>
                <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-[#0a0c10] to-transparent" />
              </div>

              <div className="border-t hairline px-3 py-2 text-[11px] text-ink-400 flex items-center justify-between">
                <span className="font-mono">
                  {visibleCount}/{data.flow.length} steps
                </span>
                <span className="inline-flex items-center gap-1 text-accent">
                  <Icons.Bolt size={11} /> avg reply 0.4s
                </span>
              </div>
            </Scroll3D>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
          {(
            [
              [Icons.Layers, "Branching logic", "If/else, regex, custom JS"],
              [Icons.Money, "Payments inline", "Razorpay, Stripe, UPI deep links"],
              [Icons.Users, "Agent handoff", "Live takeover with full context"],
              [Icons.Cog, "CRM writes", "HubSpot, Zoho, Salesforce, webhook"],
            ] as const
          ).map(([I, t, d]) => (
            <div key={t} className="glass rounded-xl p-4">
              <I size={16} className="text-accent" />
              <div className="mt-2 text-[13.5px] text-ink-100">{t}</div>
              <div className="text-[12px] text-ink-400">{d}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
