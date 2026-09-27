/** Client-safe helpers that build Cloudinary delivery URLs with on-the-fly transformations. */

function isCloudinary(url?: string | null): url is string {
  return !!url && url.includes("res.cloudinary.com") && url.includes("/upload/");
}

export function cldTransform(url: string | undefined | null, transformation: string) {
  if (!url) return "";
  if (!isCloudinary(url)) return url;
  return url.replace("/upload/", `/upload/${transformation}/`);
}

export function cldImage(url: string | undefined | null, width = 1200, extra = "") {
  return cldTransform(url, `f_auto,q_auto,c_limit,w_${width}${extra ? `,${extra}` : ""}`);
}

export function cldVideo(url: string | undefined | null, width = 1280) {
  return cldTransform(url, `q_auto,vc_auto,c_limit,w_${width}`);
}

/** Poster frame for a Cloudinary video (first second, as an optimized image). */
export function cldPoster(url: string | undefined | null, width = 1280) {
  if (!isCloudinary(url)) return url || "";
  return cldTransform(url.replace(/\.[a-z0-9]+$/i, ".jpg"), `so_1,f_auto,q_auto,c_limit,w_${width}`);
}
