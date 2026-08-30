import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { byDateDesc, published } from "@lib/collections";
import { stripMarkdown } from "@lib/markdown";
import { HOME } from "@consts";

export const GET: APIRoute = async (context) => {
  if (!context.site) {
    throw new Error("The RSS feed requires Astro's `site` configuration.");
  }

  const blog = published(await getCollection("blog"));
  const projects = published(await getCollection("projects"));

  const items = byDateDesc([...blog, ...projects]);

  return rss({
    title: HOME.TITLE,
    description: HOME.DESCRIPTION,
    site: context.site,
    customData: `<language>en-us</language>
    <image>
      <url>${new URL("rss-image.png", context.site)}</url>
      <title>${HOME.TITLE}</title>
      <link>${context.site}</link>
      <width>144</width>
      <height>144</height>
    </image>`,
    items: items.map((item) => ({
      title: stripMarkdown(item.data.title),
      description: stripMarkdown(item.data.description),
      pubDate: item.data.date,
      link: `/${item.collection}/${item.id}/`,
    })),
  });
};
