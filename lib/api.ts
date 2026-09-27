import { ZodError } from "zod";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function json(data: unknown, init?: number | ResponseInit) {
  return Response.json(data, typeof init === "number" ? { status: init } : init);
}

/** Wraps a route handler with uniform error handling. */
export function handle<C>(fn: (req: Request, ctx: C) => Promise<Response>) {
  return async (req: Request, ctx: C) => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof ApiError) return json({ error: err.message }, err.status);
      if (err instanceof ZodError) {
        const issue = err.issues[0];
        const path = issue?.path?.length ? `${issue.path.join(".")}: ` : "";
        return json({ error: `${path}${issue?.message ?? "Invalid input"}` }, 400);
      }
      if (typeof err === "object" && err && "code" in err && (err as { code: number }).code === 11000) {
        const key = Object.keys((err as { keyValue?: object }).keyValue ?? {})[0] ?? "value";
        return json({ error: `That ${key} is already in use` }, 409);
      }
      console.error("[api]", err);
      return json({ error: "Something went wrong. Please try again." }, 500);
    }
  };
}

const buckets = new Map<string, { count: number; reset: number }>();

/** Tiny fixed-window rate limiter (per server instance). */
export function rateLimit(req: Request, key: string, limit = 10, windowMs = 60_000) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const id = `${key}:${ip}`;
  const now = Date.now();
  const b = buckets.get(id);
  if (!b || b.reset < now) {
    buckets.set(id, { count: 1, reset: now + windowMs });
    return;
  }
  if (++b.count > limit) throw new ApiError(429, "Too many requests — please slow down.");
}
