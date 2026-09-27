import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models";
import { ApiError, handle, json, rateLimit } from "@/lib/api";

const input = z.object({
  orderNumber: z.string().trim().toUpperCase().max(40),
  email: z.email().transform((v) => v.toLowerCase()),
});

/** Looks up an order by number + email and returns a link with its access token. */
export const POST = handle(async (req: Request) => {
  rateLimit(req, "track", 10);
  const { orderNumber, email } = input.parse(await req.json());
  await connectDB();
  const order = await Order.findOne({ orderNumber, email }, { orderNumber: 1, accessToken: 1 }).lean();
  if (!order) throw new ApiError(404, "We couldn't find an order with those details");
  return json({ url: `/order/${order.orderNumber}?t=${order.accessToken}` });
});
