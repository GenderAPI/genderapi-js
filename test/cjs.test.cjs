// CommonJS build smoke test (uses a fake fetch; no network).
const { test } = require("node:test");
const assert = require("node:assert/strict");
const sdk = require("../dist/cjs/index.js");

test("CommonJS exports", () => {
  assert.equal(sdk.VERSION, "2.0.0");
  assert.equal(typeof sdk.GenderAPI, "function");
  assert.equal(sdk.default, sdk.GenderAPI);
  assert.ok(new sdk.GenderAPIHTTPError(500, {}, null) instanceof sdk.GenderAPIError);
  assert.equal(typeof sdk.failedItems, "function");
});

test("CommonJS client performs one request with a fake fetch", async () => {
  const calls = [];
  const client = new sdk.GenderAPI({
    apiKey: null,
    fetch: async (url, init) => {
      calls.push({ url, init });
      return new Response(JSON.stringify({ code: "validation_error", status: 422, errors: [] }), { status: 422 });
    },
  });
  await assert.rejects(client.name("Ada"), (e) => e instanceof sdk.GenderAPIHTTPError && e.status === 422);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].init.headers.Authorization, undefined);
  await assert.rejects(client.name(""), sdk.GenderAPIValidationError);
  assert.equal(calls.length, 1);
});
