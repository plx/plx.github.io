import type { CollectionEntry } from "astro:content";
import { extractCategoryFromSlug, getCategory } from "./category";

type HeadingLevel = 2 | 3 | 4 | 5 | 6;

type CardOptions = {
  maxLines?: number | "none";
  headingLevel?: HeadingLevel;
};

/**
 * Shared mapping for blog/project entries, which produce identical card props.
 * Briefs are intentionally excluded because they add category-prefix behavior.
 */
function getStandardCardProps(
  entry: CollectionEntry<"blog"> | CollectionEntry<"projects">,
  options?: CardOptions
) {
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
 * Transform a blog entry into ContentCard props
 */
export function getBlogCardProps(entry: CollectionEntry<"blog">, options?: CardOptions) {
  return getStandardCardProps(entry, options);
}

/**
 * Transform a project entry into ContentCard props
 */
export function getProjectCardProps(entry: CollectionEntry<"projects">, options?: CardOptions) {
  return getStandardCardProps(entry, options);
}

/**
 * Shared mapping for the editorial-feed listing (ExcerptEntry).
 * The excerpt is the entry's `description`; body-derived excerpts are a
 * documented future enhancement (see docs/DESIGN_SYSTEM.md).
 */
function getStandardEntryProps(
  entry: CollectionEntry<"blog"> | CollectionEntry<"projects"> | CollectionEntry<"briefs">
) {
  return {
    title: entry.data.cardTitle || entry.data.title,
    excerpt: entry.data.description,
    date: entry.data.date,
    href: `/${entry.collection}/${entry.slug}`,
  };
}

/**
 * Transform a blog entry into ExcerptEntry props.
 */
export function getBlogEntryProps(entry: CollectionEntry<"blog">) {
  return getStandardEntryProps(entry);
}

/**
 * Transform a brief entry into ExcerptEntry props.
 * @param includeCategory - Whether to surface the category as a title prefix
 *   (used on the home feed; omitted on the briefs index where the category
 *   is already the section heading).
 */
export function getBriefEntryProps(entry: CollectionEntry<"briefs">, includeCategory = false) {
  const base = getStandardEntryProps(entry);

  if (!includeCategory) return base;

  const categorySlug = extractCategoryFromSlug(entry.slug);
  let titlePrefix: string | undefined;
  if (categorySlug) {
    const category = getCategory(categorySlug, `src/content/briefs/${categorySlug}`);
    titlePrefix = category.titlePrefix || category.displayName;
  }

  return { ...base, titlePrefix };
}

/**
 * Transform a brief entry into ContentCard props
 * @param includeCategory - Whether to include the category as a title prefix
 * @param options - Card display options (maxLines, headingLevel)
 */
export function getBriefCardProps(entry: CollectionEntry<"briefs">, includeCategory = true, options?: CardOptions) {
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
    ...(options?.maxLines !== undefined && { maxLines: options.maxLines }),
    ...(options?.headingLevel !== undefined && { headingLevel: options.headingLevel }),
  };
}
