import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { axeViolationSummary, representativeRoutes } from "./helpers";

test.describe("Accessibility", () => {
  for (const theme of ["light", "dark"] as const) {
    for (const route of representativeRoutes) {
      test(`${route} has no automatic accessibility violations in ${theme} mode`, async ({ page }) => {
        await page.addInitScript((preference) => {
          window.localStorage.setItem("theme", preference);
        }, theme);
        await page.goto(route);
        if (theme === "dark") {
          await expect(page.locator("html")).toHaveClass(/\bdark\b/);
        } else {
          await expect(page.locator("html")).not.toHaveClass(/\bdark\b/);
        }

        // Expressive Code adds tabindex only to code blocks that actually
        // overflow. Its ResizeObserver settles asynchronously after layout.
        await page.waitForFunction(() =>
          [...document.querySelectorAll<HTMLElement>(".expressive-code pre")]
            .every((block) => block.scrollWidth <= block.clientWidth || block.tabIndex === 0),
        );

        const results = await new AxeBuilder({ page }).analyze();
        expect(results.violations, axeViolationSummary(results.violations)).toEqual([]);
      });
    }
  }

  test("representative pages have one h1 and do not skip heading levels", async ({ page }) => {
    for (const route of representativeRoutes) {
      await page.goto(route);
      await expect(page.locator("h1"), `${route} should have one h1`).toHaveCount(1);

      const levels = await page.locator("h1, h2, h3, h4, h5, h6").evaluateAll((headings) =>
        headings.map((heading) => Number(heading.tagName.slice(1))),
      );
      for (let index = 1; index < levels.length; index += 1) {
        expect(
          levels[index] - levels[index - 1],
          `${route} skips from h${levels[index - 1]} to h${levels[index]}`,
        ).toBeLessThanOrEqual(1);
      }
    }
  });

  test("skip link is the first focusable control and moves focus to main", async ({ page }) => {
    await page.goto("/");
    const skipLink = page.getByRole("link", { name: "Skip to main content" });
    const firstFocusable = page.locator([
      "a[href]",
      "button:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "[tabindex]:not([tabindex=\"-1\"])",
    ].join(", ")).first();

    await expect(skipLink).toHaveCount(1);
    await expect(firstFocusable).toHaveClass(/\bskip-link\b/);
    await skipLink.focus();
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeVisible();

    await skipLink.press("Enter");
    await expect(page.locator("#main-content")).toBeFocused();
  });

  test("external social links announce the new browsing context", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("link", { name: "Dispatches on github (opens in new window)" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Dispatches on linkedin (opens in new window)" }),
    ).toBeVisible();
  });
});
