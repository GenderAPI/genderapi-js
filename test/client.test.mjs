import { test, describe, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";

import GenderAPIDefault, {
  GenderAPI,
  GenderAPIError,
  GenderAPIHTTPError,
  GenderAPITransportError,
  GenderAPIValidationError,
  GenderAPIAccessModeError,
  failedItems,
  succeededItems,
  VERSION,
  DEFAULT_BASE_URL,
  DEFAULT_TIMEOUT_MS,
  MAX_BATCH_ITEMS,
} from "../dist/esm/index.js";
import { stub, json, example, asApiKey, problem, KEY } from "./helpers.mjs";

let server;
let route; // (req, res, body) => void, replaced per test

before(async () => {
  server = await stub((req, res, body) => route(req, res, body));
});
after(async () => {
  await server.close();
});
beforeEach(() => {
  server.requests.length = 0;
  route = (req, res) => json(res, 500, { code: "unexpected_route" });
});

const client = (options = {}) => new GenderAPI({ apiKey: KEY, baseUrl: server.baseUrl, ...options });

describe("exports", () => {
  test("constants and default export", () => {
    assert.equal(VERSION, "2.0.0");
    assert.equal(DEFAULT_BASE_URL, "https://api.genderapi.io/api/v2");
    assert.equal(DEFAULT_TIMEOUT_MS, 10000);
    assert.equal(MAX_BATCH_ITEMS, 50);
    assert.equal(GenderAPIDefault, GenderAPI);
  });

  test("defaults: https base URL and 10 s timeout", () => {
    const c = new GenderAPI({ apiKey: null });
    assert.equal(c.baseUrl, "https://api.genderapi.io/api/v2");
    assert.equal(c.timeoutMs, 10000);
    assert.equal(c.hasApiKey, false);
  });

  test("error class hierarchy", () => {
    for (const E of [GenderAPIHTTPError, GenderAPITransportError, GenderAPIValidationError, GenderAPIAccessModeError]) {
      assert.ok(E.prototype instanceof GenderAPIError);
    }
  });
});

describe("single predictions (OpenAPI examples)", () => {
  test("dataset result: request shape, headers and full body returned", async () => {
    const body = asApiKey(example("POST /api/v2/gender 200 dataset"));
    route = (req, res) => json(res, 200, body);
    const result = await client().name("Onur", { country: "TR", aiMode: "off" });
    assert.deepEqual(result, body);
    assert.equal(result.data.gender, "male");
    assert.equal(result.data.confidence, 0.9); // unchanged 0–1 value, not a percentage
    assert.equal(result.data.confidence_kind, "observed_frequency");
    assert.equal(result.data.match.method, "normalized");
    assert.equal(result.meta.usage.billing_status, "confirmed");

    assert.equal(server.requests.length, 1);
    const [sent] = server.requests;
    assert.equal(sent.method, "POST");
    assert.equal(sent.url, "/api/v2/gender");
    assert.deepEqual(sent.body, { type: "name", value: "Onur", country: "TR", options: { ai_mode: "off" } });
    assert.equal(sent.headers.authorization, `Bearer ${KEY}`);
    assert.equal(sent.headers["content-type"], "application/json");
    assert.match(sent.headers.accept, /application\/json/);
    assert.equal(sent.headers["user-agent"], "genderapi-js/2.0.0");
    assert.ok(!sent.url.includes(KEY), "key must never be in the URL");
    assert.ok(!sent.url.includes("key="));
  });

  test("AI (nickname) result keeps null name and model_reported confidence", async () => {
    const body = asApiKey(example("POST /api/v2/gender 200 alias"));
    route = (req, res) => json(res, 200, body);
    const result = await client().username("prenses", { country: "TR", forceToGenderize: true });
    assert.equal(result.data.source, "ai");
    assert.equal(result.data.name, null);
    assert.equal(result.data.confidence_kind, "model_reported");
    assert.equal(result.data.sample_count, null);
    assert.equal(result.meta.usage.remaining_credits, -1); // negative balances are passed through
    assert.deepEqual(server.requests[0].body, {
      type: "username",
      value: "prenses",
      country: "TR",
      forceToGenderize: true,
    });
  });

  test("unknown result is a normal (billable) success, not an error", async () => {
    const body = asApiKey(example("POST /api/v2/gender 200 unknown"));
    route = (req, res) => json(res, 200, body);
    const result = await client().gender("name", "zzzxxyy");
    assert.equal(result.data.gender, null);
    assert.equal(result.data.result_status, "unknown");
    assert.equal(result.data.reason, "not_found");
    assert.equal(result.data.confidence, null);
    assert.equal(result.meta.usage.charged_credits, 1);
    assert.deepEqual(server.requests[0].body, { type: "name", value: "zzzxxyy" });
  });

  test("wire-shaped request object is sent unchanged", async () => {
    route = (req, res) => json(res, 200, asApiKey(example("POST /api/v2/gender 200 dataset")));
    const request = { id: "a1", type: "email", value: "alex@example.com", options: { ai_mode: "always" } };
    await client().gender(request);
    assert.deepEqual(server.requests[0].body, request);
  });

  test("unknown response fields are tolerated and preserved", async () => {
    const body = asApiKey(example("POST /api/v2/gender 200 dataset"));
    body.data.future_field = { nested: true };
    body.meta.future_meta = "x";
    body.top_level_extra = [1, 2];
    body.data.reason = null;
    body.meta.access.reason = "some_future_reason";
    route = (req, res) => json(res, 200, body);
    const result = await client().name("Onur");
    assert.deepEqual(result, body);
  });

  test("IP trial without a key: no Authorization header and trial meta returned", async () => {
    const body = example("POST /api/v2/gender 200 dataset"); // ip_trial example
    route = (req, res) => json(res, 200, body);
    const trial = new GenderAPI({ apiKey: null, baseUrl: server.baseUrl });
    const result = await trial.name("Onur", { country: "TR" });
    assert.equal(result.meta.access.mode, "ip_trial");
    assert.equal(server.requests[0].headers.authorization, undefined);
  });

  test("configured key but trial access mode -> GenderAPIAccessModeError with full body", async () => {
    const body = example("POST /api/v2/gender 200 dataset"); // ip_trial
    route = (req, res) => json(res, 200, body);
    await assert.rejects(client().name("Onur"), (error) => {
      assert.ok(error instanceof GenderAPIAccessModeError);
      assert.equal(error.code, "unexpected_access_mode");
      assert.equal(error.accessMode, "ip_trial");
      assert.deepEqual(error.response, body);
      assert.equal(error.requestId, body.meta.request_id);
      return true;
    });
    assert.equal(server.requests.length, 1);
    // opt-out returns the response
    const result = await client({ requireApiKeyAccess: false }).name("Onur");
    assert.equal(result.meta.access.mode, "ip_trial");
  });

  test("API key is read from GENDERAPI_API_KEY when not passed", async () => {
    route = (req, res) => json(res, 200, asApiKey(example("POST /api/v2/gender 200 dataset")));
    const previous = process.env.GENDERAPI_API_KEY;
    process.env.GENDERAPI_API_KEY = KEY;
    try {
      const c = new GenderAPI({ baseUrl: server.baseUrl });
      assert.equal(c.hasApiKey, true);
      await c.name("Onur");
      assert.equal(server.requests[0].headers.authorization, `Bearer ${KEY}`);
      assert.equal(new GenderAPI({ apiKey: null, baseUrl: server.baseUrl }).hasApiKey, false);
    } finally {
      if (previous === undefined) delete process.env.GENDERAPI_API_KEY;
      else process.env.GENDERAPI_API_KEY = previous;
    }
  });

  test("the key is not exposed by JSON serialisation or inspection", async () => {
    const c = client();
    assert.ok(!JSON.stringify(c).includes(KEY));
    const { inspect } = await import("node:util");
    assert.ok(!inspect(c, { showHidden: true, depth: 5 }).includes(KEY));
    assert.ok(!Object.values(c).some((v) => String(v).includes(KEY)));
  });
});

describe("batch", () => {
  test("partial success resolves; failed items exposed", async () => {
    const body = asApiKey(example("POST /api/v2/gender/batch 200 batch"));
    route = (req, res) => json(res, 200, body);
    const items = [
      { id: "known", type: "name", value: "Onur", country: "TR" },
      { id: "missing", type: "name", value: "zzzxxyy" },
      { id: "failed", type: "username", value: "x", options: { ai_mode: "always" } },
    ];
    const result = await client().genderBatch(items);
    assert.deepEqual(result, body);
    assert.deepEqual(server.requests[0].body, { items });
    assert.equal(server.requests[0].url, "/api/v2/gender/batch");
    assert.deepEqual(result.meta.summary, { total: 3, succeeded: 2, identified: 1, unknown: 1, failed: 1 });
    const failed = failedItems(result);
    assert.equal(failed.length, 1);
    assert.equal(failed[0].id, "failed");
    assert.equal(failed[0].error.code, "ai_upstream_error");
    assert.equal(failed[0].charged_credits, 0);
    assert.deepEqual(
      succeededItems(result).map((r) => r.id),
      ["known", "missing"],
    );
  });

  test("all-failed batch -> GenderAPIHTTPError keeping data", async () => {
    const body = asApiKey(example("POST /api/v2/gender/batch 502 batchFailed"));
    route = (req, res) => json(res, 502, body);
    await assert.rejects(client().genderBatch([{ type: "name", value: "Ada", options: { ai_mode: "always" } }]), (e) => {
      assert.ok(e instanceof GenderAPIHTTPError);
      assert.equal(e.status, 502);
      assert.equal(e.code, "ai_upstream_error");
      assert.equal(e.action, "inspect_billing_before_retry");
      assert.equal(e.billingStatus, "confirmed");
      assert.equal(e.data.length, 1);
      assert.equal(failedItems(e).length, 1);
      assert.deepEqual(e.body, body);
      return true;
    });
    assert.equal(server.requests.length, 1, "no retry");
  });

  test("batch validation happens before any request", async () => {
    const c = client();
    const cases = [
      [[], "/items"],
      [Array.from({ length: 51 }, () => ({ type: "name", value: "A" })), "/items"],
      [[{ type: "name", value: "A", id: "x" }, { type: "name", value: "B", id: "x" }], "/items/1/id"],
      [[{ type: "name", value: "A", id: "x".repeat(65) }], "/items/0/id"],
      [[{ type: "name", value: "A" }, { type: "phone", value: "B" }], "/items/1/type"],
      [[{ type: "name", value: "A", askToAI: true }], "/items/0/askToAI"],
      [[{ type: "name", value: "A", forceToGenderize: true, options: { ai_mode: "off" } }], "/items/0/options/ai_mode"],
      "not-an-array",
    ];
    for (const entry of cases) {
      const [items, field] = Array.isArray(entry) ? entry : [entry, "/items"];
      await assert.rejects(c.genderBatch(items), (e) => {
        assert.ok(e instanceof GenderAPIValidationError, String(e));
        assert.equal(e.field, field);
        return true;
      });
    }
    // 50 items is allowed
    route = (req, res) => json(res, 200, asApiKey(example("POST /api/v2/gender/batch 200 batch")));
    await c.genderBatch(Array.from({ length: 50 }, (_, i) => ({ type: "name", value: `N${i}` })));
    assert.equal(server.requests.length, 1);
  });
});

describe("HTTP errors", () => {
  test("401 invalid_api_key", async () => {
    route = (req, res) => json(res, 401, problem(401, "invalid_api_key", "check_credentials"));
    await assert.rejects(client().name("Ada"), (e) => {
      assert.ok(e instanceof GenderAPIHTTPError);
      assert.equal(e.status, 401);
      assert.equal(e.code, "invalid_api_key");
      assert.equal(e.action, "check_credentials");
      assert.equal(e.title, "invalid api key");
      assert.equal(e.detail, "Synthetic invalid_api_key problem.");
      assert.equal(e.billingStatus, "not_charged");
      assert.equal(e.requestId, "22222222-2222-4222-8222-222222222222");
      return true;
    });
  });

  test("403 insufficient_credits (OpenAPI example)", async () => {
    const body = example("POST /api/v2/gender 403 insufficient");
    route = (req, res) => json(res, 403, body);
    await assert.rejects(client().name("Ada"), (e) => {
      assert.equal(e.status, 403);
      assert.equal(e.code, "insufficient_credits");
      assert.equal(e.action, "add_credits_or_wait_for_reset");
      assert.equal(e.usage.remaining_credits, 0);
      assert.equal(e.usage.resets_at, "2026-09-26T12:00:00.000Z");
      assert.equal(e.access.mode, "ip_trial");
      assert.deepEqual(e.body, body);
      return true;
    });
  });

  test("422 validation pointers (OpenAPI example)", async () => {
    route = (req, res) => json(res, 422, example("POST /api/v2/gender 422 validation"));
    await assert.rejects(client().email("not-an-email"), (e) => {
      assert.equal(e.status, 422);
      assert.equal(e.code, "validation_error");
      assert.deepEqual(e.errors, [{ pointer: "/value", message: "Invalid email address." }]);
      return true;
    });
  });

  test("429 exposes Retry-After and is not retried", async () => {
    route = (req, res) =>
      json(res, 429, problem(429, "rate_limit_exceeded", "wait_then_retry"), { "Retry-After": "7" });
    await assert.rejects(client().name("Ada"), (e) => {
      assert.equal(e.status, 429);
      assert.equal(e.code, "rate_limit_exceeded");
      assert.equal(e.retryAfter, 7);
      assert.equal(e.retryAfterRaw, "7");
      return true;
    });
    assert.equal(server.requests.length, 1);
  });

  test("Retry-After as HTTP-date", async () => {
    const when = new Date(Date.now() + 30_000).toUTCString();
    route = (req, res) => json(res, 429, problem(429, "concurrency_limit", "wait_then_retry"), { "Retry-After": when });
    await assert.rejects(client().name("Ada"), (e) => {
      assert.ok(e.retryAfter >= 28 && e.retryAfter <= 31, String(e.retryAfter));
      return true;
    });
  });

  test("502 provider failure is not retried", async () => {
    route = (req, res) =>
      json(res, 502, problem(502, "ai_upstream_error", "inspect_billing_before_retry", { billing_status: "confirmed" }));
    await assert.rejects(client().name("Ada", { aiMode: "always" }), (e) => {
      assert.equal(e.status, 502);
      assert.equal(e.billingStatus, "confirmed");
      return true;
    });
    assert.equal(server.requests.length, 1);
  });

  test("503 unconfirmed billing (OpenAPI example) is not retried", async () => {
    route = (req, res) => json(res, 503, example("POST /api/v2/gender 503 unconfirmed"));
    await assert.rejects(client().name("Ada"), (e) => {
      assert.equal(e.status, 503);
      assert.equal(e.code, "billing_reconciliation_required");
      assert.equal(e.action, "contact_support");
      assert.equal(e.billingStatus, "unconfirmed");
      assert.equal(e.usage.charged_credits, null);
      assert.equal(e.requestId, "11111111-1111-4111-8111-111111111111");
      return true;
    });
    assert.equal(server.requests.length, 1);
  });

  test("non-JSON proxy error keeps raw body and header request id", async () => {
    route = (req, res) => {
      res.writeHead(504, { "Content-Type": "text/html", "X-Request-ID": "proxy-id" });
      res.end("<html>Gateway Timeout</html>");
    };
    await assert.rejects(client().name("Ada"), (e) => {
      assert.ok(e instanceof GenderAPIHTTPError);
      assert.equal(e.status, 504);
      assert.equal(e.code, "http_error");
      assert.equal(e.requestId, "proxy-id");
      assert.equal(e.body, "<html>Gateway Timeout</html>");
      assert.equal(e.billingStatus, null);
      return true;
    });
  });

  test("request id falls back from meta to body to header", async () => {
    const body = problem(401, "invalid_api_key", "check_credentials");
    delete body.meta;
    route = (req, res) => json(res, 401, body);
    await assert.rejects(client().name("Ada"), (e) => e.requestId === body.request_id);
    delete body.request_id;
    await assert.rejects(client().name("Ada"), (e) => e.requestId === "hdr-request-id");
  });
});

describe("transport safety", () => {
  test("redirects are rejected, never followed", async () => {
    route = (req, res) => {
      if (req.url.startsWith("/elsewhere")) return json(res, 200, asApiKey(example("POST /api/v2/gender 200 dataset")));
      res.writeHead(307, { Location: `${server.baseUrl.replace("/api/v2", "")}/elsewhere` });
      res.end();
    };
    await assert.rejects(client().name("Ada"), (e) => {
      assert.ok(e instanceof GenderAPITransportError);
      assert.equal(e.code, "redirect_rejected");
      assert.equal(e.status, 307);
      return true;
    });
    assert.equal(server.requests.length, 1);
    assert.ok(!server.requests.some((r) => r.url.startsWith("/elsewhere")));
  });

  test("timeout before headers -> timeout error, single attempt", async () => {
    route = async (req, res) => {
      await new Promise((r) => setTimeout(r, 400));
      json(res, 200, asApiKey(example("POST /api/v2/gender 200 dataset")));
    };
    const started = Date.now();
    await assert.rejects(client({ timeoutMs: 100 }).name("Ada"), (e) => {
      assert.ok(e instanceof GenderAPITransportError);
      assert.equal(e.code, "timeout");
      return true;
    });
    assert.ok(Date.now() - started < 380);
    assert.equal(server.requests.length, 1);
  });

  test("timeout also covers a slow body", async () => {
    route = async (req, res) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.write('{"data":');
      await new Promise((r) => setTimeout(r, 400));
      res.end("null}");
    };
    await assert.rejects(client({ timeoutMs: 100 }).name("Ada"), (e) => e.code === "timeout");
  });

  test("network failure -> network_error, no retry", async () => {
    const dead = await stub(() => {});
    const url = dead.baseUrl;
    await dead.close();
    await assert.rejects(new GenderAPI({ apiKey: KEY, baseUrl: url }).name("Ada"), (e) => {
      assert.ok(e instanceof GenderAPITransportError);
      assert.equal(e.code, "network_error");
      assert.ok(e.cause);
      return true;
    });
  });

  test("custom fetch receives redirect: manual and a signal; called once", async () => {
    const calls = [];
    const fake = async (url, init) => {
      calls.push({ url, init });
      return new Response(JSON.stringify(asApiKey(example("POST /api/v2/gender 200 dataset"))), { status: 200 });
    };
    const c = new GenderAPI({ apiKey: KEY, fetch: fake });
    await c.name("Ada");
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, "https://api.genderapi.io/api/v2/gender");
    assert.equal(calls[0].init.redirect, "manual");
    assert.ok(calls[0].init.signal instanceof AbortSignal);
    assert.equal(calls[0].init.headers.Authorization, `Bearer ${KEY}`);
  });

  test("opaqueredirect responses (browser fetch) are rejected", async () => {
    const fake = async () => ({ type: "opaqueredirect", status: 0, headers: new Headers(), body: null });
    await assert.rejects(new GenderAPI({ apiKey: KEY, fetch: fake }).name("Ada"), (e) => e.code === "redirect_rejected");
  });

  test("2xx with a non-JSON body -> invalid_response", async () => {
    route = (req, res) => {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("ok");
    };
    await assert.rejects(client().name("Ada"), (e) => {
      assert.ok(e instanceof GenderAPITransportError);
      assert.equal(e.code, "invalid_response");
      assert.equal(e.status, 200);
      return true;
    });
  });

  test("base URL must be https except localhost for tests", () => {
    assert.throws(() => new GenderAPI({ baseUrl: "http://api.genderapi.io/api/v2" }), GenderAPIValidationError);
    assert.throws(() => new GenderAPI({ baseUrl: "ftp://127.0.0.1/" }), GenderAPIValidationError);
    assert.throws(() => new GenderAPI({ baseUrl: "https://u:p@example.com/" }), GenderAPIValidationError);
    assert.throws(() => new GenderAPI({ baseUrl: "https://example.com/?key=x" }), GenderAPIValidationError);
    assert.throws(() => new GenderAPI({ baseUrl: "not a url" }), GenderAPIValidationError);
    assert.equal(new GenderAPI({ baseUrl: "http://localhost:8080/api/v2/" }).baseUrl, "http://localhost:8080/api/v2");
    assert.equal(new GenderAPI({ baseUrl: "http://[::1]:1/x" }).baseUrl, "http://[::1]:1/x");
    assert.equal(new GenderAPI({ baseUrl: "https://example.test/api/v2" }).baseUrl, "https://example.test/api/v2");
  });

  test("invalid options are rejected at construction", () => {
    assert.throws(() => new GenderAPI({ timeoutMs: 0 }), GenderAPIValidationError);
    assert.throws(() => new GenderAPI({ timeoutMs: 1.5 }), GenderAPIValidationError);
    assert.throws(() => new GenderAPI({ apiKey: "has space" }), GenderAPIValidationError);
    assert.throws(() => new GenderAPI({ apiKey: "line\nbreak" }), GenderAPIValidationError);
    assert.throws(() => new GenderAPI({ fetch: "nope" }), GenderAPIValidationError);
    assert.equal(new GenderAPI(KEY).hasApiKey, true); // string shorthand
  });
});

describe("client-side validation (no network)", () => {
  test("invalid single inputs never reach the server", async () => {
    const c = client();
    const bad = [
      () => c.gender("phone", "Ada"),
      () => c.name(""),
      () => c.name("   "),
      () => c.name("a".repeat(255)),
      () => c.name("Ada\u0000"),
      () => c.name("Ada\u007f"),
      () => c.name(42),
      () => c.name("Ada", { country: "tr" }),
      () => c.name("Ada", { country: "TUR" }),
      () => c.name("Ada", { aiMode: "sometimes" }),
      () => c.name("Ada", { forceToGenderize: true, aiMode: "off" }),
      () => c.name("Ada", { forceToGenderize: true, aiMode: "always" }),
      () => c.name("Ada", { forceToGenderize: "yes" }),
      () => c.name("Ada", { id: "" }),
      () => c.name("Ada", { askToAI: true }),
      () => c.gender({ type: "name", value: "Ada", options: { ai_mode: "off", extra: 1 } }),
      () => c.gender({ type: "name", name: "Ada" }),
      () => c.validatePhone("12"),
      () => c.validatePhone("+90 abc"),
      () => c.validatePhone("5551234567"), // national number without country
      () => c.validatePhone("5551234567", "us"),
    ];
    for (const call of bad) {
      await assert.rejects(call(), GenderAPIValidationError);
    }
    assert.equal(server.requests.length, 0);
  });

  test("allowed edge cases pass validation", async () => {
    route = (req, res) => json(res, 200, asApiKey(example("POST /api/v2/gender 200 dataset")));
    const c = client();
    await c.name("a".repeat(254));
    await c.name("😀".repeat(254)); // 254 code points
    await c.name("Ada", { forceToGenderize: true, aiMode: "fallback" });
    await c.name("Ada", { country: null });
    assert.equal(server.requests.length, 4);
    assert.deepEqual(server.requests[3].body, { type: "name", value: "Ada" });
  });
});

describe("other endpoints", () => {
  test("usage() GET /usage with Bearer, no body", async () => {
    const body = asApiKey(example("GET /api/v2/usage 200 usage"));
    route = (req, res) => json(res, 200, body);
    const result = await client().usage();
    assert.deepEqual(result, body);
    const [sent] = server.requests;
    assert.equal(sent.method, "GET");
    assert.equal(sent.url, "/api/v2/usage");
    assert.equal(sent.headers.authorization, `Bearer ${KEY}`);
    assert.equal(sent.headers["content-type"], undefined);
  });

  test("validatePhone() POST /phone/validate", async () => {
    const body = asApiKey(example("POST /api/v2/phone/validate 200 phone"));
    route = (req, res) => json(res, 200, body);
    const result = await client().validatePhone("+1 (555) 010-0000");
    assert.equal(result.data.valid, false);
    await client().validatePhone("5550100000", "US");
    assert.deepEqual(server.requests[0].body, { number: "+1 (555) 010-0000" });
    assert.deepEqual(server.requests[1].body, { number: "5550100000", country: "US" });
    assert.equal(server.requests[1].url, "/api/v2/phone/validate");
  });

  test("capabilities() and errorCatalog() send no key", async () => {
    route = (req, res) =>
      req.url === "/api/v2"
        ? json(res, 200, { version: "2.0.0", capabilities: { max_batch_items: 50 } })
        : json(res, 200, { errors: { invalid_json: { code: "invalid_json", http_statuses: [400], action: "correct_request", description: "x" } } });
    const caps = await client().capabilities();
    const catalog = await client().errorCatalog();
    assert.equal(caps.capabilities.max_batch_items, 50);
    assert.equal(catalog.errors.invalid_json.http_statuses[0], 400);
    assert.deepEqual(
      server.requests.map((r) => [r.method, r.url, r.headers.authorization]),
      [
        ["GET", "/api/v2", undefined],
        ["GET", "/api/v2/errors", undefined],
      ],
    );
  });
});
