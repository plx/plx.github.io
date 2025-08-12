import type { CollectionEntry } from "astro:content";

/**
 * Transform a blog or project entry into ContentCard props
 */
export function getBlogCardProps(entry: CollectionEntry<"blog">) {
  const displayTitle = entry.data.cardTitle || entry.data.title;
  
  return {
    title: displayTitle,
    subtitle: entry.data.description,
    link: `/${entry.collection}/${entry.slug}`,
  };
}

/**
 * Transform a blog or project entry into ContentCard props
 */
export function getProjectCardProps(entry: CollectionEntry<"blog"> | CollectionEntry<"projects">) {
  const displayTitle = entry.data.cardTitle || entry.data.title;
  
  return {
    title: displayTitle,
    subtitle: entry.data.description,
    link: `/${entry.collection}/${entry.slug}`,
  };
}

/**
 * Transform a brief entry into ContentCard props
 * @param includeCategory - Whether to include the category as a title prefix
 */
export function getBriefCardProps(entry: CollectionEntry<"briefs">, includeCategory = true) {
  const displayTitle = entry.data.cardTitle || entry.data.title;
  
  return {
    titlePrefix: includeCategory ? entry.data.category : undefined,
    title: displayTitle,
    subtitle: entry.data.description,
    link: `/${entry.collection}/${entry.slug}`,
  };
}
