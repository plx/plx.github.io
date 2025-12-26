import type { CollectionEntry } from "astro:content";
import { extractCategoryFromSlug, getCategory } from "./category";

type HeadingLevel = 2 | 3 | 4 | 5 | 6;

type CardOptions = {
  maxLines?: number | "none";
  headingLevel?: HeadingLevel;
};

/**
 * Transform a blog entry into ContentCard props
 */
export function getBlogCardProps(entry: CollectionEntry<"blog">, maxLines?: number | "none", headingLevel?: HeadingLevel) {
  const displayTitle = entry.data.cardTitle || entry.data.title;

  return {
    title: displayTitle,
    subtitle: entry.data.description,
    link: `/${entry.collection}/${entry.slug}`,
    ...(maxLines !== undefined && { maxLines }),
    ...(headingLevel !== undefined && { headingLevel }),
  };
}

/**
 * Transform a project entry into ContentCard props
 */
export function getProjectCardProps(entry: CollectionEntry<"blog"> | CollectionEntry<"projects">, options?: CardOptions) {
  const displayTitle = entry.data.cardTitle || entry.data.title;

  return {
    title: displayTitle,
    subtitle: entry.data.description,
    link: `/${entry.collection}/${entry.slug}`,
    ...(options?.maxLines !== undefined && { maxLines: options.maxLines }),
    ...(options?.headingLevel !== undefined && { headingLevel: options.headingLevel }),
  };
}

/**
 * Transform a brief entry into ContentCard props
 * @param includeCategory - Whether to include the category as a title prefix
 * @param maxLines - Maximum number of lines to display for the description, or "none" for unlimited
 * @param headingLevel - The heading level to use (h2-h6)
 */
export function getBriefCardProps(entry: CollectionEntry<"briefs">, includeCategory = true, maxLines?: number | "none", headingLevel?: HeadingLevel) {
  const displayTitle = entry.data.cardTitle || entry.data.title;

  // Extract category from slug path
  const categorySlug = extractCategoryFromSlug(entry.slug);
  let categoryPrefix: string | undefined;

  if (includeCategory && categorySlug) {
    const category = getCategory(categorySlug, `src/content/briefs/${categorySlug}`);
    categoryPrefix = category.titlePrefix || category.displayName;
  }

  return {
    titlePrefix: categoryPrefix,
    title: displayTitle,
    subtitle: entry.data.description,
    link: `/${entry.collection}/${entry.slug}`,
    ...(maxLines !== undefined && { maxLines }),
    ...(headingLevel !== undefined && { headingLevel }),
  };
}
