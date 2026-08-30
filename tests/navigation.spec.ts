import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("home page loads successfully", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Dispatches/i);
  });

  test("can navigate to blog", async ({ page }) => {
    await page.goto("/");
    await page.click("a[href=\"/blog\"]");
    await expect(page).toHaveURL(/.*\/blog/);
    await expect(page.locator("h1")).toContainText("Blog");
  });

  test("can navigate to briefs", async ({ page }) => {
    await page.goto("/");
    await page.click("a[href=\"/briefs\"]");
    await expect(page).toHaveURL(/.*\/briefs/);
    await expect(page.locator("h1")).toContainText("Briefs");
  });

  test("can navigate to projects", async ({ page }) => {
    await page.goto("/");
    await page.click("a[href=\"/projects\"]");
    await expect(page).toHaveURL(/.*\/projects/);
    await expect(page.locator("h1")).toContainText("Projects");
  });

  test("can navigate to about", async ({ page }) => {
    await page.goto("/");
    await page.click("a[href=\"/about\"]");
    await expect(page).toHaveURL(/.*\/about/);
    await expect(page.locator("h1")).toContainText("About");
  });

  test("404 page exists", async ({ page }) => {
    const response = await page.goto("/nonexistent-page");
    expect(response?.status()).toBe(404);
  });

  test("navigation is consistent across pages", async ({ page }) => {
    const pages = ["/", "/blog", "/briefs", "/projects", "/about"];

    for (const pagePath of pages) {
      await page.goto(pagePath);
      await expect(page.locator("nav a[href=\"/blog\"]")).toBeVisible();
      await expect(page.locator("nav a[href=\"/briefs\"]")).toBeVisible();
      await expect(page.locator("nav a[href=\"/projects\"]")).toBeVisible();
      await expect(page.locator("nav a[href=\"/about\"]")).toBeVisible();
    }
  });

  test("back links always navigate to their declared parent index", async ({ page }) => {
    await page.goto("/blog/generic-testing/");
    await page.getByRole("link", { name: "Back to blog" }).click();
    await expect(page).toHaveURL(/\/blog\/?$/);

    await page.goto("/");
    await page.locator("a[href=\"/blog/generic-testing\"]").click();
    await page.getByRole("link", { name: "Back to blog" }).click();
    await expect(page).toHaveURL(/\/blog\/?$/);
  });

  test("theme selection persists across navigation", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Dark theme" }).click();
    await expect(page.locator("html")).toHaveClass(/\bdark\b/);

    await page.locator("header a[href=\"/about\"]").click();
    await expect(page.locator("html")).toHaveClass(/\bdark\b/);
    await expect(page.getByRole("button", { name: "Dark theme" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});

test.describe("Reduced motion", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  test("back to top scrolls immediately and restores focus", async ({ page }) => {
    await page.addInitScript(() => {
      const originalScrollTo = window.scrollTo.bind(window);
      Object.defineProperty(window, "__lastScrollBehavior", {
        configurable: true,
        writable: true,
        value: undefined,
      });
      window.scrollTo = ((arg1: number | ScrollToOptions, arg2?: number) => {
        if (typeof arg1 === "object") {
          (window as typeof window & { __lastScrollBehavior?: ScrollBehavior })
            .__lastScrollBehavior = arg1.behavior;
          originalScrollTo(arg1);
        } else {
          originalScrollTo(arg1, arg2 ?? 0);
        }
      }) as typeof window.scrollTo;
    });

    await page.goto("/blog/generic-testing/");
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const backToTop = page.getByRole("button", { name: "Back to top" });
    await expect(backToTop).toBeVisible();
    await backToTop.click();

    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    expect(await page.evaluate(() =>
      (window as typeof window & { __lastScrollBehavior?: ScrollBehavior })
        .__lastScrollBehavior,
    )).toBe("auto");
    await expect(page.locator("#main-content")).toBeFocused();
    await expect(backToTop).toBeHidden();
  });
});
