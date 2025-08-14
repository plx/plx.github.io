import type { CollectionEntry } from "astro:content";

/**
 * Transform a blog or project entry into ContentCard props
 */
export function getBlogCardProps(entry: CollectionEntry<"blog">, maxLines?: number | "none") {
  const displayTitle = entry.data.cardTitle || entry.data.title;
  
  return {
    title: displayTitle,
    subtitle: entry.data.description,
    link: `/${entry.collection}/${entry.slug}`,
    ...(maxLines !== undefined && { maxLines }),
  };
}

/**
 * Transform a blog or project entry into ContentCard props
 */
export function getProjectCardProps(entry: CollectionEntry<"blog"> | CollectionEntry<"projects">, maxLines?: number | "none") {
  const displayTitle = entry.data.cardTitle || entry.data.title;
  
  return {
    title: displayTitle,
    subtitle: entry.data.description,
    link: `/${entry.collection}/${entry.slug}`,
    ...(maxLines !== undefined && { maxLines }),
  };
}

/**
 * Transform a brief entry into ContentCard props
 * @param includeCategory - Whether to include the category as a title prefix
 * @param maxLines - Maximum number of lines to display for the description, or "none" for unlimited
 */
export function getBriefCardProps(entry: CollectionEntry<"briefs">, includeCategory = true, maxLines?: number | "none") {
  const displayTitle = entry.data.cardTitle || entry.data.title;
  
  return {
    titlePrefix: includeCategory ? entry.data.category : undefined,
    title: displayTitle,
    subtitle: entry.data.description,
    link: `/${entry.collection}/${entry.slug}`,
    ...(maxLines !== undefined && { maxLines }),
  };
}
