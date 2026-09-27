import { z } from "zod";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models";
import { ApiError, handle, json } from "@/lib/api";
import { getSession, startSession } from "@/lib/auth";

const input = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().max(20).optional(),
  address: z
    .object({
      line1: z.string().trim().max(160),
      line2: z.string().trim().max(160).optional(),
      city: z.string().trim().max(60),
      state: z.string().trim().max(60),
      pincode: z
        .string()
        .trim()
        .regex(/^(\d{6})?$/, "PIN code must be 6 digits"),
    })
    .optional(),
});

export const PATCH = handle(async (req: Request) => {
  const session = await getSession();
  if (!session) throw new ApiError(401, "Please sign in");
  const data = input.parse(await req.json());
  await connectDB();
  const user = await User.findByIdAndUpdate(
    session.id,
    {
      name: data.name,
      phone: data.phone,
      ...(data.address?.line1 ? { addresses: [{ label: "Home", country: "India", ...data.address }] } : {}),
    },
    { new: true },
  );
  if (!user) throw new ApiError(404, "Account not found");
  await startSession({ ...session, name: user.name });
  return json({ ok: true });
});
