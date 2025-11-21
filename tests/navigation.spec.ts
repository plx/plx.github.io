import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("home page loads successfully", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/plx\.github\.io/i);
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

      // Check that all main nav links are present
      await expect(page.locator("nav a[href=\"/blog\"]")).toBeVisible();
      await expect(page.locator("nav a[href=\"/briefs\"]")).toBeVisible();
      await expect(page.locator("nav a[href=\"/projects\"]")).toBeVisible();
      await expect(page.locator("nav a[href=\"/about\"]")).toBeVisible();
    }
  });
});
