# genderapi-js

> This JavaScript package is a legacy V1 client for GenderAPI.io. Its methods, request fields and response examples use the V1 contract. Use the [V1 API documentation](https://www.genderapi.io/api-documentation/v1) for this package. For a new integration, see the [V2 documentation](https://www.genderapi.io/api-documentation). V2 uses a different request and response format; changing the base URL alone does not migrate this client. Results are inferences and may be unresolved. They do not verify a person's identity.

Official JavaScript SDK for [GenderAPI.io](https://www.genderapi.io) — determine gender from **names**, **emails**, and **usernames** using AI.

---

Get Free API Key: [https://app.genderapi.io](https://app.genderapi.io)

---

## 🚀 Installation

### NPM

Install via NPM:

```bash
npm install genderapi
```

---

## 📦 CDN Usage (jsDelivr)

> **Credentials:** Keep an account API key in trusted server-side code. A key embedded in browser JavaScript is visible to users. For a web application, call your own backend and let it authenticate requests to GenderAPI.io. The CDN example illustrates loading the legacy library; it is not a credential-protection mechanism.

Don’t want to install packages? Just include the SDK from a CDN in your HTML page:

```html
<script src="https://cdn.jsdelivr.net/npm/genderapi@1.0.6/dist/genderapi.umd.js"></script>
<script>
  const api = new GenderAPI('YOUR_API_KEY');
  api.getGenderByName({ name: 'Michael' })
      .then(result => console.log(result))
      .catch(err => console.error(err));
</script>
```

Replace `"YOUR_API_KEY"` with your real API key.

---

## 📝 Usage in Node.js, React, Vue

You can import the SDK in either **ES Modules** or **CommonJS** style.

### ES Modules (e.g. Vite, Next.js, Vue 3, etc.)

```js
import GenderAPI from 'genderapi';

const api = new GenderAPI('YOUR_API_KEY');

api.getGenderByName({
  name: 'Michael'
})
.then(result => console.log(result))
.catch(err => console.error(err));
```

---

### CommonJS (require)

```js
const GenderAPI = require('genderapi');

const api = new GenderAPI('YOUR_API_KEY');

api.getGenderByEmail({
  email: 'michael.smith@example.com'
})
.then(result => console.log(result))
.catch(err => console.error(err));
```

---

## 🔹 Get Gender by Name (Single)

```js
const result = await api.getGenderByName({
  name: "Michael",
  country: "US",
  askToAI: false,
  forceToGenderize: false
});
console.log(result);
```

---

## 🔹 Get Gender by Email (Single)

```js
const result = await api.getGenderByEmail({
  email: "michael.smith@example.com",
  country: "US",
  askToAI: false
});
console.log(result);
```

---

## 🔹 Get Gender by Username (Single)

```js
const result = await api.getGenderByUsername({
  username: "michael_dev",
  country: "US",
  askToAI: false,
  forceToGenderize: false
});
console.log(result);
```

---

## 🔹 Get Gender by Multiple Names (Bulk)

Analyze up to **100 names** in a single request.

```js
const result = await api.getGenderByNameBulk([
  { name: "Andrea", country: "DE", id: "123" },
  { name: "andrea", country: "IT", id: "456" },
  { name: "james", country: "US", id: "789" }
]);
console.log(result);
```

---

## 🔹 Get Gender by Multiple Emails (Bulk)

Analyze up to **50 emails** in a single request.

```js
const result = await api.getGenderByEmailBulk([
  { email: "john@example.com", country: "US", id: "abc123" },
  { email: "maria@domain.de", country: "DE", id: "def456" }
]);
console.log(result);
```

---

## 🔹 Get Gender by Multiple Usernames (Bulk)

Analyze up to **50 usernames** in a single request.

```js
const result = await api.getGenderByUsernameBulk([
  { username: "johnblack", country: "US", id: "u001" },
  { username: "maria2025", country: "DE", id: "u002" }
]);
console.log(result);
```

---

## 📥 API Parameters

### Name Lookup (Single)

| Parameter          | Type     | Required | Description |
|--------------------|----------|----------|-------------|
| name               | String   | Yes      | Name to query. |
| country            | String   | No       | Two-letter country code (e.g. "US"). Helps narrow down gender detection results by region. |
| askToAI            | Boolean  | No       | Defaults to `false`. Enables the legacy AI option. Supported single lookups with this option use a 2-credit tariff. This does not guarantee higher accuracy or a resolved result. Ordinary lookups and batch requests follow their V1 billing rules; inspect the returned `used_credits` value. |
| forceToGenderize   | Boolean  | No       | Default is `false`. When `true`, allows interpretation of nickname-like or unconventional inputs where supported by this V1 method. A result may still be unresolved; the option does not verify identity. |

---

### Name Lookup (Bulk)

| Parameter | Type   | Required | Description |
|-----------|--------|----------|-------------|
| data      | Array  | Yes      | Array of name objects (max 100 per request). |
| name      | String | Yes      | Name to analyze (inside each object). |
| country   | String | No       | Two-letter country code for more precise results. |
| id        | String/Integer | No | Optional. Pass your own ID to match responses to your records. |

---

### Email Lookup (Single)

| Parameter | Type   | Required | Description |
|-----------|--------|----------|-------------|
| email     | String | Yes      | Email address to query. |
| country   | String | No       | Two-letter country code (e.g. "US"). |
| askToAI   | Boolean | No      | Defaults to `false`. Enables the legacy AI option. Supported single lookups with this option use a 2-credit tariff. This does not guarantee higher accuracy or a resolved result. Ordinary lookups and batch requests follow their V1 billing rules; inspect the returned `used_credits` value. |

---

### Email Lookup (Bulk)

| Parameter | Type   | Required | Description |
|-----------|--------|----------|-------------|
| data      | Array  | Yes      | Array of email objects (max 50 per request). |
| email     | String | Yes      | Email to analyze (inside each object). |
| country   | String | No       | Two-letter country code. |
| id        | String/Integer | No | Optional. Pass your own ID to match responses to your records. |

---

### Username Lookup (Single)

| Parameter          | Type     | Required | Description |
|--------------------|----------|----------|-------------|
| username           | String   | Yes      | Username to analyze. |
| country            | String   | No       | Two-letter country code. |
| askToAI            | Boolean  | No       | Defaults to `false`. Enables the legacy AI option. Supported single lookups with this option use a 2-credit tariff. This does not guarantee higher accuracy or a resolved result. Ordinary lookups and batch requests follow their V1 billing rules; inspect the returned `used_credits` value. |
| forceToGenderize   | Boolean  | No       | Default is `false`. When `true`, allows interpretation of nickname-like or unconventional inputs where supported by this V1 method. A result may still be unresolved; the option does not verify identity. |

---

### Username Lookup (Bulk)

| Parameter | Type   | Required | Description |
|-----------|--------|----------|-------------|
| data      | Array  | Yes      | Array of username objects (max 50 per request). |
| username  | String | Yes      | Username to analyze (inside each object). |
| country   | String | No       | Two-letter country code. |
| id        | String/Integer | No | Optional. Pass your own ID to match responses to your records. |

---

## ✅ API Response

---

### Single Response

Example JSON response for single name, email, or username lookups:

```json
{
  "status": true,
  "used_credits": 1,
  "remaining_credits": 4999,
  "expires": 1743659200,
  "q": "michael.smith@example.com",
  "name": "Michael",
  "gender": "male",
  "country": "US",
  "total_names": 325,
  "probability": 98,
  "duration": "4ms"
}
```

---

### Bulk (Multiple) Response

Example JSON response for bulk name lookup (same structure for email and username bulk lookups):

```json
{
  "status": true,
  "used_credits": 3,
  "remaining_credits": 7265,
  "expires": 1717069765,
  "names": [
    {
      "name": "andrea",
      "q": "Andrea",
      "gender": "female",
      "country": "DE",
      "total_names": 644,
      "probability": 88,
      "id": "123"
    },
    {
      "name": "andrea",
      "q": "andrea",
      "gender": "male",
      "country": "IT",
      "total_names": 13537,
      "probability": 98,
      "id": "456"
    },
    {
      "name": "james",
      "q": "james",
      "gender": "male",
      "country": "US",
      "total_names": 45274,
      "probability": 100,
      "id": "789"
    }
  ],
  "duration": "5ms"
}
```

---

### Response Fields

| Field               | Type               | Description                                         |
|---------------------|--------------------|-----------------------------------------------------|
| status              | Boolean            | Indicates whether the request was successful.       |
| used_credits        | Integer            | Number of credits consumed for this request.       |
| remaining_credits   | Integer            | Remaining credits on your package.                  |
| expires             | Integer (timestamp)| Expiration date of your package (UNIX timestamp).   |
| q                   | String             | The original input query (name/email/username). (only in single response) |
| name                | String             | Normalized version of the name/email/username.     |
| gender              | Enum[String]       | `"male"`, `"female"`, or `"null"`.                |
| country             | String             | Country used in prediction.                         |
| total_names         | Integer            | Number of samples used for prediction.             |
| probability         | Integer            | Confidence percentage for the prediction.         |
| names               | Array of Objects   | List of results (only in bulk response).          |
| id                  | String / Integer   | ID passed in the request (bulk only).             |
| duration            | String             | Processing time for the request.                   |

---

## ⚠️ Limits

- **Single requests** → 1 item per call.
- **Bulk Name Lookup** → max **100 names** per request.
- **Bulk Email Lookup** → max **50 emails** per request.
- **Bulk Username Lookup** → max **50 usernames** per request.

---

## ⚠️ Error Codes

When `status` is `false`, check the following error codes:

| errno | errmsg                        | Description                                                   |
|-------|-------------------------------|---------------------------------------------------------------|
| 50    | access denied                 | Unauthorized IP or referrer.                                  |
| 90    | invalid country code          | Country code is invalid.                                      |
| 91    | name/email/username not set   | Missing required parameter.                                   |
| 92    | too many items in bulk        | Limit exceeded (100 for names, 50 for emails/usernames).     |
| 93    | limit reached                 | Credits depleted.                                             |
| 94    | invalid or missing key        | API key is invalid or missing.                               |
| 99    | API key has expired           | Renew your API key.                                           |

Example error response:

```json
{
  "status": false,
  "errno": 94,
  "errmsg": "invalid or missing key"
}
```

---

## 🔗 Live Test Pages

You can try live gender detection directly on GenderAPI.io:

- **Determine gender from a name:**  
  [www.genderapi.io](https://www.genderapi.io)

- **Determine gender from an email address:**  
  [https://www.genderapi.io/determine-gender-from-email](https://www.genderapi.io/determine-gender-from-email)

- **Determine gender from a username:**  
  [https://www.genderapi.io/determine-gender-from-username](https://www.genderapi.io/determine-gender-from-username)

---

## 📚 Detailed API Documentation

For the complete V1 API reference used by this package, visit:

[https://www.genderapi.io/api-documentation/v1](https://www.genderapi.io/api-documentation/v1)

For a new integration, use the V2 documentation instead (different request and response format; this client is not a V2 client):

[https://www.genderapi.io/api-documentation](https://www.genderapi.io/api-documentation)

V2 JavaScript integration guide (new integrations): [https://www.genderapi.io/integrations/javascript](https://www.genderapi.io/integrations/javascript)

---

## ⚖️ License

MIT License
