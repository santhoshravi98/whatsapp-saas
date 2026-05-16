export default function Home() {
  return (
    <main style={{ fontFamily: "system-ui", padding: 32 }}>
      <h1>WAPI</h1>
      <p>WhatsApp webhook is live at <code>/api/webhook</code>.</p>
      <p>Worker is live at <code>/api/jobs/process-message</code>.</p>
    </main>
  );
}
