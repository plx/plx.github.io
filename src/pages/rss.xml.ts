import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { byDateDesc, published } from "@lib/collections";
import { HOME } from "@consts";

type Context = {
  site: string
}

export async function GET(context: Context) {
  const blog = published(await getCollection("blog"));
  const projects = published(await getCollection("projects"));

  const items = byDateDesc([...blog, ...projects]);

  return rss({
    title: HOME.TITLE,
    description: HOME.DESCRIPTION,
    site: context.site,
    customData: `<language>en-us</language>
    <image>
      <url>${context.site}og-image.png</url>
      <title>${HOME.TITLE}</title>
      <link>${context.site}</link>
      <width>1200</width>
      <height>630</height>
    </image>
    <itunes:image href="${context.site}og-image.png" />`,
    items: items.map((item) => ({
      title: item.data.title,
      description: item.data.description,
      pubDate: item.data.date,
      link: `/${item.collection}/${item.slug}/`,
    })),
  });
}
