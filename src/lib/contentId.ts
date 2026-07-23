export function stripIndexId({ entry }: { entry: string }): string {
  return (
    entry
      .replace(/\/index\.mdx?$/, "")
      // Defensive fallback: `my-post.md` -> `my-post` outside the folder convention.
      .replace(/\.mdx?$/, "")
  );
}
