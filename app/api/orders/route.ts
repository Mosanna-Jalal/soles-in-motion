import { handle, json, rateLimit } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { createOrder } from "@/lib/orders";
import { orderInput } from "@/lib/validators";

export const POST = handle(async (req: Request) => {
  rateLimit(req, "order", 8);
  const data = orderInput.parse(await req.json());
  const session = await getSession();
  const result = await createOrder(data, session);
  return json(result, 201);
});
