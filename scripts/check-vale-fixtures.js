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
      "xcode",
      "Swift UI",
      "Objective C",
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
  const matches = new Set(alerts.map((alert) => alert.Match));

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

  for (const expectedMatch of expectedMatches) {
    if (!matches.has(expectedMatch)) {
      failed = true;
      console.error(`${file} did not report expected match: ${expectedMatch}`);
    }
  }

  if (stderr) {
    console.error(stderr);
  }
}

if (failed) {
  process.exit(1);
}

console.log("Vale fixture checks passed.");
