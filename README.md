# genderapi (JavaScript / TypeScript)

Official GenderAPI.io V2 client for JavaScript and TypeScript.

It infers a likely gender from a **name**, an **email address** or a **username**, and validates phone numbers, using the [GenderAPI.io V2 API](https://www.genderapi.io/api-documentation). Results are inferences, not verification of anyone's identity, and they can be `unknown`.

- ESM and CommonJS builds with TypeScript declarations
- Zero runtime dependencies; uses the global `fetch` (Node.js 18+, Deno, Bun, edge runtimes)
- No automatic retries, no redirects followed, 10 s default timeout
- Server-side use only (see [Keep your key on the server](#keep-your-key-on-the-server))

> **Version 2.0.0 is a breaking release.** It targets the V2 API only. 1.x (V1 API) stays available and installable indefinitely; no deprecation or shutdown is planned. To keep using it, pin 1.x with `npm install genderapi@1`. The source stays on the [`v1` branch](https://github.com/GenderAPI/genderapi-js/tree/v1). See [Migrating from 1.x](#migrating-from-1x).

## Install

```bash
npm install genderapi
```

Requires Node.js 18 or later (or another runtime with a global `fetch`).

## Quick start

Set your key as a server-side environment variable. You can copy it from your [GenderAPI.io account](https://app.genderapi.io).

```bash
export GENDERAPI_API_KEY="YOUR_API_KEY"
```

```js
import { GenderAPI } from "genderapi";            // ESM
// const { GenderAPI } = require("genderapi");    // CommonJS

const client = new GenderAPI(); // reads GENDERAPI_API_KEY

// Single prediction (1 credit; single requests default to ai_mode "fallback")
const { data, meta } = await client.name("Andrea", { country: "IT" });
console.log(data.gender, data.result_status, data.confidence, data.confidence_kind);
console.log(meta.usage.billing_status, meta.usage.charged_credits, meta.usage.remaining_credits);

// Email address and username
await client.email("alex@example.com");
await client.username("prenses", { country: "TR", forceToGenderize: true });

// Batch: 1-50 items in one request (batch items default to ai_mode "off")
const batch = await client.genderBatch([
  { id: "row-1", type: "name", value: "Andrea", country: "IT" },
  { id: "row-2", type: "email", value: "alex@example.com" },
  { id: "row-3", type: "username", value: "prenses", options: { ai_mode: "fallback" } },
]);
console.log(batch.meta.summary); // { total, succeeded, identified, unknown, failed }

// Current balance (free)
const usage = await client.usage();
console.log(usage.data.remaining_credits, usage.meta.access.mode);
```

Constructing a client and importing the package never send a request. Every method call sends exactly one request.

## Client options

```js
const client = new GenderAPI({
  apiKey: process.env.GENDERAPI_API_KEY, // default: GENDERAPI_API_KEY; null = no key (IP trial)
  timeoutMs: 10000,                      // whole request including the body; default 10000
  requireApiKeyAccess: true,             // default true when a key is set (see below)
  // baseUrl: "http://127.0.0.1:8080/api/v2", // tests only; https is required elsewhere
  // fetch: customFetch,                  // tests or instrumentation
});
```

`new GenderAPI("YOUR_API_KEY")` is a shorthand for `{ apiKey: "YOUR_API_KEY" }`.

| Option | Default | Notes |
| --- | --- | --- |
| `apiKey` | `process.env.GENDERAPI_API_KEY` | Sent only as `Authorization: Bearer ...`, never in a URL. `null` or `""` sends no key. |
| `timeoutMs` | `10000` | Positive integer. A timeout is reported as `GenderAPITransportError` with code `timeout`. |
| `baseUrl` | `https://api.genderapi.io/api/v2` | Must be `https://`. `http://` is accepted only for `localhost`, `127.0.0.1` and `[::1]` so you can test against a local stub. |
| `requireApiKeyAccess` | `true` if a key is set | A missing or unrecognized key falls back to the IP trial. With this on, a successful response whose `meta.access.mode` is not `api_key` is rejected with `GenderAPIAccessModeError`. The request has already been processed, so trial credits may have been used; `error.response` holds the full body. Set `false` to return the response instead. Never applies without a key, or to `capabilities()`/`errorCatalog()`. Batches use the top-level `meta.access.mode`. |
| `fetch` | global `fetch` | Any fetch-compatible function. |
| `userAgent` | `genderapi-js/2.0.0` | Browsers ignore this header. |

### IP trial without a key

The client also works without a key. The server then applies the shared IP trial of **10 credits per IP address per 24 hours** (shared with V1 and with everyone behind the same public IP). The response reports `meta.access.mode: "ip_trial"` and `meta.usage.resets_at`. The SDK has no trial logic of its own; the server decides the limits, including the 10-item batch limit for trials.

```js
const trial = new GenderAPI({ apiKey: null });
```

## Methods

| Method | HTTP | Credits |
| --- | --- | --- |
| `gender(type, value, options?)` or `gender(request)` | `POST /gender` | 1 by default; 2 with `aiMode: "always"` or when `forceToGenderize` uses AI |
| `name(value, options?)`, `email(value, options?)`, `username(value, options?)` | `POST /gender` | as above |
| `genderBatch(items)` | `POST /gender/batch` | per item |
| `usage()` | `GET /usage` | free |
| `validatePhone(number, country?)` | `POST /phone/validate` | 1 |
| `capabilities()` | `GET /` | free, no key sent |
| `errorCatalog()` | `GET /errors` | free, no key sent |

`options` for single predictions: `{ country?, aiMode?, forceToGenderize?, id? }`.

- `country`: two-letter uppercase ISO 3166-1 code, for example `"US"`.
- `aiMode`: `"off"`, `"fallback"` or `"always"`, sent as `options.ai_mode`. Single requests default to `fallback` (1 credit total); `always` costs 2.
- `forceToGenderize`: dataset first (1 credit), then nickname-aware AI on an unknown result (2 credits total). It works for names, emails and usernames and cannot be combined with `aiMode` `off` or `always`.

Batch items and `gender(request)` use the exact wire fields: `{ type, value, country?, id?, forceToGenderize?, options?: { ai_mode? } }`.

### Client-side validation

Before sending anything, the client checks what is cheap and certain, and throws `GenderAPIValidationError` (with `field`, a JSON pointer) without a network call:

- `type` is `name`, `email` or `username`; `value` is a non-empty string of at most 254 characters without control characters;
- `country` is two uppercase letters; `ai_mode` is `off`, `fallback` or `always`; `forceToGenderize` is not combined with `off`/`always`;
- no unknown fields (for example the V1 field `askToAI`);
- a batch has 1-50 items, and ids are unique and at most 64 characters;
- phone numbers are 3-32 characters of digits, spaces, `()-` and an optional leading `+`; national numbers need `country`.

Everything else (country membership, email syntax, trial limits) is validated by the API and reported as HTTP 422.

## Response fields

Methods resolve to the parsed V2 JSON exactly as returned: `{ data, meta }`. Unknown fields are kept, and values are not converted.

`data` for a prediction:

| Field | Meaning |
| --- | --- |
| `gender` | `"male"`, `"female"` or `null` |
| `result_status` | `identified` (gender returned) or `unknown` (gender is `null`) |
| `reason` | `null` when identified; otherwise `not_found`, `no_name_candidate`, `ambiguous` or `insufficient_evidence` |
| `confidence` | 0-1 number or `null`. Read it together with `confidence_kind`. It is not a calibrated probability or a percentage. |
| `confidence_kind` | `observed_frequency` (dominant dataset count / total) or `model_reported` (AI score), or `null` |
| `sample_count` | dataset samples, or `null` (AI never produces one) |
| `source` | `dataset`, `ai` or `none` |
| `name` | returned dataset name or extracted given name; can be `null` even when `gender` is set (nickname mode) |
| `match` | `{ name, method, scope, country }`: the normalized dataset candidate, `normalized` / `token` / `substring` / `model_inference`, `country` / `global` |
| `country`, `country_source` | country used and where it came from (`dataset`, `ai_association` or `null`). Neither indicates nationality, residence or ethnicity. |
| `input` | echo of `type`, `value`, `country` (and `forceToGenderize`) |

`meta`:

| Field | Meaning |
| --- | --- |
| `request_id` | identifies this HTTP attempt; quote it to support |
| `access.mode` | `api_key`, `ip_trial` or `unauthenticated`; `access.reason` explains a trial |
| `usage.billing_status` | `not_charged`, `confirmed` or `unconfirmed` |
| `usage.charged_credits` | credits for this request; `null` when unconfirmed |
| `usage.remaining_credits` | balance at completion; can be negative (a 2-credit request on a 1-credit balance) or `null` |
| `usage.resets_at`, `limit`, `period_seconds` | IP trial window; `null` for API-key access |
| `summary` (batch) | `total`, `succeeded`, `identified`, `unknown`, `failed` |

An `unknown` result is a successful, billable outcome, not an error.

### Batches and partial success

A batch returns HTTP 200 when at least one item succeeded. Each item keeps its `index` and optional `id`, has `charged_credits`, and exactly one of `data` or `error`. A partial success is **not** thrown; use the helpers:

```js
import { failedItems, succeededItems } from "genderapi";

const batch = await client.genderBatch(items);
for (const row of succeededItems(batch)) console.log(row.id, row.data.gender);
for (const row of failedItems(batch)) console.log(row.id, row.error.code, row.error.action);
```

When every executed item fails, the API returns the error status and the client throws `GenderAPIHTTPError`; its `data` still holds the per-item results (`failedItems(error)` works on it).

## Errors

All errors extend `GenderAPIError` and have `code`, `status`, `requestId`, `retryAfter`, `retryAfterRaw` and `body`.

| Class | When | Useful fields |
| --- | --- | --- |
| `GenderAPIValidationError` | Invalid input or options, detected locally. **Nothing was sent.** | `field`, `code` (`client_validation`, `invalid_option`, `fetch_unavailable`) |
| `GenderAPIHTTPError` | HTTP status >= 400 | `status`, `code`, `title`, `detail`, `action`, `errors` (validation pointers), `requestId`, `retryAfter`, `billingStatus`, `usage`, `access`, `meta`, `data` (all-failed batch), `body` |
| `GenderAPITransportError` | No usable response: `timeout`, `network_error`, `redirect_rejected`, `invalid_response` | `code`, `status`, `requestId`, `cause` |
| `GenderAPIAccessModeError` | A key was set but the successful response reports another access mode (see `requireApiKeyAccess`). The request has already been processed and trial credits may have been used; do not resend automatically. | `accessMode`, `response` (full body) |

```js
import { GenderAPIHTTPError, GenderAPITransportError } from "genderapi";

try {
  await client.name("Andrea");
} catch (error) {
  if (error instanceof GenderAPIHTTPError) {
    console.error(error.status, error.code, error.action, error.requestId, error.billingStatus);
    if (error.status === 429) console.error(`Wait ${error.retryAfter} s before a new request.`);
  } else if (error instanceof GenderAPITransportError) {
    console.error(error.code, "billing unknown: check usage() before sending again");
  } else {
    throw error;
  }
}
```

`requestId` comes from the body (`meta.request_id` or `request_id`) and falls back to the `X-Request-ID` header. Match on `code`, never on the human-readable `detail`. The full list of codes, statuses and recommended actions is published at [`/api/v2/errors`](https://api.genderapi.io/api/v2/errors) (`client.errorCatalog()`). A proxy error may not be JSON; then `code` is `http_error` and `body` is the raw text.

`body` and `response` can contain the inputs you submitted. Inspect them securely and do not log them wholesale. The client never logs anything, and never includes your key in errors.

## Billing and retries

This client **never retries** a request, including on 429, 5xx and timeouts. A prediction whose response was lost may still have been billed, and every new request is a new, normally billed operation.

- **429**: wait for `retryAfter` seconds, then send a new request.
- **`billing_status: "unconfirmed"`** or `action: "contact_support"`: do not retry automatically; contact support with `requestId`.
- **Other prediction failures**: check `billingStatus` and fix the cause before retrying.
- **Timeouts and network errors**: completion is unknown. Call `usage()` (free) to check the balance before sending again.
- **Partial batch success**: retry only the failed items once billing is confirmed. Resubmitting successful items charges them again.
- Redirects are rejected (`redirect_rejected`), never followed.

## Keep your key on the server

Use this package in server-side code (Node.js, Deno, Bun, serverless and edge functions). An API key in browser JavaScript is visible to every visitor. For a web application, call your own backend and let it call GenderAPI.io. If the client is constructed with a key in an environment that looks like a browser, it prints a one-time console warning.

Version 1.x was also offered as a browser/CDN script. That usage is no longer promoted for 2.x.

## Migrating from 1.x

2.0.0 talks to the V2 API. V1 and V2 share your API key and credit balance, but the request and response formats differ, so changing the base URL alone is not enough.

You do not have to migrate. 1.x (V1 API) stays available and installable indefinitely, with no deprecation or shutdown planned. To stay on it:

```bash
npm install genderapi@1
```

The 1.x source stays on the [`v1` branch](https://github.com/GenderAPI/genderapi-js/tree/v1).

| 1.x (V1) | 2.x (V2) |
| --- | --- |
| `import GenderAPI from "genderapi"`; `new GenderAPI(key)` | `import { GenderAPI } from "genderapi"` (default import still works in ESM); `new GenderAPI({ apiKey })` or `new GenderAPI(key)`. CommonJS: `const { GenderAPI } = require("genderapi")`. |
| `getGenderByName`, `getGenderByEmail`, `getGenderByUsername` | `name()`, `email()`, `username()` or `gender(type, value)`; all use `POST /api/v2/gender` with `type` and `value` |
| `getGenderByNameBulk`, `getGenderByEmailBulk`, `getGenderByUsernameBulk` (separate routes) | `genderBatch(items)`: one route `POST /api/v2/gender/batch`, 1-50 mixed items |
| V1 routes `/api`, `/api/email`, `/api/username`, `/api/name/multi/country`, ... | `/api/v2/gender`, `/api/v2/gender/batch`, `/api/v2/usage`, `/api/v2/phone/validate` |
| `askToAI: true` | `aiMode: "fallback"` (single requests already default to it) or `"always"`; batch items: `options: { ai_mode }` |
| `forceToGenderize` (names and usernames) | same field for names, emails and usernames: dataset first, then nickname-aware AI |
| flat response fields | `data` for the result, `meta` for access and billing |
| `probability` (percentage) | `confidence` on a 0-1 scale plus `confidence_kind`; AI scores are not calibrated probabilities |
| `total_names` | `data.sample_count` (nullable) |
| `q` | `data.input.value` |
| `used_credits` / `remaining_credits` / `expires` | `meta.usage.charged_credits` / `meta.usage.remaining_credits`; `usage()` returns `expires_at` |
| `duration` | `meta.duration_ms` |
| `status: false`, `errno`, `errmsg` in the resolved value | thrown `GenderAPIHTTPError` with HTTP `status`, `code`, `action`; local input errors throw `GenderAPIValidationError` |
| repeated POSTs | each request is a new operation with normal billing; the SDK never retries |

The V1 reference is at <https://www.genderapi.io/api-documentation/v1>.

## Documentation

- API documentation: <https://www.genderapi.io/api-documentation>
- Authentication and IP trial: <https://www.genderapi.io/docs/v2/authentication>
- Request parameters: <https://www.genderapi.io/docs/v2/request-parameters>
- AI options: <https://www.genderapi.io/docs/v2/ai-options>
- Responses: <https://www.genderapi.io/docs/v2/responses>
- Batch: <https://www.genderapi.io/docs/v2/batch>
- Credits and usage: <https://www.genderapi.io/docs/v2/credits-and-usage>
- Errors and retries: <https://www.genderapi.io/docs/v2/errors-and-retries>
- Phone validation: <https://www.genderapi.io/docs/v2/phone-validation>
- Migration from V1: <https://www.genderapi.io/docs/v2/migration>
- OpenAPI: <https://api.genderapi.io/api/v2/openapi.json>

## Development

```bash
npm ci
npm test          # builds dist/ and runs the tests against a local stub server (no real API, no credits)
npm run typecheck
```

Test fixtures in `test/fixtures/openapi-examples.json` are the examples from the V2 OpenAPI document (`node scripts/extract-fixtures.mjs openapi.json` regenerates them).

Releases are published to npm by `.github/workflows/publish.yml` when a `v*` tag matching `package.json` is pushed. It authenticates through npm trusted publishing (OIDC) for this repository and workflow, so no npm token is stored.

## License

MIT
