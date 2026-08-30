import type { CollectionEntry } from "astro:content";
import { describe, expect, it } from "vitest";
import { getListOGData, getPostOGData } from "./opengraph";

function postData(
  overrides: Partial<CollectionEntry<"blog">["data"]> = {},
): CollectionEntry<"blog"> {
  return {
    collection: "blog",
    id: "example",
    data: {
      title: "*Generic* Testing",
      cardTitle: "*Generic* Testing",
      description: "Testing `generic` code.",
      date: new Date("2025-07-25T00:00:00.000Z"),
      ...overrides,
    },
  } as CollectionEntry<"blog">;
}

describe("OpenGraph data", () => {
  it("normalizes titles and descriptions to plain text", () => {
    const data = getPostOGData(
      postData(),
      "https://plx.github.io/blog/example/",
      "https://plx.github.io/",
    );

    expect(data.title).toBe("Generic Testing");
    expect(data.description).toBe("Testing generic code.");
    expect(data.image).toBe("https://plx.github.io/og-image.png");
  });

  it("honors explicit image opt-out and overrides", () => {
    const noImage = getPostOGData(postData({ noOgImage: true }), "/blog/example", "/");
    expect(noImage.image).toBeUndefined();
    expect(noImage.twitter?.card).toBe("summary");
    expect(
      getPostOGData(
        postData({ ogImage: "https://example.com/card.png", noOgImage: true }),
        "/blog/example",
        "/",
      ).image,
    ).toBe("https://example.com/card.png");
  });

  it("builds list-page titles once", () => {
    expect(getListOGData("About", "About `Dispatches`", "/about", "")).toMatchObject({
      title: "About | Dispatches",
      description: "About Dispatches",
    });
  });
});
