import CouponManager from "@/components/admin/CouponManager";
import { PageHeader } from "@/components/admin/ui";
import { connectDB, serialize } from "@/lib/db";
import { Coupon } from "@/lib/models";
import type { CouponT } from "@/lib/types";

export const metadata = { title: "Coupons" };

export default async function CouponsAdmin() {
  await connectDB();
  const coupons = await Coupon.find().sort({ active: -1, createdAt: -1 }).lean();
  return (
    <>
      <PageHeader title="Coupons" subtitle="Discount codes customers can apply in their bag or at checkout." />
      <CouponManager coupons={serialize<CouponT[]>(coupons)} />
    </>
  );
}
