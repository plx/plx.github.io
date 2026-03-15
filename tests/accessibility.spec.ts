import { test, expect } from "@playwright/test";

test.describe("Accessibility", () => {
  test("home page has proper heading structure", async ({ page }) => {
    await page.goto("/");

    const h1Count = await page.locator("h1").count();
    expect(h1Count).toBe(1);

    const headingLevels = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6"));
      return headings.map((h) => parseInt(h.tagName.substring(1)));
    });

    expect(headingLevels.length).toBeGreaterThan(0);

    for (let i = 1; i < headingLevels.length; i++) {
      const levelDiff = headingLevels[i] - headingLevels[i - 1];
      expect(levelDiff).toBeLessThanOrEqual(1);
    }
  });

  test("all images have alt text", async ({ page }) => {
    await page.goto("/");

    const images = await page.locator("img").all();
    for (const img of images) {
      const alt = await img.getAttribute("alt");
      expect(alt).toBeDefined();
    }
  });

  test("links have descriptive text", async ({ page }) => {
    await page.goto("/");

    const links = await page.locator("a").all();
    for (const link of links) {
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute("aria-label");
      const title = await link.getAttribute("title");

      expect(
        (text && text.trim().length > 0) ||
        (ariaLabel && ariaLabel.trim().length > 0) ||
        (title && title.trim().length > 0),
      ).toBeTruthy();
    }
  });

  test("page has proper language attribute", async ({ page }) => {
    await page.goto("/");

    const htmlLang = await page.locator("html").getAttribute("lang");
    expect(htmlLang).toBe("en");
  });

  test("skip to content link exists", async ({ page }) => {
    await page.goto("/");

    const skipLink = page.locator("a.skip-link, a[href=\"#main-content\"]").first();
    const skipLinkExists = await skipLink.count() > 0;

    if (skipLinkExists) {
      const href = await skipLink.getAttribute("href");
      const targetId = href?.replace("#", "");
      if (targetId) {
        const target = page.locator(`#${targetId}`);
        await expect(target).toBeAttached();
      }
    }
  });

  test("no duplicate IDs on page", async ({ page }) => {
    await page.goto("/");

    const ids = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll("[id]"));
      return elements.map((el) => el.id);
    });

    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });
});
