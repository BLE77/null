import type { IncomingMessage, ServerResponse } from "http";
import handler from "../../[...path].js";

export default function checkoutPaySolanaHandler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  return handler(req, res);
}
