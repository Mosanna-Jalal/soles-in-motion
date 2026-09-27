import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models";
import { ApiError, handle, json, rateLimit } from "@/lib/api";
import { startSession } from "@/lib/auth";
import { registerInput } from "@/lib/validators";

export const POST = handle(async (req: Request) => {
  rateLimit(req, "register", 5);
  const { name, email, password } = registerInput.parse(await req.json());
  await connectDB();
  if (await User.exists({ email })) throw new ApiError(409, "An account with this email already exists — try signing in");
  const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 10), role: "customer" });
  await startSession({ id: String(user._id), name: user.name, email: user.email, role: "customer" });
  return json({ ok: true }, 201);
});
