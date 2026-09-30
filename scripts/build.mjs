// Builds dist/esm (ES modules) and dist/cjs (CommonJS), each with .d.ts types.
import { execFileSync } from "node:child_process";
import { rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const tsc = require.resolve("typescript/bin/tsc");

rmSync(new URL("../dist", import.meta.url), { recursive: true, force: true });
for (const project of ["tsconfig.esm.json", "tsconfig.cjs.json"]) {
  execFileSync(process.execPath, [tsc, "-p", project], { stdio: "inherit" });
}
// Mark each output directory with its module format so Node and TypeScript
// interpret the .js and .d.ts files correctly regardless of the root "type".
writeFileSync(new URL("../dist/esm/package.json", import.meta.url), JSON.stringify({ type: "module" }) + "\n");
writeFileSync(new URL("../dist/cjs/package.json", import.meta.url), JSON.stringify({ type: "commonjs" }) + "\n");
