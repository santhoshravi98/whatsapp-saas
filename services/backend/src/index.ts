import cors from "cors";
import express from "express";
import { healthRouter } from "./routes/health";
import { webhookRouter } from "./routes/webhook";

const app = express();
const port = Number(process.env.PORT ?? process.env.BACKEND_PORT ?? 4000);

app.use(cors());
app.use(express.json({ limit: "50mb" }));

app.use("/health", healthRouter);
app.use("/webhook", webhookRouter);

app.get("/", (_req, res) => {
  res.json({ ok: true, service: "whatsapp-saas-backend" });
});

app.listen(port, () => {
  console.log(`Backend service listening on port ${port}`);
});
