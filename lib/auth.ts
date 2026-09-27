import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connectDB } from "./db";
import { User } from "./models";
import { ApiError } from "./api";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession, verifySession } from "./jwt";
import type { SessionUser } from "./types";

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

export async function startSession(user: SessionUser) {
  const token = await signSession(user);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function endSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** For API routes: verifies the JWT *and* that the user is still an admin in the database. */
export async function requireAdmin(): Promise<SessionUser> {
  const session = await getSession();
  if (!session || session.role !== "admin") throw new ApiError(401, "Admin access required");
  await connectDB();
  const exists = await User.exists({ _id: session.id, role: "admin" });
  if (!exists) throw new ApiError(401, "Admin access required");
  return session;
}

/** For admin pages: redirects to the admin login instead of throwing. */
export async function requireAdminPage(): Promise<SessionUser> {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/admin/login");
  await connectDB();
  const exists = await User.exists({ _id: session.id, role: "admin" });
  if (!exists) redirect("/admin/login");
  return session;
}
