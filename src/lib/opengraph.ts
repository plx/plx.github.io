import type { CollectionEntry } from "astro:content";
import { SITE } from "@consts";
import { stripMarkdown } from "./markdown";

export interface OpenGraphData {
  title: string;
  description: string;
  type: "website" | "article";
  url: string;
  siteName: string;
  image?: string;
  imageDark?: string;
  imageAlt?: string;
  article?: {
    publishedTime?: Date;
    modifiedTime?: Date;
    author?: string;
    section?: string;
  };
  twitter?: {
    card?: "summary" | "summary_large_image";
    creator?: string;
  };
}

// Social cards use the static, on-brand stippled OG art (light + dark).
// The site previously generated per-post cards via Tailgraph on a gradient
// background, which the design system explicitly rules out.
const OG_IMAGE = "og-image.png";
const OG_IMAGE_DARK = "og-image-dark.png";

function brandImage(siteUrl: string, file: string): string {
  return siteUrl ? new URL(file, siteUrl).toString() : `/${file}`;
}

/**
 * Resolve the OG image pair for an entry, honoring per-entry overrides:
 * a custom `ogImage` wins (no dark variant); `noOgImage` opts out entirely;
 * otherwise the static brand pair is used.
 */
function resolveEntryImages(
  data: { ogImage?: string; noOgImage?: boolean },
  siteUrl: string
): { image?: string; imageDark?: string } {
  if (data.ogImage) return { image: data.ogImage };
  if (data.noOgImage) return {};
  return {
    image: brandImage(siteUrl, OG_IMAGE),
    imageDark: brandImage(siteUrl, OG_IMAGE_DARK),
  };
}

/**
 * Get OpenGraph data for a blog post
 */
export function getPostOGData(
  post: CollectionEntry<"blog">,
  url: string,
  siteUrl: string
): OpenGraphData {
  const ogTitle = stripMarkdown(post.data.ogTitle || post.data.title);
  const ogDescription = post.data.ogDescription || post.data.description;
  const { image, imageDark } = resolveEntryImages(post.data, siteUrl);

  return {
    title: ogTitle,
    description: ogDescription,
    type: "article",
    url,
    siteName: SITE.NAME,
    image,
    imageDark,
    imageAlt: post.data.ogImageAlt || `${ogTitle} - Blog Post`,
    article: {
      publishedTime: post.data.date,
      modifiedTime: post.data.modifiedDate,
      author: "plx",
      section: "Blog"
    },
    twitter: {
      card: "summary_large_image"
    }
  };
}

/**
 * Get OpenGraph data for a brief
 */
export function getBriefOGData(
  brief: CollectionEntry<"briefs">,
  category: { displayName: string; titlePrefix?: string } | null,
  url: string,
  siteUrl: string
): OpenGraphData {
  const ogTitle = stripMarkdown(brief.data.ogTitle || brief.data.title);
  const ogDescription = brief.data.ogDescription || brief.data.description;
  const { image, imageDark } = resolveEntryImages(brief.data, siteUrl);

  return {
    title: ogTitle,
    description: ogDescription,
    type: "article",
    url,
    siteName: SITE.NAME,
    image,
    imageDark,
    imageAlt: brief.data.ogImageAlt || `${ogTitle} - Brief`,
    article: {
      publishedTime: brief.data.date,
      modifiedTime: brief.data.modifiedDate,
      author: "plx",
      section: category?.displayName || "Briefs"
    },
    twitter: {
      card: "summary_large_image"
    }
  };
}

/**
 * Get OpenGraph data for a project
 */
export function getProjectOGData(
  project: CollectionEntry<"projects">,
  url: string,
  siteUrl: string
): OpenGraphData {
  const ogTitle = stripMarkdown(project.data.ogTitle || project.data.title);
  const ogDescription = project.data.ogDescription || project.data.description;
  const { image, imageDark } = resolveEntryImages(project.data, siteUrl);

  return {
    title: ogTitle,
    description: ogDescription,
    type: "website",
    url,
    siteName: SITE.NAME,
    image,
    imageDark,
    imageAlt: project.data.ogImageAlt || `${ogTitle} - Project`,
    twitter: {
      card: "summary_large_image"
    }
  };
}

/**
 * Get OpenGraph data for list pages
 */
export function getListOGData(
  title: string,
  description: string,
  pageType: "blog" | "briefs" | "projects",
  itemCount: number,
  url: string,
  siteUrl: string
): OpenGraphData {
  // itemCount/pageType retained for potential future per-list cards.
  void itemCount;
  void pageType;

  return {
    title: `${title} | ${SITE.NAME}`,
    description,
    type: "website",
    url,
    siteName: SITE.NAME,
    image: brandImage(siteUrl, OG_IMAGE),
    imageDark: brandImage(siteUrl, OG_IMAGE_DARK),
    imageAlt: `${title} - ${SITE.NAME}`,
    twitter: {
      card: "summary_large_image"
    }
  };
}

/**
 * Get OpenGraph data for the home page
 */
export function getHomeOGData(
  url: string,
  siteUrl: string
): OpenGraphData {
  return {
    title: SITE.NAME,
    description: "Technical writing on Swift, performance optimization, and software engineering",
    type: "website",
    url,
    siteName: SITE.NAME,
    image: brandImage(siteUrl, OG_IMAGE),
    imageDark: brandImage(siteUrl, OG_IMAGE_DARK),
    imageAlt: SITE.NAME,
    twitter: {
      card: "summary_large_image"
    }
  };
}
