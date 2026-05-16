/**
 * Minimal root layout. The dashboard UI is intentionally left as a stub —
 * build it out once you actually need a place to read conversations.
 */
export const metadata = { title: "WAPI" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
