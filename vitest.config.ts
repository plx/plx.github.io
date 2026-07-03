import { defineConfig } from "vitest/config";

// Unit tests live next to the code they cover as `*.test.ts` under `src/`
// or `scripts/`.
// The `tests/` directory is reserved for Playwright (`*.spec.ts`) QA suites,
// so we scope Vitest to `src/` to avoid the two runners fighting over files.
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "scripts/**/*.test.ts"],
  },
});
