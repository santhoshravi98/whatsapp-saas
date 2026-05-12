import type { ReactNode } from "react";

export interface LayoutWrapperProps {
  children: ReactNode;
  className?: string;
}

export function LayoutWrapper({ children, className = "" }: LayoutWrapperProps) {
  return <main className={`ws-layout ${className}`}>{children}</main>;
}
