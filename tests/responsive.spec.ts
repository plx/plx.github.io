import { test, expect } from "@playwright/test";

test.describe("Responsive Design", () => {
  const viewports = [
    { name: "mobile", width: 375, height: 667 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "desktop", width: 1920, height: 1080 },
  ];

  for (const viewport of viewports) {
    test(`home page renders correctly on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/");

      // Page should be visible and have content
      await expect(page.locator("body")).toBeVisible();

      // No horizontal scrollbar should appear
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      expect(hasHorizontalScroll).toBeFalsy();
    });

    test(`navigation works on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/");

      // Navigation should be present (might be in hamburger menu on mobile)
      const navLinks = page.locator("nav a, header a");
      const navLinkCount = await navLinks.count();
      expect(navLinkCount).toBeGreaterThan(0);
    });
  }

  test("images have reasonable styling constraints", async ({ page }) => {
    await page.goto("/");

    const images = await page.locator("img").all();

    for (const img of images) {
      // Check that images have CSS to prevent them from exceeding container width
      const imageInfo = await img.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        const parent = el.parentElement;
        const parentWidth = parent ? parent.clientWidth : window.innerWidth;
        return {
          maxWidth: computed.maxWidth,
          width: computed.width,
          clientWidth: el.clientWidth,
          parentWidth: parentWidth,
        };
      });

      // Images should be constrained to their container
      // Check that the image width doesn't exceed its parent container
      const hasResponsiveConstraint =
        imageInfo.maxWidth === "100%" ||
        imageInfo.width === "100%" ||
        imageInfo.clientWidth <= imageInfo.parentWidth;

      expect(hasResponsiveConstraint).toBeTruthy();
    }
  });

  test("text is readable on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Check font size is reasonable (at least 14px for body text)
    const bodyFontSize = await page.evaluate(() => {
      const body = document.body;
      const fontSize = window.getComputedStyle(body).fontSize;
      return parseInt(fontSize);
    });

    expect(bodyFontSize).toBeGreaterThanOrEqual(14);
  });

  test("touch targets are appropriately sized on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Test that buttons (not text links) have adequate touch target size
    // WCAG 2.5.8 (AAA) recommends 44x44 but has exceptions for inline text links
    // This site uses text-style navigation links which are exempt
    const buttons = await page.locator("button").all();

    for (const element of buttons) {
      const box = await element.boundingBox();

      if (box && box.width > 0 && box.height > 0) {
        // Check that buttons meet reasonable touch target size
        const minSize = 32;
        expect(box.width).toBeGreaterThanOrEqual(minSize);
        expect(box.height).toBeGreaterThanOrEqual(minSize);
      }
    }

    // Verify navigation links are at least minimally tappable
    const navLinks = await page.locator("nav a").all();
    for (const link of navLinks) {
      const box = await link.boundingBox();
      if (box && box.width > 0 && box.height > 0) {
        // Text links should have at least readable line height
        expect(box.height).toBeGreaterThanOrEqual(20);
      }
    }
  });

  test("content reflows properly on narrow viewports", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto("/");

    // Check for horizontal overflow
    const overflowElements = await page.evaluate(() => {
      const allElements = Array.from(document.querySelectorAll("*"));
      return allElements
        .filter((el) => {
          const rect = el.getBoundingClientRect();
          return rect.right > window.innerWidth;
        })
        .map((el) => ({
          tag: el.tagName,
          class: el.className,
        }));
    });

    // Allow for some rounding errors but no significant overflow
    expect(overflowElements.length).toBeLessThan(3);
  });
});
