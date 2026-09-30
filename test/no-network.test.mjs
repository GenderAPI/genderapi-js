// Importing the package and constructing clients must never send a request.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import http from "node:http";
import https from "node:https";
import net from "node:net";

test("import (ESM and CJS) and construction make no network request", async () => {
  let attempts = 0;
  const count = () => {
    attempts++;
    throw new Error("network access during import/construction");
  };
  const saved = { fetch: globalThis.fetch, http: http.request, https: https.request, connect: net.connect };
  globalThis.fetch = count;
  http.request = https.request = net.connect = count;
  try {
    const esm = await import("../dist/esm/index.js");
    const cjs = createRequire(import.meta.url)("../dist/cjs/index.js");
    for (const mod of [esm, cjs]) {
      new mod.GenderAPI();
      new mod.GenderAPI({ apiKey: "0123456789abcdef01234567" });
      new mod.GenderAPI({ apiKey: null, timeoutMs: 5000 });
    }
  } finally {
    globalThis.fetch = saved.fetch;
    http.request = saved.http;
    https.request = saved.https;
    net.connect = saved.connect;
  }
  assert.equal(attempts, 0);
});
