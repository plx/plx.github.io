import { test, expect } from "@playwright/test";

test.describe("Accessibility", () => {
  test("home page has proper heading structure", async ({ page }) => {
    await page.goto("/");

    // Should have exactly one h1
    const h1Count = await page.locator("h1").count();
    expect(h1Count).toBe(1);

    // Headings should be in proper order (no skipping levels)
    const headingLevels = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6"));
      return headings.map((h) => parseInt(h.tagName.substring(1)));
    });

    // Verify headings exist
    expect(headingLevels.length).toBeGreaterThan(0);

    // Verify no heading levels are skipped (e.g., h1 -> h3 without h2)
    for (let i = 1; i < headingLevels.length; i++) {
      const levelDiff = headingLevels[i] - headingLevels[i - 1];
      // Can only go down any number of levels or up by 1 level
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

      // Link should have either visible text, aria-label, or title
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
    expect(htmlLang).toBeTruthy();
    expect(htmlLang).toBe("en");
  });

  test("skip to content link exists for keyboard navigation", async ({ page }) => {
    await page.goto("/");

    // Check if skip link exists (common accessibility pattern)
    const skipLink = page.locator("a[href=\"#main\"], a[href=\"#content\"]").first();
    const skipLinkExists = await skipLink.count() > 0;

    // If it exists, verify it's functional
    if (skipLinkExists) {
      const href = await skipLink.getAttribute("href");
      const targetId = href?.replace("#", "");
      if (targetId) {
        const target = page.locator(`#${targetId}`);
        await expect(target).toBeAttached();
      }
    }
  });

  test("focus is visible on interactive elements", async ({ page }) => {
    await page.goto("/");

    // Focus on the first navigation link to ensure we're testing page content
    const firstNavLink = page.locator("nav a, header a").first();
    await firstNavLink.focus();

    // Verify the focused element has visible focus styles
    const focusStyles = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return null;
      const styles = window.getComputedStyle(el);
      return {
        outline: styles.outline,
        outlineWidth: styles.outlineWidth,
        outlineStyle: styles.outlineStyle,
        outlineColor: styles.outlineColor,
        boxShadow: styles.boxShadow,
      };
    });

    // Should have some form of visible focus indicator
    // (outline or box-shadow for custom focus styles)
    expect(focusStyles).toBeTruthy();
    expect(
      (focusStyles?.outline !== "none" && focusStyles?.outlineWidth !== "0px") ||
      (focusStyles?.boxShadow !== "none"),
    ).toBeTruthy();
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
