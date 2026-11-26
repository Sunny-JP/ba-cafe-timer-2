import { build } from "esbuild";
import { rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicPath = (relative) => path.join(root, "public", relative);
const outdir = publicPath("dist");
await rm(outdir, { recursive: true, force: true });

const common = { bundle: true, minify: true, target: "es2022", legalComments: "none", logLevel: "info" };
const modules = { ...common, format: "esm", splitting: true, outdir, chunkNames: "chunks/[name]-[hash]" };

await Promise.all([
  build({ ...modules, entryPoints: { app: publicPath("js/app.js"), admin: publicPath("js/admin.js") }, define: { __DEMO_BUILD__: "false" } }),
  build({ ...modules, entryPoints: { demo: publicPath("js/app.js") }, define: { __DEMO_BUILD__: "true" } }),
  build({ ...common, format: "iife", entryPoints: [publicPath("js/sw.js")], outfile: publicPath("firebase-messaging-sw.js") }),
  build({ ...common, bundle: false, entryPoints: { app: publicPath("css/app.css") }, outdir }),
]);
