import { test, expect } from "@playwright/test";

test.describe("Responsive Design", () => {
  const viewports = [
    { name: "mobile", width: 375, height: 667 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "desktop", width: 1920, height: 1080 },
  ];

  for (const viewport of viewports) {
    test(`home page renders without horizontal scroll on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/");

      await expect(page.locator("body")).toBeVisible();

      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      expect(hasHorizontalScroll).toBeFalsy();
    });

    test(`navigation works on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/");

      const navLinks = page.locator("nav a, header a");
      const navLinkCount = await navLinks.count();
      expect(navLinkCount).toBeGreaterThan(0);
    });
  }

  test("text is readable on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

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

    const buttons = await page.locator("button").all();

    for (const element of buttons) {
      const box = await element.boundingBox();

      if (box && box.width > 0 && box.height > 0) {
        const minSize = 32;
        expect(box.width).toBeGreaterThanOrEqual(minSize);
        expect(box.height).toBeGreaterThanOrEqual(minSize);
      }
    }
  });

  test("content reflows properly on narrow viewports", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto("/");

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

    expect(overflowElements.length).toBeLessThan(3);
  });
});
