import mongoose from "mongoose";

type Cache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };

declare global {
  var __mongoose: Cache | undefined;
}

const cached: Cache = global.__mongoose ?? (global.__mongoose = { conn: null, promise: null });

export async function connectDB() {
  if (cached.conn) return cached.conn;
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes("<db_password>")) {
    throw new Error("MONGODB_URI is not configured — set your Atlas credentials in .env.local");
  }
  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      dbName: process.env.MONGODB_DB || "soles-in-motion",
      bufferCommands: false,
      serverSelectionTimeoutMS: 15000,
    });
  }
  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }
  return cached.conn;
}

/** Converts lean mongoose docs (ObjectIds, Dates) into plain JSON-safe objects for client components. */
export function serialize<T>(value: unknown): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
