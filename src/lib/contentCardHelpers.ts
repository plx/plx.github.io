import type { CollectionEntry } from "astro:content";
import { extractCategoryFromSlug, getCategory } from "./category";

type HeadingLevel = 2 | 3 | 4 | 5 | 6;

type CardOptions = {
  maxLines?: number | "none";
  headingLevel?: HeadingLevel;
};

/**
 * Shared mapping for the base ContentCard props (title/subtitle/link + options).
 * Blog and project entries use it directly; briefs reuse it and layer their
 * category title prefix on top — see getBriefCardProps.
 */
function getStandardCardProps(
  entry: CollectionEntry<"blog"> | CollectionEntry<"projects"> | CollectionEntry<"briefs">,
  options?: CardOptions
) {
  const displayTitle = entry.data.cardTitle || entry.data.title;

  return {
    title: displayTitle,
    subtitle: entry.data.description,
    link: `/${entry.collection}/${entry.id}`,
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
    href: `/${entry.collection}/${entry.id}`,
  };
}

/**
 * Transform a blog entry into ExcerptEntry props.
 */
export function getBlogEntryProps(entry: CollectionEntry<"blog">) {
  return getStandardEntryProps(entry);
}

/**
 * Resolve a brief's category title prefix (explicit prefix or display name),
 * or undefined when the slug has no category segment. Shared by the brief
 * card and feed-entry mappers.
 */
function resolveBriefTitlePrefix(entry: CollectionEntry<"briefs">): string | undefined {
  const categorySlug = extractCategoryFromSlug(entry.id);
  if (!categorySlug) return undefined;
  const category = getCategory(categorySlug, `src/content/briefs/${categorySlug}`);
  return category.titlePrefix || category.displayName;
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
  return { ...base, titlePrefix: resolveBriefTitlePrefix(entry) };
}

/**
 * Transform a brief entry into ContentCard props
 * @param includeCategory - Whether to include the category as a title prefix
 * @param options - Card display options (maxLines, headingLevel)
 */
export function getBriefCardProps(entry: CollectionEntry<"briefs">, includeCategory = true, options?: CardOptions) {
  const titlePrefix = includeCategory ? resolveBriefTitlePrefix(entry) : undefined;
  return { titlePrefix, ...getStandardCardProps(entry, options) };
}
