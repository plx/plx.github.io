import type { APIRequestContext } from "@playwright/test";

export const representativeRoutes = [
  "/",
  "/about/",
  "/blog/",
  "/blog/generic-testing/",
  "/briefs/",
  "/briefs/objective-c/",
  "/briefs/claude-code/claude-code-never-compact/",
  "/projects/",
  "/projects/hdxl-xctest-retrofit/",
] as const;

export async function sitemapRoutes(request: APIRequestContext): Promise<string[]> {
  const indexResponse = await request.get("/sitemap-index.xml");
  if (!indexResponse.ok()) {
    throw new Error(`Could not load sitemap index: HTTP ${indexResponse.status()}`);
  }

  const index = await indexResponse.text();
  const sitemapPaths = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map(([, location]) => new URL(location).pathname);
  const routeSets = await Promise.all(sitemapPaths.map(async (sitemapPath) => {
    const response = await request.get(sitemapPath);
    if (!response.ok()) {
      throw new Error(`Could not load sitemap ${sitemapPath}: HTTP ${response.status()}`);
    }
    const xml = await response.text();
    return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map(([, location]) => new URL(location).pathname);
  }));

  return [...new Set(routeSets.flat())].toSorted();
}

export function axeViolationSummary(
  violations: Array<{ id: string; help: string; nodes: Array<{ target: unknown }> }>,
): string {
  return violations
    .map((violation) => {
      const targets = violation.nodes.map((node) => JSON.stringify(node.target)).join(", ");
      return `${violation.id}: ${violation.help} (${targets})`;
    })
    .join("\n");
}
