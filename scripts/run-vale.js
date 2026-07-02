import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { requireValeExecutable } from "./vale.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
let executable;

try {
  executable = requireValeExecutable(root);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

const result = spawnSync(executable, process.argv.slice(2), {
  cwd: root,
  stdio: "inherit",
  windowsHide: true,
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
