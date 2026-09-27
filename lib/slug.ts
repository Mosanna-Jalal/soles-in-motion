import { slugify } from "./utils";

type SlugModel = { exists: (filter: Record<string, unknown>) => PromiseLike<unknown> };

/** Returns `base`, or `base-2`, `base-3`… — whichever is free in the collection. */
export async function uniqueSlug(model: SlugModel, input: string, excludeId?: string) {
  const base = slugify(input) || "item";
  let slug = base;
  for (let n = 2; ; n++) {
    const clash = await model.exists({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) });
    if (!clash) return slug;
    slug = `${base}-${n}`;
  }
}
