import type { IncomingMessage, ServerResponse } from "http";
import handler from "../../[...path].js";

export default function checkoutPayHandler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  return handler(req, res);
}
