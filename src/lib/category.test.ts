import { afterEach, describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  extractCategoryFromSlug,
  getCategory,
  getCategoryFromSlug,
  loadCategoryOverrides,
} from "./category";

const tempDirectories: string[] = [];

function makeCategoryFile(contents: string): string {
  const root = mkdtempSync(join(tmpdir(), "dispatches-category-"));
  const categoryPath = join(root, "category");
  tempDirectories.push(root);
  mkdirSync(categoryPath);
  writeFileSync(join(categoryPath, "category.yaml"), contents);
  return categoryPath;
}

afterEach(() => {
  for (const directory of tempDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("category metadata", () => {
  it("derives defaults from a kebab-case slug", () => {
    expect(getCategoryFromSlug("swift-warts")).toEqual({
      slug: "swift-warts",
      displayName: "Swift Warts",
      titlePrefix: "Swift Warts",
      sortPriority: 0,
    });
  });

  it("applies validated presentation overrides", () => {
    const path = makeCategoryFile([
      "displayName: Swift Language",
      "titlePrefix: Swift Wart",
      "sortPriority: 30",
    ].join("\n"));

    expect(getCategory("swift-warts", path)).toMatchObject({
      slug: "swift-warts",
      displayName: "Swift Language",
      titlePrefix: "Swift Wart",
      sortPriority: 30,
    });
  });

  it.each([
    ["an invalid value", "sortPriority: highest\n"],
    ["a routing override", "displayName: Swift\nslug: hijacked\n"],
  ])("fails closed for %s", (_description, contents) => {
    const path = makeCategoryFile(contents);

    expect(() => loadCategoryOverrides(path)).toThrow(/category\.yaml/);
  });
});

describe("brief ID helpers", () => {
  it.each([
    ["swift-warts/example", "swift-warts"],
    ["uncategorized", null],
  ])("extracts the category from %s", (value, expected) => {
    expect(extractCategoryFromSlug(value)).toBe(expected);
  });
});
