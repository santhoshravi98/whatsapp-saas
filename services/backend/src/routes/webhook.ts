import { Router } from "express";
import {
  verifyWebhook,
  receiveWebhook,
} from "../controllers/webhookController";

export const webhookRouter = Router();

webhookRouter.get("/", verifyWebhook);
webhookRouter.post("/", receiveWebhook);
