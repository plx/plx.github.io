import { test, expect } from "@playwright/test";

test.describe("Content", () => {
  test("home page displays expected content", async ({ page }) => {
    await page.goto("/");

    // Main heading should be present
    const h1 = page.locator("h1").first();
    await expect(h1).toBeVisible();

    // Page should have some content
    const bodyText = await page.locator("body").textContent();
    expect(bodyText?.length).toBeGreaterThan(100);
  });

  test("blog page lists blog posts", async ({ page }) => {
    await page.goto("/blog");

    // Should have a heading
    await expect(page.locator("h1")).toContainText("Blog");

    // Should have at least some content (posts or a message)
    const bodyText = await page.locator("body").textContent();
    expect(bodyText?.length).toBeGreaterThan(50);
  });

  test("briefs page shows categories", async ({ page }) => {
    await page.goto("/briefs");

    // Should have a heading
    await expect(page.locator("h1")).toContainText("Briefs");

    // Should have some content
    const bodyText = await page.locator("body").textContent();
    expect(bodyText?.length).toBeGreaterThan(50);
  });

  test("projects page displays projects", async ({ page }) => {
    await page.goto("/projects");

    // Should have a heading
    await expect(page.locator("h1")).toContainText("Projects");

    // Should have some content
    const bodyText = await page.locator("body").textContent();
    expect(bodyText?.length).toBeGreaterThan(50);
  });

  test("about page has bio information", async ({ page }) => {
    await page.goto("/about");

    // Should have a heading
    await expect(page.locator("h1")).toContainText("About");

    // Should have some biographical content
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

  test("code blocks render properly", async ({ page }) => {
    await page.goto("/blog");

    // Find a blog post link and navigate to it
    const postLink = page.locator("article a, a[href*=\"/blog/\"]").first();
    const hasPostLink = await postLink.count() > 0;

    if (hasPostLink) {
      await postLink.click();

      // Check if there are any code blocks
      const codeBlocks = page.locator("pre, code");
      const codeBlockCount = await codeBlocks.count();

      if (codeBlockCount > 0) {
        // Verify code blocks are visible
        await expect(codeBlocks.first()).toBeVisible();

        // Verify they have some styling (not default browser styles)
        const hasCustomStyling = await codeBlocks.first().evaluate(el => {
          const styles = window.getComputedStyle(el);
          return styles.backgroundColor !== "rgba(0, 0, 0, 0)" &&
                 styles.backgroundColor !== "transparent";
        });

        expect(hasCustomStyling).toBeTruthy();
      }
    }
  });

  test("external links open in new tab", async ({ page }) => {
    await page.goto("/");

    const externalLinks = await page.locator("a[href^=\"http\"]").all();

    for (const link of externalLinks) {
      const href = await link.getAttribute("href");
      const target = await link.getAttribute("target");

      // Skip links to plx.github.io itself
      if (href?.includes("plx.github.io")) continue;

      // External links should open in new tab
      expect(target).toBe("_blank");

      // And should have security attributes
      const rel = await link.getAttribute("rel");
      expect(rel).toContain("noopener");
    }
  });
});
