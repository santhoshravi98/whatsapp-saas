import "@whatsapp-saas/ui/styles.css";
import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "WhatsApp SaaS App",
  description: "Workspace for WhatsApp conversations and automations.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <main className="workspace-content">{children}</main>
        </div>
      </body>
    </html>
  );
}
