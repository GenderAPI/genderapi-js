// Regenerates test/fixtures/openapi-examples.json from the V2 OpenAPI document.
// Usage: node scripts/extract-fixtures.mjs path/to/openapi-v2.json
// (download it from https://api.genderapi.io/api/v2/openapi.json)
import { readFileSync, writeFileSync } from "node:fs";

const source = process.argv[2];
if (!source) {
  console.error("Usage: node scripts/extract-fixtures.mjs path/to/openapi-v2.json");
  process.exit(1);
}
const doc = JSON.parse(readFileSync(source, "utf8"));
const out = {};
for (const [path, operations] of Object.entries(doc.paths)) {
  for (const [method, operation] of Object.entries(operations)) {
    if (!operation || typeof operation !== "object" || !operation.responses) continue;
    for (const [status, response] of Object.entries(operation.responses)) {
      for (const media of Object.values(response.content ?? {})) {
        for (const [name, example] of Object.entries(media.examples ?? {})) {
          out[`${method.toUpperCase()} ${path} ${status} ${name}`] = example.value;
        }
      }
    }
  }
}
const target = new URL("../test/fixtures/openapi-examples.json", import.meta.url);
writeFileSync(target, JSON.stringify(out, null, 2) + "\n");
console.log(`Wrote ${Object.keys(out).length} examples to ${target.pathname}`);
