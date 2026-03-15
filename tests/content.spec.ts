import { test, expect } from "@playwright/test";

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
});
