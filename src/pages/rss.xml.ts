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
    // Declare the itunes namespace so the <itunes:image> tag in customData below
    // is valid XML. Without this, the feed parses with a namespace error.
    xmlns: {
      itunes: "http://www.itunes.com/dtds/podcast-1.0.dtd",
    },
    title: HOME.TITLE,
    description: HOME.DESCRIPTION,
    site: context.site,
    customData: `<language>en-us</language>
    <image>
      <url>${context.site}rss-image.png</url>
      <title>${HOME.TITLE}</title>
      <link>${context.site}</link>
      <width>144</width>
      <height>144</height>
    </image>`,
    items: items.map((item) => ({
      title: item.data.title,
      description: item.data.description,
      pubDate: item.data.date,
      link: `/${item.collection}/${item.id}/`,
    })),
  });
}
