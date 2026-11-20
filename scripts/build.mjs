// public/js と public/css/app.css を束ねて最小化する (wrangler dev / deploy の前に自動で実行される)。
// 出力: dist/app.js・admin.js・demo.js (あとから読み込む部分は dist/chunks/)、dist/app.css、firebase-messaging-sw.js
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
