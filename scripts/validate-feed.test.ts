import { spawnSync } from "child_process";
import { afterEach, describe, expect, it } from "vitest";
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const validatorPath = path.join(__dirname, "validate-feed.js");
const tempDirs: string[] = [];

function makeTempDir(): string {
  const tempDir = mkdtempSync(path.join(tmpdir(), "validate-feed-"));
  tempDirs.push(tempDir);
  return tempDir;
}

function writeExecutable(filePath: string, contents: string): void {
  writeFileSync(filePath, contents);
  chmodSync(filePath, 0o755);
}

function runValidator(feedPath: string, binDir: string) {
  return spawnSync(process.execPath, [validatorPath, feedPath], {
    encoding: "utf8",
    env: {
      ...process.env,
      PATH: `${binDir}${path.delimiter}${process.env.PATH ?? ""}`,
    },
  });
}

describe("validate-feed", () => {
  afterEach(() => {
    for (const tempDir of tempDirs) {
      rmSync(tempDir, { recursive: true, force: true });
    }
    tempDirs.length = 0;
  });

  it("fails when xmllint exits 0 but reports a namespace error on stderr", () => {
    const tempDir = makeTempDir();
    const binDir = path.join(tempDir, "bin");
    const feedPath = path.join(tempDir, "rss.xml");
    const xmllintPath = path.join(binDir, "xmllint");

    mkdirSync(binDir);
    writeFileSync(feedPath, "<rss><channel><itunes:image /></channel></rss>");
    writeExecutable(
      xmllintPath,
      `#!/usr/bin/env node
if (process.argv.includes("--version")) {
  process.exit(0);
}

console.error("namespace error : Namespace prefix itunes on image is not defined");
process.exit(0);
`,
    );

    const result = runValidator(feedPath, binDir);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("namespace error");
    expect(result.stderr).toContain("undeclared XML namespace");
  });
});
