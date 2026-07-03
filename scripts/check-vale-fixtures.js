import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { requireValeExecutable } from "./vale.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const valeExecutable = requireValeExecutable(root);

const cases = [
  {
    file: ".vale/fixtures/apple-terminology-valid.md",
    expectedMatches: [],
  },
  {
    file: ".vale/fixtures/apple-terminology-invalid.md",
    expectedMatches: [
      "ios",
      "ipad",
      "ipad os",
      "IPad os",
      "IPAD OS",
      "IPAD-OS",
      "iphone",
      "xcode",
      "watch os",
      "tv os",
      "vision os",
      "Swift UI",
      "Objective C",
      "app store",
      "Test Flight",
      "MacOS",
      "Apple Silicon",
    ],
  },
];

function runVale(file) {
  const result = spawnSync(
    valeExecutable,
    ["--config=.vale.ini", "--output=JSON", file],
    {
      cwd: root,
      encoding: "utf8",
    },
  );

  if (result.error) {
    throw result.error;
  }

  const stdout = result.stdout.trim();
  let output;

  try {
    output = stdout ? JSON.parse(stdout) : {};
  } catch (error) {
    throw new Error(
      `Could not parse Vale JSON output for ${file}:\n${stdout}`,
      { cause: error },
    );
  }

  return {
    status: result.status,
    stderr: result.stderr.trim(),
    alerts: Object.values(output).flat(),
  };
}

let failed = false;

for (const { file, expectedMatches } of cases) {
  const { status, stderr, alerts } = runVale(file);
  const matches = alerts.map((alert) => alert.Match).sort();
  const sortedExpectedMatches = expectedMatches.toSorted();

  if (expectedMatches.length === 0) {
    if (status !== 0 || alerts.length !== 0) {
      failed = true;
      console.error(`${file} should pass without Vale alerts.`);
      console.error(JSON.stringify(alerts, null, 2));
    }

    continue;
  }

  if (status === 0 || alerts.length === 0) {
    failed = true;
    console.error(`${file} should fail with Vale alerts.`);
  }

  if (JSON.stringify(matches) !== JSON.stringify(sortedExpectedMatches)) {
    failed = true;
    console.error(`${file} reported unexpected Vale matches.`);
    console.error("Expected:");
    console.error(JSON.stringify(sortedExpectedMatches, null, 2));
    console.error("Actual:");
    console.error(JSON.stringify(matches, null, 2));
  }

  if (stderr) {
    console.error(stderr);
  }
}

if (failed) {
  process.exit(1);
}

console.log("Vale fixture checks passed.");
