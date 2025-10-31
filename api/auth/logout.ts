import type { IncomingMessage, ServerResponse } from "http";
import { handleWithExpress } from "../_express-app.js";

export default function handler(req: IncomingMessage, res: ServerResponse) {
  return handleWithExpress(req, res);
}

