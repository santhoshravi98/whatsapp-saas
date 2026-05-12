"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { Icons } from "./Icons";
import { BigHeading, Pill, Reveal, Scroll3D, SectionLabel, Sub } from "./Primitives";
import { useScrollProgress } from "./hooks";

type TabId = "overview" | "campaigns" | "automation" | "templates";

const tabs: { id: TabId; label: string; icon: (p: { size?: number; className?: string }) => JSX.Element }[] = [
  { id: "overview", label: "Overview", icon: Icons.Chart },
  { id: "campaigns", label: "Campaigns", icon: Icons.Send },
  { id: "automation", label: "Automation", icon: Icons.Bolt },
  { id: "templates", label: "Templates", icon: Icons.Layers },
];

const StatCard = ({
  label,
  value,
  delta,
  sub,
}: {
  label: string;
  value: string;
  delta?: string;
  sub?: string;
}) => (
  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
    <div className="text-[10.5px] font-mono uppercase tracking-wider text-ink-400">{label}</div>
    <div className="mt-1.5 flex items-end justify-between">
      <div className="font-display text-[24px] tracking-tight">{value}</div>
      {delta && (
        <span
          className={`text-[11px] ${delta.startsWith("-") ? "text-[#ff8fb3]" : "text-accent"}`}
        >
          {delta}
        </span>
      )}
    </div>
    {sub && <div className="text-[10px] text-ink-400 mt-0.5">{sub}</div>}
  </div>
);

const OverviewTab = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <div>
        <div className="text-[18px] text-ink-100">Hi Ankit — here&apos;s today.</div>
        <div className="text-[12px] text-ink-400">Wed · 12 May 2026 · last sync 4s ago</div>
      </div>
      <div className="flex items-center gap-2">
        <Pill>This week</Pill>
        <button className="btn-accent rounded-md px-2.5 py-1 text-[11.5px] font-medium inline-flex items-center gap-1">
          <Icons.Plus size={11} stroke={2.4} /> New campaign
        </button>
      </div>
    </div>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatCard label="Messages sent" value="1.42M" delta="+18%" sub="vs last week" />
      <StatCard label="Read rate" value="87.4%" delta="+2.1%" sub="industry avg 41%" />
      <StatCard label="Conversions" value="₹42.8L" delta="+31%" sub="attributed revenue" />
      <StatCard label="Open inbox" value="318" delta="-12%" sub="needs reply" />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div className="md:col-span-2 rounded-xl border border-white/5 bg-white/[0.02] p-4">
        <div className="flex items-center justify-between">
          <div className="text-[12.5px] text-ink-100">Conversation volume · 14d</div>
          <div className="flex gap-2 text-[10.5px] text-ink-400">
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              outbound
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
              inbound
            </span>
          </div>
        </div>
        <svg viewBox="0 0 480 140" className="mt-3 w-full h-[140px]">
          <defs>
            <linearGradient id="og" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#25D366" stopOpacity="0.5" />
              <stop offset="1" stopColor="#25D366" stopOpacity="0" />
            </linearGradient>
          </defs>
          {(() => {
            const pts1 = Array.from({ length: 14 }).map(
              (_, i) => `${i * 36 + 12},${120 - (40 + Math.sin(i * 0.8) * 22 + (i % 3) * 4)}`,
            );
            const pts2 = Array.from({ length: 14 }).map(
              (_, i) => `${i * 36 + 12},${120 - (18 + Math.cos(i * 0.6) * 10 + (i % 2) * 3)}`,
            );
            return (
              <g>
                <polyline points={pts1.join(" ")} fill="none" stroke="#25D366" strokeWidth="1.6" />
                <polygon
                  points={`12,140 ${pts1.join(" ")} ${12 + 13 * 36},140`}
                  fill="url(#og)"
                />
                <polyline
                  points={pts2.join(" ")}
                  fill="none"
                  stroke="rgba(255,255,255,0.4)"
                  strokeWidth="1.2"
                  strokeDasharray="3 3"
                />
                {pts1.map((pt, i) => {
                  const [x, y] = pt.split(",");
                  return <circle key={i} cx={x} cy={y} r="2" fill="#25D366" />;
                })}
              </g>
            );
          })()}
        </svg>
      </div>
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
        <div className="text-[12.5px] text-ink-100">Top flows</div>
        <div className="mt-3 space-y-2.5">
          {[
            { n: "Salon · booking", v: 92 },
            { n: "Hyundai · service rem.", v: 78 },
            { n: "Admissions · qualify", v: 64 },
            { n: "EMI reminder", v: 51 },
            { n: "Apollo · pre-visit", v: 33 },
          ].map((f) => (
            <div key={f.n}>
              <div className="flex justify-between text-[11px] text-ink-300">
                <span>{f.n}</span>
                <span className="font-mono text-ink-400">{f.v}%</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent to-accent-deep"
                  style={{ width: `${f.v}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div className="md:col-span-2 rounded-xl border border-white/5 bg-white/[0.02] p-3">
        <div className="text-[12.5px] text-ink-100 mb-2">Recent activity</div>
        <div className="divide-y divide-white/5 text-[12px]">
          {[
            { t: "Campaign · Diwali Spa Offer", s: "launched · 432,108 contacts", a: "2m ago", clr: "accent" },
            { t: "Flow · Admissions Qualify", s: "edited by Priya", a: "17m ago" },
            { t: "Template · service_due_v3", s: "approved by Meta", a: "1h ago", clr: "accent" },
            { t: "Webhook · Razorpay", s: "14 events processed", a: "1h ago" },
            { t: "Reminder · EMI 12 May", s: "4,210 sent · 1,824 paid", a: "3h ago", clr: "accent" },
          ].map((r, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${r.clr === "accent" ? "bg-accent" : "bg-ink-400"}`}
                />
                <span className="text-ink-100">{r.t}</span>
                <span className="text-ink-400">— {r.s}</span>
              </div>
              <span className="text-ink-500 font-mono text-[10.5px]">{r.a}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
        <div className="text-[12.5px] text-ink-100">Health</div>
        <div className="mt-3 space-y-2.5 text-[11.5px]">
          {[
            ["Meta BSP", "99.98%"],
            ["Webhook queue", "0 backlog"],
            ["Rate limit", "36% used"],
            ["Quota · this cycle", "₹84k of ₹2.4L"],
          ].map(([l, v]) => (
            <div key={l} className="flex items-center justify-between">
              <span className="text-ink-300">{l}</span>
              <span className="text-accent font-mono">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const CampaignsTab = () => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <div className="text-[16px] text-ink-100">Campaigns</div>
      <div className="flex gap-2">
        <Pill>All</Pill>
        <Pill>Live</Pill>
        <Pill>Scheduled</Pill>
        <Pill>Draft</Pill>
      </div>
    </div>
    <div className="rounded-xl border border-white/5 bg-white/[0.01] overflow-hidden">
      <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[10.5px] font-mono uppercase tracking-wider text-ink-400 border-b hairline">
        <div className="col-span-4">Name</div>
        <div className="col-span-2">Audience</div>
        <div className="col-span-2">Sent</div>
        <div className="col-span-2">Read</div>
        <div className="col-span-1">Conv.</div>
        <div className="col-span-1 text-right">Status</div>
      </div>
      {[
        { n: "Diwali Spa Offer", a: "432,108", s: "412,808", r: "87.4%", c: "6,420", st: "live" },
        { n: "Hyundai · Service May", a: "8,421", s: "8,221", r: "91.2%", c: "1,182", st: "live" },
        { n: "Admissions · CSE batch", a: "14,902", s: "14,902", r: "78.0%", c: "912", st: "done" },
        { n: "EMI reminder · 12 May", a: "4,210", s: "4,210", r: "96.1%", c: "1,824", st: "done" },
        { n: "Apollo · pre-visit nudge", a: "1,902", s: "0", r: "—", c: "—", st: "scheduled" },
        { n: "Cart recovery · 48h", a: "2,840", s: "0", r: "—", c: "—", st: "draft" },
      ].map((c, i) => (
        <div
          key={i}
          className="grid grid-cols-12 gap-2 px-3 py-2.5 text-[12px] items-center hover:bg-white/[0.02] transition"
        >
          <div className="col-span-4 text-ink-100">{c.n}</div>
          <div className="col-span-2 text-ink-300 font-mono">{c.a}</div>
          <div className="col-span-2 text-ink-300 font-mono">{c.s}</div>
          <div className="col-span-2 text-accent font-mono">{c.r}</div>
          <div className="col-span-1 text-ink-200 font-mono">{c.c}</div>
          <div className="col-span-1 text-right">
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-mono ${
                c.st === "live"
                  ? "bg-accent/15 text-accent"
                  : c.st === "scheduled"
                    ? "bg-white/5 text-ink-200"
                    : c.st === "draft"
                      ? "bg-white/5 text-ink-400"
                      : "bg-white/5 text-ink-300"
              }`}
            >
              {c.st}
            </span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const AutomationTab = () => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <div className="text-[16px] text-ink-100">Automation flows</div>
      <button className="btn-accent rounded-md px-2.5 py-1 text-[11.5px] font-medium inline-flex items-center gap-1">
        <Icons.Plus size={11} stroke={2.4} /> New flow
      </button>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {[
        { t: "Salon · booking", s: "live", tr: "Inbound message", steps: 9, runs: "4,210/d" },
        { t: "Admissions qualify", s: "live", tr: "Lead form", steps: 7, runs: "912/d" },
        { t: "EMI reminder", s: "live", tr: "Schedule · 5th", steps: 4, runs: "4,210/cycle" },
        { t: "Service due 30d", s: "live", tr: "CRM event", steps: 6, runs: "281/d" },
        { t: "Cart recovery", s: "draft", tr: "Webhook", steps: 5, runs: "—" },
        { t: "Test drive nudge", s: "paused", tr: "Tag added", steps: 4, runs: "0/d" },
      ].map((f, i) => (
        <div
          key={i}
          className="rounded-xl border border-white/5 bg-white/[0.02] p-3 hover:border-accent/30 transition"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[13px] text-ink-100">{f.t}</div>
              <div className="text-[11px] text-ink-400 font-mono">trigger · {f.tr}</div>
            </div>
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-mono ${
                f.s === "live"
                  ? "bg-accent/15 text-accent"
                  : f.s === "paused"
                    ? "bg-[#ffd66c]/10 text-[#ffd66c]"
                    : "bg-white/5 text-ink-400"
              }`}
            >
              {f.s}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1">
            {Array.from({ length: f.steps }).map((_, j) => (
              <Fragment key={j}>
                <span
                  className="h-2 w-2 rounded-full bg-accent"
                  style={{ opacity: 0.3 + (j / f.steps) * 0.7 }}
                />
                {j < f.steps - 1 && <span className="h-px flex-1 bg-white/10" />}
              </Fragment>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-ink-400">
            <span>{f.steps} steps</span>
            <span className="text-accent font-mono">{f.runs}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const TemplatesTab = () => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <div className="text-[16px] text-ink-100">Templates</div>
      <div className="flex gap-2">
        <Pill>Marketing</Pill>
        <Pill>Utility</Pill>
        <Pill>Authentication</Pill>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {[
        {
          name: "diwali_offer_v2",
          cat: "Marketing",
          status: "approved",
          body:
            "Hi {{name}}! Diwali at Naturals 🪔 Get 30% off any spa above ₹2,000. Book → naturals.in/{{coupon}}",
        },
        {
          name: "service_due_v3",
          cat: "Utility",
          status: "approved",
          body: "Hi {{name}}, your {{model}} ({{plate}}) is due for service on {{date}}. Confirm slot →",
        },
        {
          name: "emi_due_5th",
          cat: "Utility",
          status: "approved",
          body: "{{name}}, your EMI of ₹{{amount}} is due {{date}}. Pay now → {{link}}",
        },
        {
          name: "admissions_pkg",
          cat: "Marketing",
          status: "review",
          body: "Welcome {{name}}. Based on your score we shortlisted 3 programs. View →",
        },
        {
          name: "otp_login_v1",
          cat: "Authentication",
          status: "approved",
          body: "Your code is {{otp}}. Valid for 5 minutes.",
        },
        {
          name: "cart_recovery",
          cat: "Marketing",
          status: "rejected",
          body: "Hey {{name}}, you left {{items}} in your cart...",
        },
      ].map((t, i) => (
        <div key={i} className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
          <div className="flex items-start justify-between">
            <div className="font-mono text-[12px] text-ink-100">{t.name}</div>
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-mono ${
                t.status === "approved"
                  ? "bg-accent/15 text-accent"
                  : t.status === "review"
                    ? "bg-[#ffd66c]/10 text-[#ffd66c]"
                    : "bg-[#ff8fb3]/10 text-[#ff8fb3]"
              }`}
            >
              {t.status}
            </span>
          </div>
          <div className="text-[10.5px] text-ink-400 font-mono">{t.cat}</div>
          <div className="mt-2 rounded-lg bg-[#0a0c10] p-2.5 text-[11.5px] text-ink-200 leading-snug">
            {t.body.split(/(\{\{[^}]+\}\})/g).map((part, j) =>
              /\{\{/.test(part) ? (
                <span key={j} className="text-accent">
                  {part}
                </span>
              ) : (
                <span key={j}>{part}</span>
              ),
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const PortalModule = () => {
  const ref = useRef<HTMLElement>(null);
  const p = useScrollProgress(ref);
  const [tab, setTab] = useState<TabId>("overview");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (touched) return;
    if (p > 0.75) setTab("templates");
    else if (p > 0.5) setTab("automation");
    else if (p > 0.25) setTab("campaigns");
    else setTab("overview");
  }, [p, touched]);

  return (
    <section id="portal" ref={ref} className="relative py-28 sm:py-36 border-t hairline bg-ink-950">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <SectionLabel num="04" label="Admin Portal" />
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
            <div className="lg:col-span-7">
              <BigHeading>
                One cockpit.
                <br />
                <span className="font-serif-it text-accent-grad">
                  Every conversation, controllable.
                </span>
              </BigHeading>
            </div>
            <div className="lg:col-span-5">
              <Sub>
                Role-based access, audit logs, template approvals, billing — and a glass-bottom
                view of every flow, campaign and reminder running across your business.
              </Sub>
            </div>
          </div>
        </Reveal>

        <div
          className="mt-14"
          style={{ perspective: "2200px", perspectiveOrigin: "50% 30%" }}
        >
        <Scroll3D
          className="glass rounded-2xl p-2 sm:p-3 overflow-hidden"
          intensity={0.5}
          lift={0.5}
        >
          <div className="flex items-center justify-between px-3 py-2 border-b hairline">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
              </div>
              <div className="ml-3 text-[11px] text-ink-300 font-mono">
                admin.letschat.app / {tab}
              </div>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-ink-400">
              <span className="font-mono">acme-corp · ops@acme.in</span>
              <Icons.Cog size={13} />
            </div>
          </div>

          <div className="grid grid-cols-12">
            <aside className="col-span-3 lg:col-span-2 border-r hairline p-2 space-y-0.5">
              {tabs.map((t) => {
                const I = t.icon;
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTouched(true);
                      setTab(t.id);
                    }}
                    className={`w-full flex items-center gap-2 rounded-md px-2.5 py-2 text-[12.5px] text-left transition ${
                      active
                        ? "bg-white/[0.06] text-white ring-1 ring-white/10"
                        : "text-ink-300 hover:bg-white/[0.03] hover:text-white"
                    }`}
                  >
                    <I size={13} className={active ? "text-accent" : ""} /> {t.label}
                  </button>
                );
              })}
              <div className="my-2 h-px bg-white/5" />
              {(
                [
                  ["Contacts", Icons.Users],
                  ["Inbox", Icons.Inbox],
                  ["Billing", Icons.Money],
                  ["Audit log", Icons.Lock],
                  ["Settings", Icons.Cog],
                ] as const
              ).map(([l, I]) => (
                <button
                  key={l}
                  className="w-full flex items-center gap-2 rounded-md px-2.5 py-2 text-[12.5px] text-ink-400 hover:text-white hover:bg-white/[0.03] transition"
                >
                  <I size={13} /> {l}
                </button>
              ))}
            </aside>

            <main className="col-span-9 lg:col-span-10 p-4 sm:p-6 min-h-[540px]">
              {tab === "overview" && <OverviewTab />}
              {tab === "campaigns" && <CampaignsTab />}
              {tab === "automation" && <AutomationTab />}
              {tab === "templates" && <TemplatesTab />}
            </main>
          </div>
        </Scroll3D>
        </div>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-2 text-[12px]">
          {(
            [
              ["Role-based access", Icons.Lock],
              ["Full audit log", Icons.Eye],
              ["Template approvals", Icons.Layers],
              ["Billing & quotas", Icons.Money],
              ["Webhook & API", Icons.Cog],
            ] as const
          ).map(([t, I]) => (
            <div
              key={t}
              className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 flex items-center gap-2"
            >
              <I size={13} className="text-accent" /> <span className="text-ink-200">{t}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
