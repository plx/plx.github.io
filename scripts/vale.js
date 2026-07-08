import { accessSync, constants } from "node:fs";
import { resolve } from "node:path";

export function getValeExecutable(root) {
  return resolve(
    root,
    "node_modules",
    "@vvago",
    "vale",
    "bin",
    process.platform === "win32" ? "vale.exe" : "vale",
  );
}

export function requireValeExecutable(root) {
  const executable = getValeExecutable(root);

  try {
    accessSync(executable, constants.F_OK | constants.X_OK);
  } catch (error) {
    throw new Error(
      `Vale executable was not found at ${executable}. Run npm ci before invoking Vale.`,
      { cause: error },
    );
  }

  return executable;
}
