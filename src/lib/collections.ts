import { getCollection, type CollectionEntry, type CollectionKey } from "astro:content";

/**
 * Drop draft entries from a list of content entries.
 */
export function published<T extends { data: { draft?: boolean } }>(entries: readonly T[]): T[] {
  return entries.filter((entry) => !entry.data.draft);
}

/**
 * Return a new array sorted by `data.date`, newest first.
 */
export function byDateDesc<T extends { data: { date: Date } }>(entries: readonly T[]): T[] {
  return [...entries].sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/**
 * Fetch a content collection's published entries, sorted newest-first.
 *
 * Centralizes the draft-filter + date-desc-sort pipeline that every list
 * page and `getStaticPaths` block would otherwise repeat. Pass `limit` to
 * cap the result (e.g. homepage previews).
 */
export async function getPublishedCollection<C extends CollectionKey>(
  collection: C,
  limit?: number
): Promise<CollectionEntry<C>[]> {
  const entries = byDateDesc(published(await getCollection(collection)));
  return limit === undefined ? entries : entries.slice(0, limit);
}
