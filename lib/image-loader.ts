"use client";

type LoaderArgs = { src: string; width: number; quality?: number };

export default function cloudinaryLoader({ src, width, quality }: LoaderArgs) {
  if (src.includes("res.cloudinary.com") && src.includes("/upload/")) {
    const q = quality && quality !== 75 ? `q_${quality}` : "q_auto";
    return src.replace("/upload/", `/upload/f_auto,${q},c_limit,w_${width}/`);
  }
  if (src.startsWith("https://images.unsplash.com")) {
    const u = new URL(src);
    u.searchParams.set("w", String(width));
    u.searchParams.set("q", String(quality || 75));
    u.searchParams.set("auto", "format");
    return u.toString();
  }
  return src;
}
