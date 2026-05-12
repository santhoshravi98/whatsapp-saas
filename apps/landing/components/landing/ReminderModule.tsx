"use client";

import { useRef } from "react";
import { Icons } from "./Icons";
import { BigHeading, Reveal, Scroll3D, SectionLabel, Sub } from "./Primitives";
import { useCountUp, useScrollProgress } from "./hooks";

type ReminderStatus = "sent" | "replied" | "paid";

const reminders: {
  d: number;
  who: string;
  veh: string;
  kind: string;
  amt: string;
  status: ReminderStatus;
}[] = [
  { d: 1, who: "Ramesh K.", veh: "Creta · KA01·8821", kind: "Service due", amt: "₹4,200", status: "sent" },
  { d: 3, who: "Priya N.", veh: "i20 · TN10·4471", kind: "Insurance renew", amt: "₹14,800", status: "sent" },
  { d: 7, who: "Arjun M.", veh: "Verna · MH02·1190", kind: "Test drive", amt: "free", status: "replied" },
  { d: 12, who: "Sneha P.", veh: "Venue · DL01·3309", kind: "EMI due", amt: "₹18,420", status: "paid" },
  { d: 18, who: "Faisal R.", veh: "Tucson · KL07·2200", kind: "Warranty exp.", amt: "—", status: "sent" },
  { d: 24, who: "Manish S.", veh: "Aura · GJ05·9091", kind: "Service due", amt: "₹3,800", status: "replied" },
  { d: 27, who: "Lavanya G.", veh: "Exter · KA03·1187", kind: "Insurance renew", amt: "₹9,400", status: "paid" },
];

const lanes = ["Service", "Insurance", "Test drive", "EMI", "Warranty"];

const statusClr = (s: ReminderStatus) =>
  ({
    sent: "text-ink-300 bg-white/5",
    replied: "text-accent bg-accent/10",
    paid: "text-[#6cf09e] bg-accent/15",
  })[s];

export const ReminderModule = () => {
  const ref = useRef<HTMLElement>(null);
  const p = useScrollProgress(ref);

  const reveal = Math.min(1, Math.max(0, (p - 0.15) * 1.4));
  const days = 30;
  const sweep = Math.min(days, Math.floor(reveal * days));

  const active = p > 0.4;
  const sent = useCountUp(8421, active, 1800);
  const collected = useCountUp(2840000, active, 2200);
  const bookings = useCountUp(1942, active, 2000);

  return (
    <section id="reminder" ref={ref} className="relative py-28 sm:py-36 border-t hairline">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <SectionLabel num="03" label="Reminder Management" />
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
            <div className="lg:col-span-7">
              <BigHeading>
                The follow-up that
                <br />
                <span className="font-serif-it text-accent-grad">always happens.</span>
              </BigHeading>
            </div>
            <div className="lg:col-span-5">
              <Sub>
                Service dues, insurance renewals, EMI deadlines, warranties, periodic check-ins. We
                schedule, send, and escalate — your team only sees the replies that matter.
              </Sub>
            </div>
          </div>
        </Reveal>

        <div
          className="mt-14 grid grid-cols-1 lg:grid-cols-12 gap-6"
          style={{ perspective: "2000px", perspectiveOrigin: "50% 30%" }}
        >
          <div className="lg:col-span-8">
            <Scroll3D className="glass rounded-2xl p-4 sm:p-5" intensity={0.55} lift={0.6}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-[12px] text-ink-200">
                  <Icons.Car size={14} className="text-accent" /> Hyundai · Bengaluru West · May
                  2026
                </div>
                <div className="flex items-center gap-3 text-[11px] text-ink-400">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-1.5 w-3 rounded-sm bg-white/10" />
                    scheduled
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-1.5 w-3 rounded-sm bg-accent/40" />
                    sent
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-1.5 w-3 rounded-sm bg-accent" />
                    converted
                  </span>
                </div>
              </div>

              <div
                className="grid gap-1 text-[9px] text-ink-500 font-mono"
                style={{ gridTemplateColumns: "repeat(30, minmax(0, 1fr))" }}
              >
                {Array.from({ length: days }).map((_, i) => (
                  <div key={i} className="text-center">
                    {i + 1}
                  </div>
                ))}
              </div>

              <div className="mt-1 space-y-1">
                {lanes.map((lane) => (
                  <div key={lane} className="flex items-center gap-2">
                    <div className="w-16 text-[10.5px] text-ink-400 font-mono uppercase tracking-wider">
                      {lane}
                    </div>
                    <div
                      className="grid flex-1 gap-1"
                      style={{ gridTemplateColumns: "repeat(30, minmax(0, 1fr))" }}
                    >
                      {Array.from({ length: days }).map((_, i) => {
                        const r = reminders.find(
                          (rm) =>
                            rm.d === i + 1 &&
                            rm.kind.toLowerCase().includes(lane.toLowerCase().split(" ")[0]),
                        );
                        const revealed = i < sweep;
                        const bg = r
                          ? revealed
                            ? r.status === "paid"
                              ? "#25D366"
                              : r.status === "replied"
                                ? "rgba(37,211,102,0.45)"
                                : "rgba(37,211,102,0.22)"
                            : "rgba(255,255,255,0.06)"
                          : "rgba(255,255,255,0.03)";
                        return (
                          <div
                            key={i}
                            className="h-6 rounded-sm relative transition-all"
                            style={{ background: bg, transitionDelay: `${i * 15}ms` }}
                          >
                            {r && revealed && (
                              <div className="absolute inset-0 grid place-items-center text-[9px] text-[#042311] font-medium">
                                {r.status === "paid" ? "✓" : r.status === "replied" ? "↩" : "→"}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="relative mt-3 h-1">
                <div className="absolute inset-0 rounded-full bg-white/5" />
                <div
                  className="absolute top-0 h-1 rounded-full bg-accent transition-all duration-300"
                  style={{
                    width: `${(sweep / days) * 100}%`,
                    boxShadow: "0 0 12px rgba(37,211,102,0.6)",
                  }}
                />
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-white/[0.03] p-3 ring-soft">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-ink-400">
                    Reminders this month
                  </div>
                  <div className="font-display text-[26px] tracking-tight">
                    {Math.round(sent).toLocaleString()}
                  </div>
                </div>
                <div className="rounded-xl bg-white/[0.03] p-3 ring-soft">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-ink-400">
                    ₹ recovered
                  </div>
                  <div className="font-display text-[26px] tracking-tight text-accent">
                    {(Math.round(collected) / 100000).toFixed(1)}L
                  </div>
                </div>
                <div className="rounded-xl bg-white/[0.03] p-3 ring-soft">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-ink-400">
                    Bookings
                  </div>
                  <div className="font-display text-[26px] tracking-tight">
                    {Math.round(bookings).toLocaleString()}
                  </div>
                </div>
              </div>
            </Scroll3D>
          </div>

          <div className="lg:col-span-4">
            <div className="glass rounded-2xl p-3 h-full">
              <div className="flex items-center justify-between px-1 py-1.5">
                <div className="text-[11px] font-mono uppercase tracking-wider text-ink-300">
                  Live · reminder feed
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] text-accent">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                  streaming
                </span>
              </div>
              <div className="mt-2 space-y-1.5 max-h-[460px] overflow-hidden">
                {reminders.map((r, i) => {
                  const shown = i <= sweep / 4;
                  return (
                    <div
                      key={i}
                      className={`rounded-lg border border-white/5 bg-white/[0.02] p-2.5 transition-all duration-500 ${
                        shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                      }`}
                      style={{ transitionDelay: `${i * 120}ms` }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-[12px] text-ink-100">{r.who}</div>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-mono ${statusClr(r.status)}`}
                        >
                          {r.status}
                        </span>
                      </div>
                      <div className="text-[10.5px] text-ink-400 font-mono">{r.veh}</div>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-[11px] text-ink-200">{r.kind}</span>
                        <span className="text-[11px] text-accent">{r.amt}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
