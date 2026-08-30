import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, relative, resolve, sep } from "node:path";

const MIME_TYPES = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".txt", "text/plain; charset=utf-8"],
  [".webmanifest", "application/manifest+json; charset=utf-8"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
  [".xml", "application/xml; charset=utf-8"],
]);

const portArgument = process.argv.indexOf("--port");
const port = Number(portArgument === -1 ? 4321 : process.argv[portArgument + 1]);
if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error(`Invalid --port value: ${process.argv[portArgument + 1]}`);
}

const root = resolve("dist");

function isInsideRoot(path) {
  const pathFromRoot = relative(root, path);
  return pathFromRoot === "" || (!pathFromRoot.startsWith(`..${sep}`) && pathFromRoot !== "..");
}

async function fileForPathname(pathname) {
  const decodedPath = decodeURIComponent(pathname);
  let filePath = resolve(root, decodedPath.replace(/^\/+/, ""));
  if (!isInsideRoot(filePath)) return { status: 403 };

  try {
    const fileStats = await stat(filePath);
    if (fileStats.isDirectory()) {
      if (!pathname.endsWith("/")) return { status: 308, location: `${pathname}/` };
      filePath = join(filePath, "index.html");
    }

    if (!(await stat(filePath)).isFile()) return { status: 404 };
    return { status: 200, filePath };
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return { status: 404 };
    }
    throw error;
  }
}

const server = createServer(async (request, response) => {
  try {
    if (request.method !== "GET" && request.method !== "HEAD") {
      response.writeHead(405, { Allow: "GET, HEAD" }).end();
      return;
    }

    const url = new URL(request.url || "/", "http://127.0.0.1");
    const result = await fileForPathname(url.pathname);
    if (result.status === 308) {
      response.writeHead(308, { Location: `${result.location}${url.search}` }).end();
      return;
    }
    if (result.status !== 200 || !result.filePath) {
      response.writeHead(result.status, { "Content-Type": "text/plain; charset=utf-8" });
      response.end(result.status === 404 ? "Not found\n" : "Forbidden\n");
      return;
    }

    response.writeHead(200, {
      "Content-Type": MIME_TYPES.get(extname(result.filePath)) || "application/octet-stream",
    });
    if (request.method === "HEAD") {
      response.end();
      return;
    }
    createReadStream(result.filePath).pipe(response);
  } catch (error) {
    const status = error instanceof URIError ? 400 : 500;
    response.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
    response.end(status === 400 ? "Bad request\n" : "Internal server error\n");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Serving dist at http://127.0.0.1:${port}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
