"use client";

import { useRef } from "react";
import { Icons } from "./Icons";
import { BigHeading, Bubble, Pill, Reveal, Scroll3D, SectionLabel, Sub } from "./Primitives";
import { useCountUp, useScrollProgress } from "./hooks";

const steps = [
  { i: "Audience", d: "Filter by lifecycle, geography, last seen, custom tags." },
  { i: "Template", d: "Meta-approved templates with dynamic variables." },
  { i: "Schedule", d: "Per-timezone send windows. Throttle to inbox quotas." },
  { i: "Launch", d: "Live progress · circuit-breakers · pause & resume." },
  { i: "Analyse", d: "Drill into replies, ROI, conversions, opt-outs." },
];

const audienceTags = [
  "Lapsed > 60d",
  "City = Bengaluru",
  "Tag · spa-customer",
  "Spend > ₹3,000",
  "Opted-in",
];

const featureRow = [
  ["Per-timezone", Icons.Globe],
  ["Drip throttle", Icons.Filter],
  ["Read receipts", Icons.Eye],
  ["Reply auto-route", Icons.Inbox],
] as const;

export const BulkModule = () => {
  const ref = useRef<HTMLElement>(null);
  const p = useScrollProgress(ref);
  const stage = Math.min(5, Math.floor(p * 6));

  const counterActive = stage >= 4;
  const sent = useCountUp(412808, counterActive, 2200);
  const delivered = useCountUp(407232, counterActive, 2200);
  const read = useCountUp(360841, counterActive, 2400);
  const replies = useCountUp(28492, counterActive, 2600);

  return (
    <section id="bulk" ref={ref} className="relative py-28 sm:py-36 border-t hairline">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <SectionLabel num="01" label="Bulk Messaging" />
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
            <div className="lg:col-span-7">
              <BigHeading>
                Send a million messages.
                <br />
                <span className="font-serif-it text-accent-grad">Like you wrote each one.</span>
              </BigHeading>
            </div>
            <div className="lg:col-span-5">
              <Sub>
                Build segments from any signal. Personalise with custom variables. Schedule across
                time zones. Watch delivery, read and reply rates animate in real time.
              </Sub>
            </div>
          </div>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 lg:sticky lg:top-24 self-start">
            <ol className="relative space-y-3">
              <div className="step-line" />
              {steps.map((s, i) => {
                const active = stage >= i + 1;
                const current = stage === i + 1 || (stage === 5 && i === 4);
                return (
                  <li key={s.i} className="relative pl-10">
                    <span
                      className={`absolute left-2.5 top-2 grid h-5 w-5 place-items-center rounded-full text-[10px] font-mono transition ${
                        active
                          ? "bg-accent text-[#042311]"
                          : "bg-white/5 text-ink-400 ring-1 ring-white/10"
                      }`}
                    >
                      {active ? <Icons.Check size={11} stroke={2.6} /> : i + 1}
                    </span>
                    <div
                      className={`rounded-xl border p-3.5 transition ${
                        current
                          ? "border-accent/40 bg-accent/[0.05]"
                          : active
                            ? "border-white/10 bg-white/[0.02]"
                            : "border-white/5 bg-white/[0.01]"
                      }`}
                    >
                      <div
                        className={`text-[14px] font-medium ${
                          current ? "text-white" : active ? "text-ink-100" : "text-ink-300"
                        }`}
                      >
                        {s.i}
                      </div>
                      <div className="text-[12px] text-ink-400 mt-0.5">{s.d}</div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          <div
            className="lg:col-span-8"
            style={{ perspective: "1800px", perspectiveOrigin: "50% 30%" }}
          >
            <Scroll3D className="glass rounded-2xl p-2 sm:p-3" intensity={0.6} lift={0.6}>
              <div className="flex items-center justify-between px-3 py-2 border-b hairline">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
                    <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
                    <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
                  </div>
                  <div className="text-[11.5px] text-ink-300 ml-2 font-mono">
                    campaigns / new — &ldquo;Diwali Spa Offer&rdquo;
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-ink-300">
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        stage >= 4 ? "bg-accent animate-pulse" : "bg-ink-500"
                      }`}
                    />
                    {stage >= 4 ? "LIVE" : "DRAFT"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 p-3">
                <div
                  className={`md:col-span-3 rounded-xl border p-4 transition ${
                    stage >= 1
                      ? "border-accent/30 bg-white/[0.02]"
                      : "border-white/5 bg-white/[0.01] opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-ink-300">
                      Audience
                    </div>
                    <div className="text-[11px] text-accent">
                      {stage >= 1 ? "432,108 contacts" : "select filters"}
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {audienceTags.map((t, i) => (
                      <span
                        key={t}
                        className={`rounded-md px-2 py-1 text-[11px] transition-all ${
                          stage >= 1
                            ? "bg-accent/10 text-accent ring-1 ring-accent/30"
                            : "bg-white/5 text-ink-400"
                        }`}
                        style={{ transitionDelay: `${i * 60}ms` }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 grid grid-cols-12 gap-1 h-12 items-end">
                    {Array.from({ length: 12 }).map((_, i) => {
                      const h = 10 + Math.abs(Math.sin(i * 0.9)) * 70;
                      return (
                        <div
                          key={i}
                          className="rounded-sm transition-all"
                          style={{
                            height: stage >= 1 ? `${h}%` : "8%",
                            background:
                              stage >= 1
                                ? "linear-gradient(180deg, #25D366, #128c7e)"
                                : "rgba(255,255,255,0.06)",
                            transitionDelay: `${i * 40}ms`,
                          }}
                        />
                      );
                    })}
                  </div>
                </div>

                <div
                  className={`md:col-span-2 rounded-xl border p-4 transition ${
                    stage >= 2
                      ? "border-accent/30 bg-white/[0.02]"
                      : "border-white/5 bg-white/[0.01] opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-ink-300">
                      Template
                    </div>
                    <Pill className="!px-1.5 !py-0.5 !text-[10px]">approved</Pill>
                  </div>
                  <div className="mt-3 rounded-lg bg-[#0a0c10] p-3 space-y-1.5">
                    <Bubble from="me" time="now" read={false}>
                      Hi <span className="text-accent">{"{{name}}"}</span>! Diwali at Naturals 🪔
                      <br />
                      Get 30% off any spa above ₹2,000.
                      <br />
                      Book → naturals.in/{"{{coupon}}"}
                    </Bubble>
                    <div className="text-[10px] text-ink-400 font-mono px-1">2 vars · 1 button</div>
                  </div>
                </div>

                <div
                  className={`md:col-span-2 rounded-xl border p-4 transition ${
                    stage >= 3
                      ? "border-accent/30 bg-white/[0.02]"
                      : "border-white/5 bg-white/[0.01] opacity-60"
                  }`}
                >
                  <div className="text-[11px] font-mono uppercase tracking-wider text-ink-300">
                    Schedule
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-[13px] text-ink-100">
                    <Icons.Calendar size={14} className="text-accent" /> Sat · 11 May · 10:30 IST
                  </div>
                  <div className="mt-1 text-[11px] text-ink-400">
                    Per-timezone delivery · 80k/hr throttle
                  </div>
                  <div className="mt-3 flex gap-1">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex-1 h-6 rounded-sm"
                        style={{
                          background:
                            stage >= 3 && i >= 9 && i <= 21
                              ? `rgba(37,211,102,${0.18 + Math.sin(i * 0.5) * 0.18 + 0.4})`
                              : "rgba(255,255,255,0.04)",
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div
                  className={`md:col-span-3 rounded-xl border p-4 transition ${
                    stage >= 4
                      ? "border-accent/30 bg-white/[0.02]"
                      : "border-white/5 bg-white/[0.01] opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-ink-300">
                      Live results
                    </div>
                    <div className="text-[10px] text-accent font-mono">
                      UPDATING · {stage >= 5 ? "final" : "streaming"}
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {[
                      { l: "Sent", v: sent, c: "#e8eaed" },
                      { l: "Delivered", v: delivered, c: "#c7ccd4" },
                      { l: "Read", v: read, c: "#25D366" },
                      { l: "Replies", v: replies, c: "#6cf09e" },
                    ].map((m) => (
                      <div key={m.l} className="rounded-lg bg-white/[0.03] p-2">
                        <div className="text-[10px] text-ink-400 font-mono uppercase tracking-wider">
                          {m.l}
                        </div>
                        <div
                          className="font-display text-[18px] tracking-tight"
                          style={{ color: m.c }}
                        >
                          {Math.round(m.v).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                  <svg viewBox="0 0 300 60" className="mt-3 w-full h-14" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="bulkg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="#25D366" stopOpacity="0.5" />
                        <stop offset="1" stopColor="#25D366" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {(() => {
                      const visible = stage >= 4 ? Math.min(1, (p - 0.55) * 4) : 0;
                      const cutoff = visible * 40;
                      const pts = Array.from({ length: 40 }).map((_, i) => {
                        const x = (i / 39) * 300;
                        const y = i < cutoff ? 50 - Math.sin(i * 0.6) * 8 - i * 0.5 : 55;
                        return `${x},${y}`;
                      });
                      return (
                        <g>
                          <polyline points={pts.join(" ")} fill="none" stroke="#25D366" strokeWidth="1.6" />
                          <polygon points={`0,60 ${pts.join(" ")} 300,60`} fill="url(#bulkg)" />
                        </g>
                      );
                    })()}
                  </svg>
                </div>
              </div>
            </Scroll3D>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-[12px] text-ink-300">
              {featureRow.map(([t, I]) => (
                <div
                  key={t}
                  className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 flex items-center gap-2"
                >
                  <I size={13} className="text-accent" /> {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
