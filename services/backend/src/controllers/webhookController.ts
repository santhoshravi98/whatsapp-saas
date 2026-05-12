import type { Request, Response } from "express";

export function verifyWebhook(request: Request, response: Response) {
  const mode = request.query["hub.mode"];
  const token = request.query["hub.verify_token"];
  const challenge = request.query["hub.challenge"];

  const expected = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && expected && token === expected) {
    response.status(200).send(challenge);
    return;
  }

  response.status(200).json({
    ok: true,
    note: "Placeholder webhook verify — wire up WHATSAPP_VERIFY_TOKEN.",
  });
}

export function receiveWebhook(request: Request, response: Response) {
  // Placeholder: real implementation will dispatch to message/event handlers.
  console.log("[webhook] received", JSON.stringify(request.body));
  response.status(200).json({ ok: true });
}
