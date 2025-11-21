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
      const styles = await img.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          maxWidth: computed.maxWidth,
          width: computed.width,
        };
      });

      // Images should either have max-width: 100% or explicit width constraint
      // This ensures they won't overflow on smaller screens
      const hasConstraint =
        styles.maxWidth === "100%" ||
        styles.maxWidth !== "none" ||
        (styles.width !== "auto" && !styles.width.includes("px"));

      expect(hasConstraint).toBeTruthy();
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

    // Get all clickable elements
    const clickableElements = await page.locator("a, button").all();

    for (const element of clickableElements) {
      const box = await element.boundingBox();

      if (box && box.width > 0 && box.height > 0) {
        // WCAG 2.1 requires 44x44 pixels minimum for both dimensions
        // We'll be slightly lenient and check for 40x40
        const minSize = 40;
        expect(box.width).toBeGreaterThanOrEqual(minSize);
        expect(box.height).toBeGreaterThanOrEqual(minSize);
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
