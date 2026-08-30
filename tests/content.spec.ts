import { test, expect } from "@playwright/test";
import { sitemapRoutes } from "./helpers";

test.describe("Content", () => {
  test("home page displays expected content", async ({ page }) => {
    await page.goto("/");

    const h1 = page.locator("h1").first();
    await expect(h1).toBeVisible();

    const bodyText = await page.locator("body").textContent();
    expect(bodyText?.length).toBeGreaterThan(100);
  });

  test("blog page lists blog posts", async ({ page }) => {
    await page.goto("/blog");
    await expect(page.locator("h1")).toContainText("Blog");

    const bodyText = await page.locator("body").textContent();
    expect(bodyText?.length).toBeGreaterThan(50);
  });

  test("briefs page shows categories", async ({ page }) => {
    await page.goto("/briefs");
    await expect(page.locator("h1")).toContainText("Briefs");

    const bodyText = await page.locator("body").textContent();
    expect(bodyText?.length).toBeGreaterThan(50);
  });

  test("projects page displays projects", async ({ page }) => {
    await page.goto("/projects");
    await expect(page.locator("h1")).toContainText("Projects");

    const bodyText = await page.locator("body").textContent();
    expect(bodyText?.length).toBeGreaterThan(50);
  });

  test("about page has content", async ({ page }) => {
    await page.goto("/about");
    await expect(page.locator("h1")).toContainText("About");

    const bodyText = await page.locator("body").textContent();
    expect(bodyText?.length).toBeGreaterThan(100);
  });

  test("RSS feed exists and is valid XML", async ({ page }) => {
    const response = await page.goto("/rss.xml");
    expect(response?.status()).toBe(200);

    const contentType = response?.headers()["content-type"];
    expect(contentType).toMatch(/xml|rss/);

    const content = await response?.text();
    expect(content).toContain("<?xml");
    expect(content).toContain("<rss");
    expect(content).toContain("<title>Generic Testing For Generic Swift Code</title>");
    expect(content).toContain("<description>Streamlined migration from XCTest to Swift Testing.</description>");
    expect(content).not.toContain("<title>*Generic* Testing");
    expect(content).not.toContain("<title>Claude Code Skills</title>");
  });

  test("sitemap exists and is valid XML", async ({ page }) => {
    const response = await page.goto("/sitemap-0.xml");
    expect(response?.status()).toBe(200);

    const contentType = response?.headers()["content-type"];
    expect(contentType).toMatch(/xml/);

    const content = await response?.text();
    expect(content).toContain("<?xml");
    expect(content).toContain("urlset");
  });

  test("every generated route loads without browser errors", async ({ page, request }) => {
    const browserErrors: string[] = [];
    page.on("pageerror", (error) => browserErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") browserErrors.push(message.text());
    });

    for (const route of await sitemapRoutes(request)) {
      const response = await page.goto(route);
      expect(response?.ok(), `${route} should return a successful response`).toBe(true);
    }

    expect(browserErrors).toEqual([]);
  });

  test("external links have security attributes", async ({ page }) => {
    await page.goto("/");

    const siteHostname = new URL(page.url()).hostname;
    const externalLinks = await page.locator("a[href^=\"http\"]").all();

    for (const link of externalLinks) {
      const href = await link.getAttribute("href");
      if (href) {
        try {
          const linkHostname = new URL(href).hostname;
          if (linkHostname === siteHostname) continue;
        } catch {
          // Invalid URL
        }
      }

      const target = await link.getAttribute("target");
      expect(target).toBe("_blank");

      const rel = await link.getAttribute("rel");
      expect(rel).toContain("noopener");
    }
  });

  test("pages emit one exact set of primary metadata", async ({ page }) => {
    const cases = [
      {
        route: "/about/",
        title: "About | Dispatches",
        description: "About Dispatches and its author",
      },
      {
        route: "/blog/generic-testing/",
        title: "Generic Testing For Generic Swift Code | Dispatches",
        description: "A practical approach to writing generic tests for generic Swift code.",
      },
      {
        route: "/briefs/claude-code/claude-code-never-compact/",
        title: "Never compact | Dispatches",
        description: "Claude Code's /compact command exists and seems useful, but should rarely be used.",
      },
    ];

    for (const metadata of cases) {
      await page.goto(metadata.route);
      await expect(page.locator("head > title")).toHaveCount(1);
      await expect(page.locator("head > meta[name=\"description\"]")).toHaveCount(1);
      await expect(page.locator("head > link[rel=\"canonical\"]")).toHaveCount(1);
      await expect(page).toHaveTitle(metadata.title);
      await expect(page.locator("head > link[rel=\"canonical\"]")).toHaveAttribute(
        "href",
        new URL(metadata.route, "https://plx.github.io").toString(),
      );
      await expect(page.locator("head > meta[name=\"description\"]")).toHaveAttribute(
        "content",
        metadata.description,
      );
    }
  });

  test("About uses page-specific social metadata", async ({ page }) => {
    await page.goto("/about/");
    await expect(page.locator("meta[property=\"og:title\"]")).toHaveAttribute(
      "content",
      "About | Dispatches",
    );
    await expect(page.locator("meta[property=\"og:description\"]")).toHaveAttribute(
      "content",
      "About Dispatches and its author",
    );
  });

  test("article social metadata uses its canonical URL", async ({ page }) => {
    await page.goto("/blog/generic-testing/");
    await expect(page.locator("meta[property=\"og:url\"]")).toHaveAttribute(
      "content",
      "https://plx.github.io/blog/generic-testing/",
    );
    await expect(page.locator("meta[property=\"article:published_time\"]")).toHaveAttribute(
      "content",
      "2025-11-01T00:00:00.000Z",
    );
    await expect(page.locator("meta[name=\"twitter:card\"]")).toHaveAttribute(
      "content",
      "summary_large_image",
    );
    await expect(page.locator("meta[name=\"twitter:image\"]")).toHaveCount(1);
  });
});
