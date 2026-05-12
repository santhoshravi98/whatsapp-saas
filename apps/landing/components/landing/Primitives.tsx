"use client";

import { useRef, type ElementType, type ReactNode, type CSSProperties } from "react";
import { useReveal, useScrollProgress } from "./hooks";

export const Eyebrow = ({
  children,
  color = "accent",
}: {
  children: ReactNode;
  color?: string;
}) => (
  <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.18em] text-ink-300">
    <span
      className={`h-1.5 w-1.5 rounded-full bg-${color}`}
      style={{ boxShadow: "0 0 12px var(--accent-glow)" }}
    />
    {children}
  </div>
);

export const Pill = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-ink-200 ${className}`}
  >
    {children}
  </span>
);

export const SectionLabel = ({ num, label }: { num: string; label: string }) => (
  <div className="flex items-center gap-3 text-[11px] font-mono uppercase tracking-[0.2em] text-ink-400">
    <span className="text-accent">{num}</span>
    <span className="h-px w-8 bg-white/10" />
    <span>{label}</span>
  </div>
);

export const BigHeading = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => (
  <h2
    className={`font-display text-[clamp(2.4rem,5.6vw,4.8rem)] leading-[0.95] tracking-[-0.04em] text-balance text-gradient ${className}`}
  >
    {children}
  </h2>
);

export const Sub = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => (
  <p
    className={`text-[clamp(1rem,1.2vw,1.15rem)] leading-[1.55] text-ink-300 text-pretty max-w-[58ch] ${className}`}
  >
    {children}
  </p>
);

type RevealProps = {
  children: ReactNode;
  delay?: number;
  as?: ElementType;
  className?: string;
};

export const Reveal = ({
  children,
  delay = 0,
  as: As = "div",
  className = "",
}: RevealProps) => {
  const r = useRef<HTMLElement>(null);
  const seen = useReveal(r);
  return (
    <As
      ref={r}
      className={`reveal ${seen ? "in" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </As>
  );
};

type BubbleProps = {
  from?: "me" | "them";
  children: ReactNode;
  time?: string;
  read?: boolean;
  className?: string;
  style?: CSSProperties;
};

export const Bubble = ({
  from = "them",
  children,
  time = "10:24",
  read = true,
  className = "",
  style,
}: BubbleProps) => (
  <div
    className={`flex ${from === "me" ? "justify-end" : "justify-start"} ${className}`}
    style={style}
  >
    <div
      className={`relative max-w-[80%] rounded-2xl px-3 py-2 text-[12.5px] leading-snug shadow-[0_6px_18px_-10px_rgba(0,0,0,0.6)] ${
        from === "me"
          ? "bg-[#1f3a2a] text-[#e9fbf0] rounded-br-md"
          : "bg-[#1f232b] text-ink-100 rounded-bl-md"
      }`}
    >
      <div>{children}</div>
      <div className="mt-0.5 flex items-center justify-end gap-1 text-[9.5px] text-ink-400">
        <span>{time}</span>
        {from === "me" && (
          <svg
            width="14"
            height="10"
            viewBox="0 0 16 11"
            className={read ? "tick" : "text-ink-400"}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M1 6l3 3L11 2M6 9l4-4M11 9l4-7" />
          </svg>
        )}
      </div>
    </div>
  </div>
);

export const FloatCard = ({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) => (
  <div className={`glass rounded-xl p-3 ${className}`} style={style}>
    {children}
  </div>
);

// Scroll-driven 3D panel — tilts forward as it enters, flat at center, tips back as it exits.
type Scroll3DProps = {
  children: ReactNode;
  className?: string;
  intensity?: number;
  lift?: number;
  axis?: "x" | "y" | "both";
  style?: CSSProperties;
};

export const Scroll3D = ({
  children,
  className = "",
  intensity = 1,
  lift = 1,
  axis = "x",
  style = {},
}: Scroll3DProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const p = useScrollProgress(ref);
  const tilt = (0.5 - p) * 28 * intensity;
  const z = (1 - Math.abs(0.5 - p) * 2) * 80 * lift;
  const rot =
    axis === "x"
      ? `rotateX(${tilt}deg)`
      : axis === "y"
        ? `rotateY(${tilt}deg)`
        : `rotateX(${tilt}deg) rotateY(${tilt * 0.4}deg)`;
  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...style,
        transformStyle: "preserve-3d",
        transform: `${rot} translateZ(${z}px)`,
        transition: "transform .25s cubic-bezier(.2,.7,.2,1)",
        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
};

// Perspective stage — gives a section a deep camera so children's 3D reads
export const Stage3D = ({
  children,
  className = "",
  perspective = 1600,
  origin = "50% 30%",
}: {
  children: ReactNode;
  className?: string;
  perspective?: number;
  origin?: string;
}) => (
  <div
    className={className}
    style={{ perspective: `${perspective}px`, perspectiveOrigin: origin }}
  >
    {children}
  </div>
);
