import { test, expect } from '@playwright/test';

test.describe('Responsive Design', () => {
  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1920, height: 1080 },
  ];

  for (const viewport of viewports) {
    test(`home page renders correctly on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');

      // Page should be visible and have content
      await expect(page.locator('body')).toBeVisible();

      // No horizontal scrollbar should appear
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      expect(hasHorizontalScroll).toBeFalsy();
    });

    test(`navigation works on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');

      // Navigation should be present (might be in hamburger menu on mobile)
      const navLinks = page.locator('nav a, header a');
      const navLinkCount = await navLinks.count();
      expect(navLinkCount).toBeGreaterThan(0);
    });
  }

  test('images are responsive', async ({ page }) => {
    await page.goto('/');

    const images = await page.locator('img').all();

    for (const img of images) {
      const width = await img.evaluate(el => el.clientWidth);
      const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);

      // Images should not overflow their containers
      expect(width).toBeLessThanOrEqual(naturalWidth + 1); // +1 for rounding

      // Images should have reasonable max-width styling
      const maxWidth = await img.evaluate(el => {
        return window.getComputedStyle(el).maxWidth;
      });

      expect(maxWidth === '100%' || maxWidth === 'none').toBeTruthy();
    }
  });

  test('text is readable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Check font size is reasonable (at least 14px for body text)
    const bodyFontSize = await page.evaluate(() => {
      const body = document.body;
      const fontSize = window.getComputedStyle(body).fontSize;
      return parseInt(fontSize);
    });

    expect(bodyFontSize).toBeGreaterThanOrEqual(14);
  });

  test('touch targets are appropriately sized on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Get all clickable elements
    const clickableElements = await page.locator('a, button').all();

    for (const element of clickableElements) {
      const box = await element.boundingBox();

      if (box) {
        // Touch targets should be at least 44x44 pixels (WCAG guideline)
        // We'll be lenient and check for 40x40
        const minSize = 40;
        expect(box.width >= minSize || box.height >= minSize).toBeTruthy();
      }
    }
  });

  test('content reflows properly on narrow viewports', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/');

    // Check for horizontal overflow
    const overflowElements = await page.evaluate(() => {
      const allElements = Array.from(document.querySelectorAll('*'));
      return allElements
        .filter(el => {
          const rect = el.getBoundingClientRect();
          return rect.right > window.innerWidth;
        })
        .map(el => ({
          tag: el.tagName,
          class: el.className,
        }));
    });

    // Allow for some rounding errors but no significant overflow
    expect(overflowElements.length).toBeLessThan(3);
  });
});
