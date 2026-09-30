// Test helpers: a local stub server on 127.0.0.1 (no real API, no credits).
import { createServer } from "node:http";
import { readFileSync } from "node:fs";

export const examples = JSON.parse(readFileSync(new URL("./fixtures/openapi-examples.json", import.meta.url), "utf8"));
export const example = (key) => structuredClone(examples[key]);

export const KEY = "0123456789abcdef01234567"; // synthetic 24-character test key

/** Clone an example and switch its access mode to api_key (as for a recognized key). */
export function asApiKey(body) {
  const copy = structuredClone(body);
  if (copy?.meta?.access) copy.meta.access = { mode: "api_key", reason: null };
  if (copy?.meta?.usage) Object.assign(copy.meta.usage, { resets_at: null, limit: null, period_seconds: null });
  return copy;
}

/**
 * Start a stub server. `handler(req, res, body)` may be async. Every received
 * request is recorded in `requests` as { method, url, headers, body }.
 */
export async function stub(handler) {
  const requests = [];
  const sockets = new Set();
  const server = createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString("utf8");
    let body = null;
    try {
      body = raw ? JSON.parse(raw) : null;
    } catch {
      body = raw;
    }
    requests.push({ method: req.method, url: req.url, headers: req.headers, body });
    try {
      await handler(req, res, body);
    } catch (error) {
      if (!res.headersSent) res.writeHead(599);
      res.end(String(error));
    }
  });
  server.on("connection", (socket) => {
    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  return {
    baseUrl: `http://127.0.0.1:${port}/api/v2`,
    requests,
    async close() {
      for (const socket of sockets) socket.destroy();
      await new Promise((resolve) => server.close(resolve));
    },
  };
}

export function json(res, status, body, headers = {}) {
  const contentType = status >= 400 ? "application/problem+json" : "application/json";
  res.writeHead(status, { "Content-Type": contentType, "X-Request-ID": "hdr-request-id", ...headers });
  res.end(JSON.stringify(body));
}

/** Build a Problem body in the documented shape for a catalog code. */
export function problem(status, code, action, usage, extra = {}) {
  return {
    type: `urn:genderapi:problem:${code}`,
    title: code.replaceAll("_", " "),
    status,
    detail: `Synthetic ${code} problem.`,
    instance: "urn:uuid:22222222-2222-4222-8222-222222222222",
    code,
    request_id: "22222222-2222-4222-8222-222222222222",
    documentation: "https://api.genderapi.io/api/v2/errors",
    action,
    meta: {
      request_id: "22222222-2222-4222-8222-222222222222",
      duration_ms: 5,
      access: { mode: "api_key", reason: null },
      usage: {
        charged_credits: 0,
        remaining_credits: 5,
        billing_status: "not_charged",
        resets_at: null,
        limit: null,
        period_seconds: null,
        ...usage,
      },
    },
    ...extra,
  };
}
