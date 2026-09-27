import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models";
import { ApiError, handle, json } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { restockOrder } from "@/lib/orders";
import { orderUpdateInput } from "@/lib/validators";

type Ctx = RouteContext<"/api/admin/orders/[id]">;

const NOTES: Record<string, string> = {
  confirmed: "Order confirmed",
  processing: "Packed and ready to ship",
  shipped: "Handed over to courier",
  delivered: "Delivered",
  cancelled: "Order cancelled",
};

export const PATCH = handle(async (req: Request, ctx: Ctx) => {
  await requireAdmin();
  const { id } = await ctx.params;
  if (!/^[a-f0-9]{24}$/i.test(id)) throw new ApiError(404, "Order not found");
  const data = orderUpdateInput.parse(await req.json());
  await connectDB();
  const order = await Order.findById(id);
  if (!order) throw new ApiError(404, "Order not found");

  if (data.status && data.status !== order.status) {
    if (order.status === "cancelled") throw new ApiError(409, "Cancelled orders can't be reopened — create a new order instead.");
    if (order.status === "delivered" && data.status !== "cancelled") throw new ApiError(409, "This order has already been delivered.");

    if (data.status === "cancelled") {
      await restockOrder(order.items);
      if (order.paymentStatus === "paid") order.paymentStatus = "refunded";
    }
    if (data.status === "delivered" && order.paymentMethod === "cod") order.paymentStatus = "paid";
    order.status = data.status;
    order.timeline.push({ status: data.status, note: data.note || NOTES[data.status], at: new Date() });
  } else if (data.note) {
    order.timeline.push({ status: order.status, note: data.note, at: new Date() });
  }
  if (data.paymentStatus) order.paymentStatus = data.paymentStatus;

  await order.save();
  return json({ ok: true, status: order.status, paymentStatus: order.paymentStatus });
});
