# Changelog

All notable changes to this package are documented here. This project follows [Semantic Versioning](https://semver.org/).

## 2.0.0 - 2026-09-30

### Breaking

- The client now targets the GenderAPI.io **V2 API** (`https://api.genderapi.io/api/v2`). V1 routes, request fields and response fields are no longer used. See "Migrating from 1.x" in the README.
- New API: `GenderAPI` with `gender()`, `name()`, `email()`, `username()`, `genderBatch()`, `usage()`, `validatePhone()`, `capabilities()` and `errorCatalog()`. The 1.x `getGenderBy*` and `*Bulk` methods are removed.
- Errors are thrown as typed errors (`GenderAPIHTTPError`, `GenderAPIValidationError`, `GenderAPITransportError`, `GenderAPIAccessModeError`) instead of being resolved as `{ status: false, errno, errmsg }`.
- CommonJS consumers use a named export: `const { GenderAPI } = require("genderapi")`.
- The UMD/CDN browser build is removed. Use the package from server-side code only.
- Requires Node.js 18+ (global `fetch`).

### Added

- ESM and CommonJS builds with TypeScript declarations; zero runtime dependencies.
- Bearer authentication from the `apiKey` option or `GENDERAPI_API_KEY`; works without a key (server-side IP trial).
- Client-side validation of cheap, certain schema rules without a network call.
- Structured HTTP errors exposing `status`, `code`, `title`, `detail`, `action`, `errors`, `requestId`, `retryAfter`, `billingStatus` and the raw body; all-failed batches keep `data`.
- `failedItems()` / `succeededItems()` helpers for partial batch success.
- Safety: no automatic retries, redirects rejected, 10 s default timeout, HTTPS-only base URL (localhost allowed for tests).

### 1.x availability

- 1.x (V1 API) stays available and installable indefinitely (`npm install genderapi@1`); no deprecation or shutdown is planned. The source stays on the `v1` branch.
