import { expect, test } from "@playwright/test";
import { sitemapRoutes } from "./helpers";

test.describe("Responsive design", () => {
  for (const viewport of [
    { name: "mobile", width: 375, height: 667 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "desktop", width: 1920, height: 1080 },
  ]) {
    test(`home page has no horizontal scroll on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto("/");

      const dimensions = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      expect(dimensions.scrollWidth).toBe(dimensions.clientWidth);
    });
  }

  for (const width of [320, 375]) {
    test(`every HTML route reflows without document overflow at ${width}px`, async ({ page, request }) => {
      await page.setViewportSize({ width, height: 667 });

      for (const route of await sitemapRoutes(request)) {
        await page.goto(route);
        const dimensions = await page.evaluate(() => ({
          clientWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
        }));
        expect(
          dimensions.scrollWidth,
          `${route} overflows a ${width}px viewport`,
        ).toBe(dimensions.clientWidth);
      }
    });
  }

  test("body text remains readable on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    const bodyFontSize = await page.locator("body").evaluate((body) =>
      Number.parseFloat(window.getComputedStyle(body).fontSize),
    );
    expect(bodyFontSize).toBeGreaterThanOrEqual(14);
  });

  test("visible mobile buttons meet the site's 32px touch-target floor", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    for (const button of await page.getByRole("button").all()) {
      if (!(await button.isVisible())) continue;
      const box = await button.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(32);
      expect(box?.height).toBeGreaterThanOrEqual(32);
    }
  });
});
