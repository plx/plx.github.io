// Exercise the same stdio servers Claude loads, without an account or model call.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const uriFor = (file) => pathToFileURL(path.resolve(root, file)).href;
const manifest = JSON.parse(await readFile(new URL(
  "../.claude/skills/project-lsp/.claude-plugin/plugin.json", import.meta.url,
), "utf8"));

class LanguageServer {
  constructor(config) {
    this.config = config;
    this.pending = new Map();
    this.nextId = 0;
    this.buffer = Buffer.alloc(0);
    this.diagnostics = new Map();
    this.process = spawn(config.command, config.args.map((arg) =>
      arg.replaceAll("${CLAUDE_PROJECT_DIR}", root)), { cwd: root });
    this.process.stderr.on("data", (data) => { this.stderr = (this.stderr ?? "") + data; });
    this.process.stdin.on("error", (error) => this.fail(error));
    this.process.on("error", (error) => this.fail(error));
    this.process.on("exit", (code) => this.fail(new Error(`LSP exited (${code}): ${this.stderr ?? ""}`)));
    this.process.stdout.on("data", (data) => {
      this.buffer = Buffer.concat([this.buffer, data]);
      while (true) {
        const end = this.buffer.indexOf("\r\n\r\n");
        if (end < 0) return;
        const length = Number(/Content-Length: (\d+)/i.exec(this.buffer.subarray(0, end).toString())?.[1]);
        assert(Number.isFinite(length), "Invalid LSP message header");
        if (this.buffer.length < end + 4 + length) return;
        const message = JSON.parse(this.buffer.subarray(end + 4, end + 4 + length));
        this.buffer = this.buffer.subarray(end + 4 + length);
        if (message.method && message.id !== undefined) {
          const result = message.method === "workspace/configuration"
            ? message.params.items.map(({ section }) => section?.split(".").reduce(
              (value, key) => value?.[key], config.settings) ?? null)
            : null;
          this.send({ id: message.id, result });
        } else if (message.method === "textDocument/publishDiagnostics") {
          this.diagnostics.set(message.params.uri, message.params.diagnostics);
        } else if (this.pending.has(message.id)) {
          const { resolve, reject, timer } = this.pending.get(message.id);
          clearTimeout(timer);
          this.pending.delete(message.id);
          if (message.error) reject(new Error(JSON.stringify(message.error)));
          else resolve(message.result);
        }
      }
    });
  }

  fail(error) {
    this.stopped = true;
    for (const { reject, timer } of this.pending.values()) {
      clearTimeout(timer);
      reject(error);
    }
    this.pending.clear();
  }

  send(message) {
    const body = JSON.stringify({ jsonrpc: "2.0", ...message });
    this.process.stdin.write(`Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`);
  }

  request(method, params) {
    const id = ++this.nextId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`${method} timed out: ${this.stderr ?? ""}`));
      }, 20000);
      this.pending.set(id, { resolve, reject, timer });
      this.send({ id, method, params });
    });
  }

  async initialize() {
    await this.request("initialize", {
      processId: process.pid,
      rootUri: uriFor("."),
      workspaceFolders: [{ uri: uriFor("."), name: "Dispatches" }],
      capabilities: {
        workspace: { configuration: true },
        textDocument: { publishDiagnostics: {} },
      },
    });
    this.send({ method: "initialized", params: {} });
    if (this.config.settings) {
      this.send({ method: "workspace/didChangeConfiguration", params: { settings: this.config.settings } });
    }
  }

  async open(file, languageId) {
    const text = await readFile(path.resolve(root, file), "utf8");
    this.send({ method: "textDocument/didOpen", params: {
      textDocument: { uri: uriFor(file), languageId, version: 1, text },
    } });
    return text;
  }

  async definition(file, token, expectedFile) {
    const text = await readFile(path.resolve(root, file), "utf8");
    const offset = text.indexOf(token);
    assert(offset >= 0, `Missing probe token ${token}`);
    const lines = text.slice(0, offset).split("\n");
    const params = { textDocument: { uri: uriFor(file) }, position: {
      line: lines.length - 1, character: lines.at(-1).length,
    } };
    assert(await this.request("textDocument/hover", params), `No hover for ${token}`);
    const result = await this.request("textDocument/definition", params);
    const locations = Array.isArray(result) ? result : [result];
    assert(locations.some((location) => (location?.uri ?? location?.targetUri)?.endsWith(expectedFile)),
      `Wrong definition for ${token}: ${JSON.stringify(result)}`);
  }

  async project(file, expectedConfig) {
    // Waiting for projectInfo also lets tsserver finish loading semantic data.
    const result = await this.request("workspace/executeCommand", {
      command: "typescript.tsserverRequest",
      arguments: ["projectInfo", { file: uriFor(file), needFileNameList: false }, { expectsResult: true }],
    });
    assert.equal(result.body.configFileName, path.resolve(root, expectedConfig));
  }

  async diagnostic(file, code) {
    const deadline = Date.now() + 10000;
    while (Date.now() < deadline) {
      if (this.diagnostics.get(uriFor(file))?.some((item) => item.code === code)) return;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    assert.fail(`No expected diagnostic ${code} for ${file}`);
  }

  async close() {
    if (this.stopped) return;
    try {
      await this.request("shutdown", null);
      this.send({ method: "exit" });
    } finally {
      this.process.kill();
    }
  }
}

const typescript = new LanguageServer(manifest.lspServers.typescript);
try {
  await typescript.initialize();
  await typescript.open("src/pages/rss.xml.ts", "typescript");
  await typescript.project("src/pages/rss.xml.ts", "tsconfig.json");
  await typescript.definition("src/pages/rss.xml.ts", "published", "/src/lib/collections.ts");
  await typescript.open("tests/accessibility.spec.ts", "typescript");
  await typescript.project("tests/accessibility.spec.ts", "tests/tsconfig.json");
  await typescript.definition("tests/accessibility.spec.ts", "axeViolationSummary", "/tests/helpers.ts");
  await typescript.open("src/lib/collections.ts", "typescript");
  await typescript.project("src/lib/collections.ts", "tsconfig.json");
  await typescript.definition("src/lib/collections.ts", "getCollection", "/.astro/content.d.ts");
  const text = await readFile(path.join(root, "src/lib/collections.ts"), "utf8");
  typescript.send({ method: "textDocument/didChange", params: {
    textDocument: { uri: uriFor("src/lib/collections.ts"), version: 2 },
    contentChanges: [{ text: `${text}\nconst __lspProbe: string = 42;\n` }],
  } });
  await typescript.diagnostic("src/lib/collections.ts", 2322);
  console.log("TypeScript: hover, aliases, Astro content types, Playwright scope, and diagnostics passed.");
} finally {
  await typescript.close();
}

// There is no Python project here. Keep readiness probes temporary and local.
await mkdir(path.join(root, ".context"), { recursive: true });
const fixture = await mkdtemp(path.join(root, ".context/lsp-python-"));
const python = new LanguageServer(manifest.lspServers.python);
try {
  const main = path.join(fixture, "main.py");
  await writeFile(path.join(fixture, "helper.py"), "def greet(name: str) -> str:\n    return name\n");
  await writeFile(main, "from pathlib import Path\nfrom helper import greet\nvalue = greet('world')\nwrong: str = 42\n");
  await python.initialize();
  await python.open(main, "python");
  await python.definition(main, "greet", "/helper.py");
  await python.definition(main, "Path", "/pathlib/__init__.pyi");
  await python.diagnostic(main, "reportAssignmentType");
  console.log("Python: hover, local/stdlib navigation, and diagnostics passed (temporary fixture; no Python project).");
} finally {
  try {
    await python.close();
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
}
