import type { CollectionEntry } from "astro:content";
import { SITE } from "@consts";

export interface OpenGraphData {
  title: string;
  description: string;
  type: "website" | "article";
  url: string;
  siteName: string;
  image?: string;
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

interface TailgraphParams {
  title: string;
  subtitle?: string;
  author?: string;
  theme?: "light" | "dark";
  backgroundImage?: string;
  logo?: string;
}

/**
 * Generate a Tailgraph URL for dynamic OG images
 */
export function generateTailgraphURL(params: TailgraphParams): string {
  const baseURL = "https://tailgraph.com/api/v1/og";
  const searchParams = new URLSearchParams();
  
  searchParams.set("title", params.title);
  
  if (params.subtitle) {
    searchParams.set("subtitle", params.subtitle);
  }
  
  if (params.author) {
    searchParams.set("author", params.author);
  }
  
  searchParams.set("theme", params.theme || "dark");
  
  if (params.backgroundImage) {
    searchParams.set("backgroundImage", params.backgroundImage);
  }
  
  if (params.logo) {
    searchParams.set("logo", params.logo);
  }
  
  return `${baseURL}?${searchParams.toString()}`;
}

/**
 * Get OpenGraph data for a blog post
 */
export function getPostOGData(
  post: CollectionEntry<"blog">,
  url: string,
  siteUrl: string
): OpenGraphData {
  const ogTitle = post.data.ogTitle || post.data.title;
  const ogDescription = post.data.ogDescription || post.data.description;
  
  let ogImage = post.data.ogImage;
  if (!ogImage && !post.data.noOgImage) {
    ogImage = generateTailgraphURL({
      title: post.data.cardTitle || post.data.title,
      subtitle: post.data.date.toLocaleDateString("en-US", { 
        year: "numeric", 
        month: "long", 
        day: "numeric" 
      }),
      author: "plx",
      theme: "dark",
      backgroundImage: "gradient",
      logo: `${siteUrl}/default-og-image.jpg`
    });
  }
  
  return {
    title: ogTitle,
    description: ogDescription,
    type: "article",
    url,
    siteName: SITE.NAME,
    image: ogImage,
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
  const ogTitle = brief.data.ogTitle || brief.data.title;
  const ogDescription = brief.data.ogDescription || brief.data.description;
  
  let ogImage = brief.data.ogImage;
  if (!ogImage && !brief.data.noOgImage) {
    ogImage = generateTailgraphURL({
      title: brief.data.cardTitle || brief.data.title,
      subtitle: category?.titlePrefix || category?.displayName || "Brief",
      author: "plx",
      theme: "dark",
      backgroundImage: "gradient",
      logo: `${siteUrl}/default-og-image.jpg`
    });
  }
  
  return {
    title: ogTitle,
    description: ogDescription,
    type: "article",
    url,
    siteName: SITE.NAME,
    image: ogImage,
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
  const ogTitle = project.data.ogTitle || project.data.title;
  const ogDescription = project.data.ogDescription || project.data.description;
  
  let ogImage = project.data.ogImage;
  if (!ogImage && !project.data.noOgImage) {
    ogImage = generateTailgraphURL({
      title: project.data.title,
      subtitle: "Project",
      author: "plx",
      theme: "dark",
      backgroundImage: "gradient",
      logo: `${siteUrl}/default-og-image.jpg`
    });
  }
  
  return {
    title: ogTitle,
    description: ogDescription,
    type: "website",
    url,
    siteName: SITE.NAME,
    image: ogImage,
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
  const subtitle = `${itemCount} ${pageType === "blog" ? "posts" : pageType}`;
  
  const ogImage = generateTailgraphURL({
    title,
    subtitle,
    theme: "dark",
    backgroundImage: "gradient",
    logo: `${siteUrl}/default-og-image.jpg`
  });
  
  return {
    title: `${title} | ${SITE.NAME}`,
    description,
    type: "website",
    url,
    siteName: SITE.NAME,
    image: ogImage,
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
  const ogImage = generateTailgraphURL({
    title: SITE.NAME,
    subtitle: "Technical writing and projects",
    theme: "dark",
    backgroundImage: "gradient",
    logo: `${siteUrl}/default-og-image.jpg`
  });
  
  return {
    title: SITE.NAME,
    description: "Technical writing on Swift, performance optimization, and software engineering",
    type: "website",
    url,
    siteName: SITE.NAME,
    image: ogImage,
    imageAlt: SITE.NAME,
    twitter: {
      card: "summary_large_image"
    }
  };
}
