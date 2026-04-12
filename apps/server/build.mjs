import { build } from "esbuild";

await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  outfile: "dist/index.mjs",
  packages: "external",
  // Inline workspace packages (they ship raw .ts)
  alias: {
    "@fissa/api": "../../packages/api/index.ts",
    "@fissa/auth": "../../packages/auth/index.ts",
    "@fissa/db": "../../packages/db/index.ts",
    "@fissa/env": "../../packages/env/index.ts",
    "@fissa/utils": "../../packages/utils/index.ts",
  },
  banner: {
    js: "import{createRequire}from'module';const require=createRequire(import.meta.url);",
  },
});

console.log("✓ Built apps/server/dist/index.mjs");
