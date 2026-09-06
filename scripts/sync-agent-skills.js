import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Portable skills are the source; Claude receives the same files without the
// OpenAI sidecars. Plugin-only directories in .claude/skills are independent.
const repo = fileURLToPath(new URL("../", import.meta.url));
const source = path.join(repo, ".agents/skills");
const destination = path.join(repo, ".claude/skills");
const check = process.argv.includes("--check");
if (process.argv.slice(2).some((arg) => arg !== "--check")) {
  throw new Error("Usage: node scripts/sync-agent-skills.js [--check]");
}

async function files(directory, prefix = "") {
  let entries;
  try {
    entries = await readdir(path.join(directory, prefix), { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  const result = [];
  for (const entry of entries) {
    if (!prefix && entry.name === "agents") continue;
    const relative = path.join(prefix, entry.name);
    if (entry.isDirectory()) result.push(...await files(directory, relative));
    else if (entry.isFile()) result.push(relative);
    else throw new Error(`Skill resources must be regular files: ${relative}`);
  }
  return result.sort();
}

let problems = 0;
const skills = (await readdir(source, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
for (const skill of skills) {
  const from = path.join(source, skill);
  const to = path.join(destination, skill);
  const expected = await files(from);
  if (!expected.includes("SKILL.md")) throw new Error(`Missing ${skill}/SKILL.md`);
  const actual = await files(to);
  for (const relative of expected) {
    const content = await readFile(path.join(from, relative));
    const existing = actual.includes(relative) ? await readFile(path.join(to, relative)) : null;
    if (existing?.equals(content)) continue;
    if (check) {
      console.error(`Skill mirror differs: ${skill}/${relative} (run just skills-sync)`);
      problems++;
    } else {
      await mkdir(path.dirname(path.join(to, relative)), { recursive: true });
      await writeFile(path.join(to, relative), content);
      console.log(`Synced ${skill}/${relative}`);
    }
  }
  for (const relative of actual.filter((file) => !expected.includes(file))) {
    console.error(`Extra Claude skill file: ${skill}/${relative}; remove or move it to .agents/skills`);
    problems++;
  }
}

for (const entry of await readdir(destination, { withFileTypes: true })) {
  if (!entry.isDirectory() || skills.includes(entry.name)) continue;
  if ((await files(path.join(destination, entry.name))).includes("SKILL.md")) {
    console.error(`Unmirrored Claude skill: ${entry.name}; remove or move it to .agents/skills`);
    problems++;
  }
}

if (problems) process.exitCode = 1;
else console.log(`${skills.length} agent skills ${check ? "match" : "synced"}.`);
