import { defineConfig, devices } from "@playwright/test";

const externalBaseURL = process.env.BASE_URL;
const playwrightPort = process.env.PLAYWRIGHT_PORT || "4321";
const baseURL = externalBaseURL || `http://127.0.0.1:${playwrightPort}`;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",

  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    launchOptions: {
      args: [
        "--disable-dev-shm-usage",
        ...(process.env.CI ? ["--no-sandbox", "--disable-setuid-sandbox"] : []),
      ],
    },
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 12"] },
    },
  ],

  // BASE_URL targets an already-running deployment. Otherwise own a dedicated
  // foreground static server. This avoids Astro preview's workspace-level
  // singleton, while strict port ownership prevents an arbitrary dev server
  // from being reused (dev-toolbar markup and generated routes differ).
  webServer: externalBaseURL ? undefined : {
    command: `npm run build && npm run preview:qa -- --port ${playwrightPort}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120 * 1000,
  },
});
