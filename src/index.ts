/**
 * Official GenderAPI.io V2 client for JavaScript and TypeScript.
 *
 * Server-side use only: keep your API key out of browser bundles.
 * Importing this module or constructing a client never sends a request.
 * Prediction and phone requests are never retried automatically, because a
 * lost response may still have been billed.
 */

export const VERSION = "2.0.0";
export const DEFAULT_BASE_URL = "https://api.genderapi.io/api/v2";
export const DEFAULT_TIMEOUT_MS = 10_000;
export const MAX_BATCH_ITEMS = 50;

/* ------------------------------------------------------------------------ */
/* Types                                                                     */
/* ------------------------------------------------------------------------ */

/** A documented string union that still accepts values added by the API later. */
export type Open<T extends string> = T | (string & {});

export type InputType = "name" | "email" | "username";
export type AiMode = "off" | "fallback" | "always";
export type Gender = "male" | "female";
export type ResultStatus = "identified" | "unknown";
export type UnknownReason = "not_found" | "no_name_candidate" | "ambiguous" | "insufficient_evidence";
export type ConfidenceKind = "observed_frequency" | "model_reported";
export type PredictionSource = "dataset" | "ai" | "none";
export type MatchMethod = "normalized" | "token" | "substring" | "model_inference";
export type MatchScope = "country" | "global";
export type CountrySource = "dataset" | "ai_association";
export type BillingStatus = "not_charged" | "confirmed" | "unconfirmed";
export type AccessMode = "api_key" | "ip_trial" | "unauthenticated";
export type AccessReason = "api_key_missing" | "api_key_invalid" | "api_key_not_found";

/** Wire request body for `POST /gender` and each item of `POST /gender/batch`. */
export interface GenderRequest {
  type: InputType;
  value: string;
  /** ISO 3166-1 alpha-2, uppercase (for example `"TR"`). */
  country?: string;
  /** 1–64 characters; echoed back on batch items. */
  id?: string;
  /** Dataset first; on unknown, nickname-aware AI (2 credits total). Only with ai_mode fallback. */
  forceToGenderize?: boolean;
  options?: { ai_mode?: AiMode };
}

/** Options for {@link GenderAPI.gender}, {@link GenderAPI.name}, {@link GenderAPI.email}, {@link GenderAPI.username}. */
export interface GenderOptions {
  country?: string | null;
  /** Sent as `options.ai_mode`. The server defaults to `fallback` for single requests. */
  aiMode?: AiMode;
  forceToGenderize?: boolean;
  id?: string;
}

export interface PredictionInput {
  type: InputType;
  value: string;
  country: string | null;
  forceToGenderize?: boolean;
  [key: string]: unknown;
}

export interface Match {
  /** Normalized dataset candidate that matched; null for AI or no match. */
  name: string | null;
  method: Open<MatchMethod> | null;
  scope: Open<MatchScope> | null;
  country: string | null;
  [key: string]: unknown;
}

/**
 * One prediction. `gender` may be null (a billable unknown result).
 * `confidence` is on a 0–1 scale; interpret it with `confidence_kind`.
 * It is not a calibrated probability and not a verification of identity.
 */
export interface Prediction {
  input: PredictionInput;
  name: string | null;
  gender: Gender | null;
  country: string | null;
  confidence: number | null;
  confidence_kind: Open<ConfidenceKind> | null;
  sample_count: number | null;
  source: Open<PredictionSource>;
  result_status?: ResultStatus;
  reason?: Open<UnknownReason> | null;
  country_source?: Open<CountrySource> | null;
  match?: Match;
  [key: string]: unknown;
}

export interface Access {
  mode: Open<AccessMode>;
  reason: Open<AccessReason> | null;
  [key: string]: unknown;
}

export interface Usage {
  /** null when billing_status is unconfirmed. */
  charged_credits: number | null;
  /** Completion-time balance; can be negative; null if unknown. */
  remaining_credits: number | null;
  billing_status: BillingStatus;
  /** UTC timestamp for an IP trial; null otherwise. */
  resets_at: string | null;
  limit: number | null;
  period_seconds: number | null;
  [key: string]: unknown;
}

export interface BatchSummary {
  total: number;
  succeeded: number;
  identified: number;
  unknown: number;
  failed: number;
  [key: string]: unknown;
}

export interface Meta {
  request_id: string;
  duration_ms: number;
  access: Access;
  usage: Usage;
  summary?: BatchSummary;
  [key: string]: unknown;
}

export interface ValidationPointer {
  pointer: string;
  message: string;
  [key: string]: unknown;
}

/** Problem shape used for batch item errors (accounting lives on the item). */
export interface ItemProblem {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  code: string;
  request_id?: string;
  documentation?: string;
  action?: string;
  errors?: ValidationPointer[];
  [key: string]: unknown;
}

/** RFC 9457 Problem Details body for HTTP errors. */
export interface Problem extends ItemProblem {
  meta?: Meta;
  /** Present when every executed batch item failed. */
  data?: BatchItemResult[];
  /** Legacy alias of `data` on all-failed batches. */
  results?: BatchItemResult[];
}

export interface GenderResponse {
  data: Prediction;
  meta: Meta;
  [key: string]: unknown;
}

export interface BatchItemSuccess {
  index: number;
  id?: string;
  charged_credits: number;
  data: Prediction;
  error?: undefined;
  [key: string]: unknown;
}

export interface BatchItemFailure {
  index: number;
  id?: string;
  charged_credits: number;
  error: ItemProblem;
  data?: undefined;
  [key: string]: unknown;
}

export type BatchItemResult = BatchItemSuccess | BatchItemFailure;

export interface BatchResponse {
  data: BatchItemResult[];
  meta: Meta & { summary: BatchSummary };
  [key: string]: unknown;
}

export interface UsageData {
  remaining_credits: number | null;
  expires_at: string | null;
  resets_at: string | null;
  limit: number | null;
  period_seconds: number | null;
  [key: string]: unknown;
}

export interface UsageResponse {
  data: UsageData;
  meta: Meta;
  [key: string]: unknown;
}

export interface PhoneValidation {
  valid: boolean;
  possible: boolean;
  e164: string | null;
  country: string | null;
  country_calling_code: string | null;
  [key: string]: unknown;
}

export interface PhoneResponse {
  data: PhoneValidation;
  meta: Meta;
  [key: string]: unknown;
}

export interface Capabilities {
  version?: string;
  documentation?: string;
  capabilities?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface ErrorCatalogEntry {
  code: string;
  http_statuses: number[];
  action: string;
  description: string;
  [key: string]: unknown;
}

export interface ErrorCatalog {
  errors: Record<string, ErrorCatalogEntry>;
  [key: string]: unknown;
}

/** Minimal fetch signature; the global `fetch` of Node 18+, Deno, Bun and edge runtimes fits. */
export type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

export interface ClientOptions {
  /**
   * API key. When omitted, `process.env.GENDERAPI_API_KEY` is used if present.
   * Pass `null` (or an empty string) to send no key: the server then applies the
   * shared IP trial (10 credits per IP per 24 hours).
   */
  apiKey?: string | null;
  /** HTTPS base URL. `http://` is accepted only for localhost/127.0.0.1/[::1] (tests). */
  baseUrl?: string;
  /** Deadline for the whole request including the response body. Default 10000 ms. */
  timeoutMs?: number;
  /** Custom fetch implementation (tests, instrumentation). Defaults to the global fetch. */
  fetch?: FetchLike;
  /** Override the User-Agent header (default `genderapi-js/2.0.0`). Ignored by browsers. */
  userAgent?: string;
  /**
   * When an API key is configured, reject a 2xx response whose `meta.access.mode`
   * is not `api_key` (an unrecognized key falls back to the IP trial). The request
   * has already been processed and may have consumed trial credits; the error
   * carries the full response body. Default: true when a key is configured.
   */
  requireApiKeyAccess?: boolean;
}

/* ------------------------------------------------------------------------ */
/* Errors                                                                    */
/* ------------------------------------------------------------------------ */

interface ErrorFields {
  code: string;
  status?: number | null;
  requestId?: string | null;
  retryAfter?: number | null;
  retryAfterRaw?: string | null;
  body?: unknown;
  cause?: unknown;
}

/** Base class for every error thrown by this package. */
export class GenderAPIError extends Error {
  /** Stable machine code: an API error code or one of this SDK's own codes. */
  readonly code: string;
  /** HTTP status, or null when no HTTP response was used. */
  readonly status: number | null;
  /** From the body `meta.request_id` / `request_id`, else the `X-Request-ID` header. */
  readonly requestId: string | null;
  /** Retry-After header in seconds (integer or HTTP-date), or null. */
  readonly retryAfter: number | null;
  /** Retry-After header exactly as received. */
  readonly retryAfterRaw: string | null;
  /**
   * Parsed JSON body (or raw text when it is not JSON). It may contain the
   * personal inputs you submitted: inspect it securely, do not log it wholesale.
   */
  readonly body: unknown;

  constructor(message: string, fields: ErrorFields) {
    super(message, fields.cause === undefined ? undefined : { cause: fields.cause });
    this.name = new.target.name;
    this.code = fields.code;
    this.status = fields.status ?? null;
    this.requestId = fields.requestId ?? null;
    this.retryAfter = fields.retryAfter ?? null;
    this.retryAfterRaw = fields.retryAfterRaw ?? null;
    this.body = fields.body ?? null;
  }
}

/** Invalid input or configuration detected locally. No request was sent. */
export class GenderAPIValidationError extends GenderAPIError {
  /** JSON pointer (for request fields) or option name. */
  readonly field: string;
  constructor(message: string, field: string, code = "client_validation") {
    super(message, { code });
    this.field = field;
  }
}

/**
 * The API answered with HTTP status >= 400. Inspect `billingStatus` before
 * sending another request: a retry is a new, normally billed operation.
 */
export class GenderAPIHTTPError extends GenderAPIError {
  declare readonly status: number;
  readonly title: string | null;
  readonly detail: string | null;
  readonly action: string | null;
  readonly type: string | null;
  readonly documentation: string | null;
  /** Validation pointers for 422 responses. */
  readonly errors: ValidationPointer[];
  readonly billingStatus: BillingStatus | null;
  readonly usage: Usage | null;
  readonly access: Access | null;
  readonly meta: Meta | null;
  /** Item results when every executed batch item failed; otherwise null. */
  readonly data: BatchItemResult[] | null;

  constructor(status: number, body: unknown, headers: Headers | null) {
    const problem: Partial<Problem> = isObject(body) ? (body as Partial<Problem>) : {};
    const code = typeof problem.code === "string" ? problem.code : "http_error";
    const detail = typeof problem.detail === "string" ? problem.detail : null;
    const retryRaw = headers?.get("retry-after") ?? null;
    super(`GenderAPI HTTP ${status} ${code}${detail ? `: ${detail}` : ""}`, {
      code,
      status,
      requestId: requestIdOf(body, headers),
      retryAfter: parseRetryAfter(retryRaw),
      retryAfterRaw: retryRaw,
      body,
    });
    const meta = isObject(problem.meta) ? (problem.meta as Meta) : null;
    const usage = meta && isObject(meta.usage) ? meta.usage : null;
    this.title = typeof problem.title === "string" ? problem.title : null;
    this.detail = detail;
    this.action = typeof problem.action === "string" ? problem.action : null;
    this.type = typeof problem.type === "string" ? problem.type : null;
    this.documentation = typeof problem.documentation === "string" ? problem.documentation : null;
    this.errors = Array.isArray(problem.errors) ? problem.errors : [];
    this.meta = meta;
    this.usage = usage;
    this.access = meta && isObject(meta.access) ? meta.access : null;
    const billing = usage?.billing_status ?? (problem as Record<string, unknown>).billing_status;
    this.billingStatus = typeof billing === "string" ? (billing as BillingStatus) : null;
    this.data = Array.isArray(problem.data)
      ? problem.data
      : Array.isArray(problem.results)
        ? problem.results
        : null;
  }
}

/**
 * No usable response: timeout, network failure, a rejected redirect or an
 * unparseable success body. Completion and billing are unknown; check
 * `usage()` or contact support with `requestId` before sending another request.
 */
export class GenderAPITransportError extends GenderAPIError {}

/**
 * A key was configured but the successful response reports another access mode
 * (usually `ip_trial` because the key was not recognized). The request was
 * processed; `response` holds the full body, including billing metadata.
 */
export class GenderAPIAccessModeError extends GenderAPIError {
  readonly accessMode: string | null;
  readonly response: unknown;
  constructor(mode: string | null, body: unknown, status: number, headers: Headers | null) {
    super(
      `Expected API-key access but the response reports access mode ${JSON.stringify(mode)}. ` +
        "Check your API key; this request may have consumed IP-trial credits.",
      { code: "unexpected_access_mode", status, requestId: requestIdOf(body, headers), body },
    );
    this.accessMode = mode;
    this.response = body;
  }
}

/* ------------------------------------------------------------------------ */
/* Helpers                                                                   */
/* ------------------------------------------------------------------------ */

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requestIdOf(body: unknown, headers: Headers | null): string | null {
  if (isObject(body)) {
    if (isObject(body.meta) && typeof body.meta.request_id === "string") return body.meta.request_id;
    if (typeof body.request_id === "string") return body.request_id;
  }
  return headers?.get("x-request-id") ?? null;
}

function parseRetryAfter(raw: string | null): number | null {
  if (raw === null) return null;
  const trimmed = raw.trim();
  if (/^\d+$/.test(trimmed)) return Number(trimmed);
  const date = Date.parse(trimmed);
  if (Number.isNaN(date)) return null;
  return Math.max(0, Math.ceil((date - Date.now()) / 1000));
}

/** Batch items that failed (from a batch response or an all-failed {@link GenderAPIHTTPError}). */
export function failedItems(result: { data?: BatchItemResult[] | null } | null | undefined): BatchItemFailure[] {
  const rows = result?.data;
  return Array.isArray(rows) ? rows.filter((row): row is BatchItemFailure => isObject(row) && isObject(row.error)) : [];
}

/** Batch items that returned a prediction (identified or unknown). */
export function succeededItems(result: { data?: BatchItemResult[] | null } | null | undefined): BatchItemSuccess[] {
  const rows = result?.data;
  return Array.isArray(rows)
    ? rows.filter((row): row is BatchItemSuccess => isObject(row) && !isObject(row.error) && isObject(row.data))
    : [];
}

/* ------------------------------------------------------------------------ */
/* Client-side validation (mirrors the schema only where cheap and certain)  */
/* ------------------------------------------------------------------------ */

const INPUT_TYPES: readonly string[] = ["name", "email", "username"];
const AI_MODES: readonly string[] = ["off", "fallback", "always"];
const ITEM_KEYS = new Set(["id", "type", "value", "country", "forceToGenderize", "options"]);
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/u;
const COUNTRY = /^[A-Z]{2}$/;
const PHONE = /^\+?[0-9 ()-]+$/;

function fail(message: string, field: string): never {
  throw new GenderAPIValidationError(message, field);
}

function codePoints(value: string): number {
  let count = 0;
  for (const _ of value) count++;
  return count;
}

function validateCountry(country: unknown, field: string): void {
  if (typeof country !== "string" || !COUNTRY.test(country)) {
    fail(`${field} must be a two-letter uppercase ISO 3166-1 alpha-2 code such as "US".`, field);
  }
}

function validateItem(item: unknown, prefix: string): GenderRequest {
  if (!isObject(item)) fail("Each request must be an object with type and value.", prefix || "/");
  for (const key of Object.keys(item)) {
    if (!ITEM_KEYS.has(key) && item[key] !== undefined) {
      fail(
        `Unknown field "${key}". Allowed fields: id, type, value, country, forceToGenderize, options.ai_mode.`,
        `${prefix}/${key}`,
      );
    }
  }
  if (typeof item.type !== "string" || !INPUT_TYPES.includes(item.type)) {
    fail('type must be "name", "email" or "username".', `${prefix}/type`);
  }
  const value = item.value;
  if (typeof value !== "string" || !/\S/u.test(value)) fail("value must be a non-empty string.", `${prefix}/value`);
  if (codePoints(value) > 254) fail("value must be at most 254 characters.", `${prefix}/value`);
  if (CONTROL_CHARS.test(value)) fail("value must not contain control characters.", `${prefix}/value`);

  const out: GenderRequest = { type: item.type as InputType, value };
  if (item.id !== undefined) {
    if (typeof item.id !== "string" || item.id.length < 1 || codePoints(item.id) > 64) {
      fail("id must be a string of 1 to 64 characters.", `${prefix}/id`);
    }
    out.id = item.id;
  }
  if (item.country !== undefined && item.country !== null) {
    validateCountry(item.country, `${prefix}/country`);
    out.country = item.country as string;
  }
  if (item.forceToGenderize !== undefined) {
    if (typeof item.forceToGenderize !== "boolean") {
      fail("forceToGenderize must be a boolean.", `${prefix}/forceToGenderize`);
    }
    out.forceToGenderize = item.forceToGenderize;
  }
  if (item.options !== undefined) {
    if (!isObject(item.options)) fail("options must be an object.", `${prefix}/options`);
    for (const key of Object.keys(item.options)) {
      if (key !== "ai_mode" && item.options[key] !== undefined) {
        fail(`Unknown option "${key}". The only option is ai_mode.`, `${prefix}/options/${key}`);
      }
    }
    const mode = item.options.ai_mode;
    if (mode !== undefined) {
      if (typeof mode !== "string" || !AI_MODES.includes(mode)) {
        fail('options.ai_mode must be "off", "fallback" or "always".', `${prefix}/options/ai_mode`);
      }
      out.options = { ai_mode: mode as AiMode };
    } else {
      out.options = {};
    }
  }
  if (out.forceToGenderize === true && out.options?.ai_mode !== undefined && out.options.ai_mode !== "fallback") {
    fail(
      "forceToGenderize cannot be combined with ai_mode off or always; omit ai_mode or use fallback.",
      `${prefix}/options/ai_mode`,
    );
  }
  return out;
}

function toRequest(type: unknown, value: unknown, options: GenderOptions | undefined): Record<string, unknown> {
  if (options !== undefined && !isObject(options)) fail("options must be an object.", "options");
  const opts = (options ?? {}) as GenderOptions & Record<string, unknown>;
  for (const key of Object.keys(opts)) {
    if (!["country", "aiMode", "forceToGenderize", "id"].includes(key) && opts[key] !== undefined) {
      fail(`Unknown option "${key}". Allowed: country, aiMode, forceToGenderize, id.`, key);
    }
  }
  const request: Record<string, unknown> = { type, value };
  if (opts.country !== undefined && opts.country !== null) request.country = opts.country;
  if (opts.id !== undefined) request.id = opts.id;
  if (opts.forceToGenderize !== undefined) request.forceToGenderize = opts.forceToGenderize;
  if (opts.aiMode !== undefined) request.options = { ai_mode: opts.aiMode };
  return request;
}

function resolveBaseUrl(raw: string): string {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new GenderAPIValidationError("baseUrl must be an absolute URL.", "baseUrl", "invalid_option");
  }
  const localHosts = ["localhost", "127.0.0.1", "[::1]"];
  const local = localHosts.includes(url.hostname) || url.hostname.endsWith(".localhost");
  if (url.protocol !== "https:" && !(url.protocol === "http:" && local)) {
    throw new GenderAPIValidationError(
      "baseUrl must use https:// (http:// is allowed only for localhost, 127.0.0.1 and [::1] in tests).",
      "baseUrl",
      "invalid_option",
    );
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new GenderAPIValidationError(
      "baseUrl must not contain credentials, a query string or a fragment.",
      "baseUrl",
      "invalid_option",
    );
  }
  return url.href.replace(/\/+$/, "");
}

function resolveApiKey(option: string | null | undefined): string | null {
  let key: unknown = option;
  if (key === undefined) {
    const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
    key = env?.GENDERAPI_API_KEY;
  }
  if (key === undefined || key === null || key === "") return null;
  if (typeof key !== "string" || key.length > 256 || !/^[\x21-\x7e]+$/.test(key)) {
    throw new GenderAPIValidationError(
      "apiKey must be a string of printable ASCII characters without spaces.",
      "apiKey",
      "invalid_option",
    );
  }
  return key;
}

let browserWarningShown = false;
function warnIfBrowser(): void {
  const g = globalThis as { window?: { document?: unknown }; console?: Console };
  if (browserWarningShown || typeof g.window === "undefined" || typeof g.window.document === "undefined") return;
  browserWarningShown = true;
  g.console?.warn(
    "[genderapi] An API key is configured in what looks like a browser. Keys in browser code are visible to " +
      "users. Call GenderAPI.io from your own server instead.",
  );
}

/* ------------------------------------------------------------------------ */
/* Client                                                                    */
/* ------------------------------------------------------------------------ */

interface RequestSpec {
  method: "GET" | "POST";
  path: string;
  body?: unknown;
  auth: boolean;
}

/**
 * GenderAPI.io V2 client.
 *
 * ```ts
 * import { GenderAPI } from "genderapi";
 * const client = new GenderAPI({ apiKey: process.env.GENDERAPI_API_KEY });
 * const { data, meta } = await client.name("Andrea", { country: "IT" });
 * ```
 */
export class GenderAPI {
  readonly baseUrl: string;
  readonly timeoutMs: number;
  readonly userAgent: string;
  readonly requireApiKeyAccess: boolean;
  readonly #apiKey: string | null;
  readonly #fetch: FetchLike | undefined;

  constructor(options: ClientOptions | string = {}) {
    const given: unknown = typeof options === "string" ? { apiKey: options } : (options ?? {});
    if (!isObject(given)) {
      throw new GenderAPIValidationError("options must be an object or an API key string.", "options", "invalid_option");
    }
    const opts = given as ClientOptions;
    this.#apiKey = resolveApiKey(opts.apiKey);
    this.baseUrl = resolveBaseUrl(opts.baseUrl ?? DEFAULT_BASE_URL);
    const timeout = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    if (!Number.isInteger(timeout) || timeout <= 0 || timeout > 2_147_483_647) {
      throw new GenderAPIValidationError("timeoutMs must be a positive integer.", "timeoutMs", "invalid_option");
    }
    this.timeoutMs = timeout;
    if (opts.fetch !== undefined && typeof opts.fetch !== "function") {
      throw new GenderAPIValidationError("fetch must be a function.", "fetch", "invalid_option");
    }
    this.#fetch = opts.fetch;
    this.userAgent = opts.userAgent ?? `genderapi-js/${VERSION}`;
    this.requireApiKeyAccess = opts.requireApiKeyAccess ?? this.#apiKey !== null;
    if (this.#apiKey !== null) warnIfBrowser();
  }

  /** True when requests carry an API key (otherwise the server applies the IP trial). */
  get hasApiKey(): boolean {
    return this.#apiKey !== null;
  }

  /**
   * Predict one name, email or username (`POST /gender`).
   * Either `gender(type, value, options?)` or `gender(wireRequest)`.
   */
  gender(request: GenderRequest): Promise<GenderResponse>;
  gender(type: InputType, value: string, options?: GenderOptions): Promise<GenderResponse>;
  async gender(
    typeOrRequest: InputType | GenderRequest,
    value?: string,
    options?: GenderOptions,
  ): Promise<GenderResponse> {
    const raw = isObject(typeOrRequest) ? typeOrRequest : toRequest(typeOrRequest, value, options);
    const body = validateItem(raw, "");
    return this.#request<GenderResponse>({ method: "POST", path: "/gender", body, auth: true });
  }

  /** `gender("name", value, options)`. */
  name(value: string, options?: GenderOptions): Promise<GenderResponse> {
    return this.gender("name", value, options);
  }

  /** `gender("email", value, options)`. */
  email(value: string, options?: GenderOptions): Promise<GenderResponse> {
    return this.gender("email", value, options);
  }

  /** `gender("username", value, options)`. */
  username(value: string, options?: GenderOptions): Promise<GenderResponse> {
    return this.gender("username", value, options);
  }

  /**
   * Predict 1–50 items in order (`POST /gender/batch`). Batch items default to
   * ai_mode off. Partial success resolves normally; use {@link failedItems}.
   * If every executed item fails, a {@link GenderAPIHTTPError} carries `data`.
   */
  async genderBatch(items: GenderRequest[]): Promise<BatchResponse> {
    if (!Array.isArray(items) || items.length < 1 || items.length > MAX_BATCH_ITEMS) {
      fail(`Provide between 1 and ${MAX_BATCH_ITEMS} items per batch.`, "/items");
    }
    const ids = new Set<string>();
    const body = items.map((item, i) => {
      const checked = validateItem(item, `/items/${i}`);
      if (checked.id !== undefined) {
        if (ids.has(checked.id)) fail("Batch item ids must be unique.", `/items/${i}/id`);
        ids.add(checked.id);
      }
      return checked;
    });
    return this.#request<BatchResponse>({ method: "POST", path: "/gender/batch", body: { items: body }, auth: true });
  }

  /** Current account or IP-trial balance (`GET /usage`). Free. */
  async usage(): Promise<UsageResponse> {
    return this.#request<UsageResponse>({ method: "GET", path: "/usage", auth: true });
  }

  /** Validate and format a phone number (`POST /phone/validate`). National numbers need `country`. */
  async validatePhone(number: string, country?: string | null): Promise<PhoneResponse> {
    if (typeof number !== "string" || number.length < 3 || number.length > 32 || !PHONE.test(number)) {
      fail("number must be 3–32 characters of digits, spaces, parentheses, hyphens and an optional leading +.", "/number");
    }
    const body: Record<string, string> = { number };
    if (country !== undefined && country !== null) {
      validateCountry(country, "/country");
      body.country = country;
    } else if (!number.startsWith("+")) {
      fail("country is required for a national phone number (one without a leading +).", "/country");
    }
    return this.#request<PhoneResponse>({ method: "POST", path: "/phone/validate", body, auth: true });
  }

  /** Public capabilities and limits (`GET /`). Free, no key sent. */
  async capabilities(): Promise<Capabilities> {
    return this.#request<Capabilities>({ method: "GET", path: "", auth: false });
  }

  /** Machine-readable error catalog (`GET /errors`). Free, no key sent. */
  async errorCatalog(): Promise<ErrorCatalog> {
    return this.#request<ErrorCatalog>({ method: "GET", path: "/errors", auth: false });
  }

  /** Single attempt. Never retried: a lost prediction response may still be billed. */
  async #request<T>(spec: RequestSpec): Promise<T> {
    const fetchImpl: FetchLike | undefined =
      this.#fetch ?? (typeof globalThis.fetch === "function" ? (u, i) => globalThis.fetch(u, i) : undefined);
    if (!fetchImpl) {
      throw new GenderAPIValidationError(
        "No global fetch is available. Use Node.js 18+ or pass a fetch implementation.",
        "fetch",
        "fetch_unavailable",
      );
    }
    const headers: Record<string, string> = {
      Accept: "application/json, application/problem+json",
      "User-Agent": this.userAgent,
    };
    if (spec.body !== undefined) headers["Content-Type"] = "application/json";
    if (spec.auth && this.#apiKey !== null) headers.Authorization = `Bearer ${this.#apiKey}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    let response: Response | undefined;
    let text: string;
    try {
      try {
        response = await fetchImpl(this.baseUrl + spec.path, {
          method: spec.method,
          headers,
          body: spec.body === undefined ? undefined : JSON.stringify(spec.body),
          redirect: "manual",
          signal: controller.signal,
        });
      } catch (error) {
        throw this.#transportError(error, controller.signal.aborted, undefined);
      }
      if (response.type === "opaqueredirect" || (response.status >= 300 && response.status < 400)) {
        void response.body?.cancel().catch(() => {});
        throw new GenderAPITransportError(
          `GenderAPI responded with a redirect (HTTP ${response.status}); redirects are not followed. ` +
            "Check baseUrl.",
          {
            code: "redirect_rejected",
            status: response.status || null,
            requestId: response.headers.get("x-request-id"),
          },
        );
      }
      try {
        text = await response.text(); // The same deadline covers reading the body.
      } catch (error) {
        throw this.#transportError(error, controller.signal.aborted, response);
      }
    } finally {
      clearTimeout(timer);
    }

    let body: unknown = text;
    let parsed = false;
    if (text.length > 0) {
      try {
        body = JSON.parse(text);
        parsed = true;
      } catch {
        // keep raw text (for example an HTML proxy error page)
      }
    } else {
      body = null;
    }

    if (response.status >= 400) throw new GenderAPIHTTPError(response.status, body, response.headers);

    if (!parsed || !isObject(body)) {
      throw new GenderAPITransportError(
        `GenderAPI returned HTTP ${response.status} without a JSON object body. ` +
          "The request may have been processed and billed; check usage() before sending it again.",
        {
          code: "invalid_response",
          status: response.status,
          requestId: requestIdOf(body, response.headers),
          body,
        },
      );
    }

    if (spec.auth && this.#apiKey !== null && this.requireApiKeyAccess) {
      const access = isObject(body.meta) && isObject(body.meta.access) ? body.meta.access : null;
      if (access && access.mode !== undefined && access.mode !== null && access.mode !== "api_key") {
        throw new GenderAPIAccessModeError(
          typeof access.mode === "string" ? access.mode : null,
          body,
          response.status,
          response.headers,
        );
      }
    }
    return body as T;
  }

  #transportError(error: unknown, aborted: boolean, response: Response | undefined): GenderAPITransportError {
    const name = isObject(error) || error instanceof Error ? (error as { name?: unknown }).name : undefined;
    const timedOut = aborted || name === "TimeoutError" || name === "AbortError";
    return new GenderAPITransportError(
      timedOut
        ? `GenderAPI request timed out after ${this.timeoutMs} ms. Completion and billing are unknown; ` +
            "check usage() before sending another request."
        : "GenderAPI request failed without a usable response. Completion and billing may be unknown; " +
            "check usage() before sending another request.",
      {
        code: timedOut ? "timeout" : "network_error",
        status: response?.status ?? null,
        requestId: response?.headers.get("x-request-id") ?? null,
        cause: error,
      },
    );
  }

  /** Keeps the API key out of JSON serialisation. */
  toJSON(): Record<string, unknown> {
    return { baseUrl: this.baseUrl, timeoutMs: this.timeoutMs, hasApiKey: this.hasApiKey };
  }
}

export default GenderAPI;
