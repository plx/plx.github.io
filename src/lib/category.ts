import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { parse } from "yaml";

export interface BriefCategory {
  slug: string;
  displayName: string;
  titlePrefix?: string;
  description?: string;
  sortPriority?: number;
}

/**
 * Convert a kebab-case slug to a display name
 * e.g., "swift-warts" -> "Swift Warts"
 */
function slugToDisplayName(slug: string): string {
  return slug
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Create a default category from a directory name
 */
export function getCategoryFromSlug(slug: string): BriefCategory {
  const displayName = slugToDisplayName(slug);
  return {
    slug,
    displayName,
    titlePrefix: displayName,
    sortPriority: 0
  };
}

/**
 * Load category overrides from a category.yaml file if it exists
 */
export function loadCategoryOverrides(categoryPath: string): Partial<BriefCategory> | null {
  const overridePath = join(categoryPath, "category.yaml");
  
  if (!existsSync(overridePath)) {
    return null;
  }
  
  try {
    const content = readFileSync(overridePath, "utf-8");
    return parse(content) as Partial<BriefCategory>;
  } catch (error) {
    console.warn(`Failed to parse category.yaml in ${categoryPath}:`, error);
    return null;
  }
}

/**
 * Get the full category metadata, combining defaults with overrides
 */
export function getCategory(slug: string, categoryPath: string): BriefCategory {
  const defaultCategory = getCategoryFromSlug(slug);
  const overrides = loadCategoryOverrides(categoryPath);
  
  if (!overrides) {
    return defaultCategory;
  }
  
  return {
    ...defaultCategory,
    ...overrides,
    slug // Always preserve the original slug
  };
}

/**
 * Extract category slug from a brief's slug
 * e.g., "swift-warts/lazy-sequences" -> "swift-warts"
 */
export function extractCategoryFromSlug(briefSlug: string): string | null {
  const parts = briefSlug.split("/");
  if (parts.length > 1) {
    return parts[0];
  }
  return null; // Uncategorized brief
}

/**
 * Extract the brief's relative slug within its category
 * e.g., "swift-warts/lazy-sequences" -> "lazy-sequences"
 */
export function extractBriefSlugFromPath(fullSlug: string): string {
  const parts = fullSlug.split("/");
  if (parts.length > 1) {
    return parts.slice(1).join("/");
  }
  return fullSlug; // Uncategorized brief
}