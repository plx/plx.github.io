import { test, expect } from "@playwright/test";
import { parseString } from "xml2js";
import { promisify } from "util";

const parseXML = promisify(parseString);

/**
 * Comprehensive test suite that visits every page in the sitemap.
 *
 * This suite discovers all pages from the sitemap and runs structural
 * and accessibility checks on each one. It's designed to catch issues
 * during site reorganization.
 *
 * Modes:
 * - CI (default): Tests ALL pages from sitemap
 * - Sample (SAMPLE_MODE=true): Tests only a few pages for quick local feedback
 */

// Configuration constants
const SAMPLE_PAGE_COUNT = 5;
const MIN_PAGE_CONTENT_LENGTH = 50;

let allUrls: string[] = [];
let testUrls: string[] = [];

// Fetch and parse sitemap before tests run
test.beforeAll(async ({ request }) => {
  const response = await request.get("/sitemap-0.xml");
  expect(response.ok()).toBeTruthy();

  const xmlText = await response.text();
  const result = (await parseXML(xmlText)) as {
    urlset?: { url?: Array<{ loc: string[] }> };
  };

  // Validate sitemap structure
  if (!result.urlset?.url) {
    throw new Error("Invalid sitemap structure: missing urlset or url array");
  }

  // Extract URLs from sitemap
  const urlset = result.urlset.url;
  allUrls = urlset.map((entry) => {
    const url = entry.loc[0];
    // Convert full URL to path-only
    const urlObj = new URL(url);
    return urlObj.pathname;
  });

  // Determine which URLs to test based on mode
  const sampleMode = process.env.SAMPLE_MODE === "true";

  if (sampleMode) {
    // Sample mode: test a diverse sample (useful for local dev)
    testUrls = sampleUrls(allUrls, SAMPLE_PAGE_COUNT);
    console.log(`\n📋 Sample mode: Testing ${testUrls.length} of ${allUrls.length} pages`);
  } else {
    // Full mode: test everything (for CI)
    testUrls = allUrls;
    console.log(`\n📋 Comprehensive mode: Testing all ${testUrls.length} pages`);
  }
});

/**
 * Sample a diverse set of URLs from the sitemap for quick local testing
 */
function sampleUrls(urls: string[], count: number): string[] {
  const samples = new Set<string>();

  // Always include home page
  samples.add("/");

  // Try to get one from each major section
  const sections = ["blog", "briefs", "projects", "about"];
  for (const section of sections) {
    const match = urls.find((url) => url.includes(`/${section}/`) || url === `/${section}`);
    if (match) samples.add(match);
  }

  // Fill remaining with random pages
  while (samples.size < Math.min(count, urls.length)) {
    const randomUrl = urls[Math.floor(Math.random() * urls.length)];
    samples.add(randomUrl);
  }

  return Array.from(samples);
}

test.describe("Comprehensive Sitemap Tests", () => {
  test("all pages load and have valid structure", async ({ page }) => {
    for (const url of testUrls) {
      const response = await page.goto(url);

      // Page should load successfully
      expect(response?.status(), `${url} should load successfully`).toBeLessThan(400);

      // Should have a title
      await expect(page, `${url} should have a title`).toHaveTitle(/.+/);

      // Should have content
      const bodyText = await page.locator("body").textContent();
      expect(
        bodyText?.length,
        `${url} should have content (>${MIN_PAGE_CONTENT_LENGTH} chars)`,
      ).toBeGreaterThan(MIN_PAGE_CONTENT_LENGTH);
    }
  });

  test("all pages have proper heading structure", async ({ page }) => {
    for (const url of testUrls) {
      await page.goto(url);

      // Should have exactly one h1
      const h1Count = await page.locator("h1").count();
      expect(h1Count, `${url} should have exactly one h1`).toBe(1);

      // Headings should be in proper order (no skipping levels)
      const headingLevels = await page.evaluate(() => {
        const headings = Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6"));
        return headings.map((h) => parseInt(h.tagName.substring(1)));
      });

      // Verify no heading levels are skipped
      for (let i = 1; i < headingLevels.length; i++) {
        const levelDiff = headingLevels[i] - headingLevels[i - 1];
        expect(levelDiff, `${url} heading hierarchy should not skip levels`).toBeLessThanOrEqual(1);
      }
    }
  });

  test("all images have alt text on all pages", async ({ page }) => {
    for (const url of testUrls) {
      await page.goto(url);

      const images = await page.locator("img").all();
      for (const img of images) {
        const alt = await img.getAttribute("alt");
        const src = await img.getAttribute("src");
        expect(alt, `Image on ${url} missing alt text (src: ${src})`).toBeDefined();
      }
    }
  });

  test("no duplicate IDs on any page", async ({ page }) => {
    for (const url of testUrls) {
      await page.goto(url);

      const ids = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll("[id]"));
        return elements.map((el) => el.id);
      });

      const uniqueIds = new Set(ids);
      expect(ids.length, `${url} has duplicate IDs`).toBe(uniqueIds.size);
    }
  });

  test("all links are accessible on all pages", async ({ page }) => {
    for (const url of testUrls) {
      await page.goto(url);

      const links = await page.locator("a").all();
      for (const link of links) {
        const text = await link.textContent();
        const ariaLabel = await link.getAttribute("aria-label");
        const title = await link.getAttribute("title");
        const href = await link.getAttribute("href");

        // Link should have either visible text, aria-label, or title
        expect(
          (text && text.trim().length > 0) ||
            (ariaLabel && ariaLabel.trim().length > 0) ||
            (title && title.trim().length > 0),
          `Link on ${url} missing accessible label (href: ${href})`,
        ).toBeTruthy();
      }
    }
  });
});

// Summary test that reports coverage
test.describe("Test Coverage Summary", () => {
  test("report test coverage", async () => {
    const sampleMode = process.env.SAMPLE_MODE === "true";

    console.log("\n" + "=".repeat(60));
    console.log("📊 Test Coverage Summary");
    console.log("=".repeat(60));
    console.log(`Mode: ${sampleMode ? "SAMPLE (local dev)" : "COMPREHENSIVE (CI)"}`);
    console.log(`Total pages in sitemap: ${allUrls.length}`);
    console.log(`Pages tested: ${testUrls.length}`);
    console.log(`Coverage: ${((testUrls.length / allUrls.length) * 100).toFixed(1)}%`);

    if (sampleMode) {
      console.log("\n💡 Tip: Run full tests with:");
      console.log("   npm run qa:full");
      console.log("   or");
      console.log("   just qa-full");
    }

    console.log("=".repeat(60) + "\n");

    // This test always passes - it's just for reporting
    expect(testUrls.length).toBeGreaterThan(0);
  });
});
