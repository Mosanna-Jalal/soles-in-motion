import { connectDB, serialize } from "./db";
import { Category, Message, Order, Product, Review, User } from "./models";
import type { OrderT } from "./types";

const DAY = 86_400_000;
const TZ = "Asia/Kolkata";

export async function getAdminBadges() {
  await connectDB();
  const [pendingOrders, pendingReviews, unreadMessages] = await Promise.all([
    Order.countDocuments({ status: "pending" }),
    Review.countDocuments({ approved: false }),
    Message.countDocuments({ read: false }),
  ]);
  return { pendingOrders, pendingReviews, unreadMessages };
}

export async function getDashboard(days = 30) {
  await connectDB();
  const now = Date.now();
  const since = new Date(now - days * DAY);
  const prevSince = new Date(now - 2 * days * DAY);
  const live = { status: { $ne: "cancelled" } };

  const [period, prevPeriod, byDay, byStatus, byPayment, topProducts, lowStock, recent, productCount, customerCount, categories] = await Promise.all([
    Order.aggregate<{ revenue: number; orders: number; items: number }>([
      { $match: { ...live, createdAt: { $gte: since } } },
      { $group: { _id: null, revenue: { $sum: "$total" }, orders: { $sum: 1 }, items: { $sum: { $sum: "$items.qty" } } } },
    ]),
    Order.aggregate<{ revenue: number; orders: number }>([
      { $match: { ...live, createdAt: { $gte: prevSince, $lt: since } } },
      { $group: { _id: null, revenue: { $sum: "$total" }, orders: { $sum: 1 } } },
    ]),
    Order.aggregate<{ _id: string; revenue: number; orders: number }>([
      { $match: { ...live, createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: TZ } }, revenue: { $sum: "$total" }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate<{ _id: string; n: number }>([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
    Order.aggregate<{ _id: string; n: number; revenue: number }>([
      { $match: live },
      { $group: { _id: "$paymentMethod", n: { $sum: 1 }, revenue: { $sum: "$total" } } },
    ]),
    Order.aggregate<{ _id: unknown; name: string; image?: string; slug: string; qty: number; revenue: number }>([
      { $match: { ...live, createdAt: { $gte: since } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          name: { $first: "$items.name" },
          slug: { $first: "$items.slug" },
          image: { $first: "$items.image" },
          qty: { $sum: "$items.qty" },
          revenue: { $sum: { $multiply: ["$items.qty", "$items.price"] } },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ]),
    Product.aggregate<{ _id: unknown; name: string; slug: string; image?: string; stock: number; out: number }>([
      {
        $project: {
          name: 1,
          slug: 1,
          image: { $arrayElemAt: ["$images.url", 0] },
          stock: { $sum: "$sizes.stock" },
          out: { $size: { $filter: { input: "$sizes", cond: { $eq: ["$$this.stock", 0] } } } },
        },
      },
      { $match: { $or: [{ stock: { $lte: 40 } }, { out: { $gte: 1 } }] } },
      { $sort: { stock: 1 } },
      { $limit: 6 },
    ]),
    Order.find().sort({ createdAt: -1 }).limit(7).lean(),
    Product.countDocuments(),
    User.countDocuments({ role: "customer" }),
    Category.find({}, { name: 1 }).lean(),
  ]);

  // Revenue by category (last period) — map product → category in memory.
  const catSales = await Order.aggregate<{ _id: unknown; revenue: number }>([
    { $match: { ...live, createdAt: { $gte: since } } },
    { $unwind: "$items" },
    { $group: { _id: "$items.product", revenue: { $sum: { $multiply: ["$items.qty", "$items.price"] } } } },
  ]);
  const productCats = await Product.find({ _id: { $in: catSales.map((c) => c._id) } }, { category: 1 }).lean();
  const catOf = new Map(productCats.map((p) => [String(p._id), String(p.category)]));
  const catName = new Map(categories.map((c) => [String(c._id), c.name]));
  const byCategory = new Map<string, number>();
  for (const s of catSales) {
    const name = catName.get(catOf.get(String(s._id)) ?? "") ?? "Other";
    byCategory.set(name, (byCategory.get(name) ?? 0) + s.revenue);
  }

  const series: { date: string; revenue: number; orders: number }[] = [];
  const map = new Map(byDay.map((d) => [d._id, d]));
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now - i * DAY).toLocaleDateString("en-CA", { timeZone: TZ });
    const row = map.get(d);
    series.push({ date: d, revenue: row?.revenue ?? 0, orders: row?.orders ?? 0 });
  }

  const cur = period[0] ?? { revenue: 0, orders: 0, items: 0 };
  const prev = prevPeriod[0] ?? { revenue: 0, orders: 0 };
  const delta = (a: number, b: number) => (b ? Math.round(((a - b) / b) * 100) : a ? 100 : 0);

  return {
    kpis: {
      revenue: cur.revenue,
      revenueDelta: delta(cur.revenue, prev.revenue),
      orders: cur.orders,
      ordersDelta: delta(cur.orders, prev.orders),
      aov: cur.orders ? Math.round(cur.revenue / cur.orders) : 0,
      aovDelta: delta(cur.orders ? cur.revenue / cur.orders : 0, prev.orders ? prev.revenue / prev.orders : 0),
      items: cur.items,
      products: productCount,
      customers: customerCount,
    },
    series,
    byStatus: byStatus.map((s) => ({ status: s._id, count: s.n })),
    byPayment: byPayment.map((p) => ({ method: p._id, count: p.n, revenue: p.revenue })),
    byCategory: [...byCategory.entries()].map(([name, revenue]) => ({ name, revenue })).sort((a, b) => b.revenue - a.revenue),
    topProducts: serialize<{ _id: string; name: string; slug: string; image?: string; qty: number; revenue: number }[]>(topProducts),
    lowStock: serialize<{ _id: string; name: string; slug: string; image?: string; stock: number; out: number }[]>(lowStock),
    recent: serialize<OrderT[]>(recent),
  };
}
