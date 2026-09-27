import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models";
import { ApiError, handle, json, rateLimit } from "@/lib/api";
import { startSession } from "@/lib/auth";
import { loginInput } from "@/lib/validators";

const input = loginInput.extend({ scope: z.enum(["store", "admin"]).default("store") });

export const POST = handle(async (req: Request) => {
  rateLimit(req, "login", 10);
  const { email, password, scope } = input.parse(await req.json());
  await connectDB();
  const user = await User.findOne({ email }).select("+passwordHash");
  const ok = user && (await bcrypt.compare(password, user.passwordHash));
  if (!user || !ok) throw new ApiError(401, "Incorrect email or password");
  if (scope === "admin" && user.role !== "admin") throw new ApiError(403, "This account doesn't have admin access");

  user.lastLoginAt = new Date();
  await user.save();
  await startSession({ id: String(user._id), name: user.name, email: user.email, role: user.role as "customer" | "admin" });
  return json({ ok: true, role: user.role });
});
