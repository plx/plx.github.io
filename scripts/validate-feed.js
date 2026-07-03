#!/usr/bin/env node

/**
 * Validates the generated RSS feed (dist/rss.xml) for XML well-formedness and
 * namespace correctness using xmllint.
 *
 * Why wrap xmllint instead of calling it directly?
 *   xmllint treats an undeclared namespace prefix — e.g. <itunes:image> with no
 *   matching xmlns:itunes on the <rss> root — as a *recoverable* error: it prints
 *   a "namespace error" to stderr but still exits 0. A bare `xmllint --noout`
 *   would therefore happily pass the exact bug this check exists to catch. So we
 *   treat ANY stderr output (or a non-zero exit) as a validation failure.
 *
 * Usage:
 *   node scripts/validate-feed.js [path-to-xml]   # defaults to dist/rss.xml
 */

import { existsSync } from "fs";
import { spawnSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Allow an explicit path argument (handy for tests); default to the built feed.
const feedPath = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(__dirname, "..", "dist", "rss.xml");

const relFeed = path.relative(process.cwd(), feedPath);

console.log("🔍 Validating RSS feed XML...\n");

// 1. The feed has to have been built first.
if (!existsSync(feedPath)) {
  console.error(`❌ Feed not found: ${relFeed}`);
  console.error("   Run \"npm run build\" first (or pass a path to an XML file).");
  process.exit(1);
}

// 2. xmllint has to be available.
const probe = spawnSync("xmllint", ["--version"], { stdio: "ignore" });
if (probe.error || probe.status !== 0) {
  console.error("❌ xmllint not found on PATH.");
  console.error("   macOS ships it by default; on Debian/Ubuntu install it with");
  console.error("   \"sudo apt-get install -y libxml2-utils\".");
  process.exit(1);
}

// 3. Validate. --nonet keeps the check hermetic (never fetch over the network).
const result = spawnSync("xmllint", ["--noout", "--nonet", feedPath], {
  encoding: "utf8",
});

const stderr = (result.stderr || "").trim();

// xmllint exits 0 on recoverable namespace errors, so fail on ANY stderr too.
if (result.status !== 0 || stderr) {
  console.error(`❌ Feed validation failed for ${relFeed}:\n`);
  if (stderr) {
    console.error(stderr);
  } else {
    console.error(`xmllint exited with status ${result.status}.`);
  }
  console.error("\nThe feed is malformed or uses an undeclared XML namespace.");
  process.exit(1);
}

console.log(`✅ ${relFeed} is well-formed and all XML namespaces are declared.`);
