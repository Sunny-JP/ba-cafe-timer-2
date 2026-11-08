// public/js/*.js と public/css/app.css を public/dist/ にまとめて最小化する。
// - dist/app.js   : 通常のアプリ (index.html)
// - dist/demo.js  : デモ用 (demo.html)。見本データの js/demo.js だけを含める
// - dist/docs.js  : 文書。メニューで開いたときに初めて読み込む別ファイル (i18n 等に依存しないので重複しない)
// - dist/app.css  : 最小化した CSS
// Firebase SDK など https:// の import はそのまま残す (CDN から読み込む)。
import { build } from 'esbuild';
import { rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'public/dist');
await rm(out, { recursive: true, force: true });

// import("./docs.js") は束ねず、dist/docs.js への相対参照のまま残す
const keepDocsSeparate = {
  name: 'keep-docs-separate',
  setup(b) {
    b.onResolve({ filter: /^\.\/docs\.js$/ }, () => ({ path: './docs.js', external: true }));
  },
};

const common = {
  bundle: true,
  format: 'esm',
  target: 'es2022',
  minify: true,
  legalComments: 'none',
  external: ['https://*'],
  plugins: [keepDocsSeparate],
  logLevel: 'info',
};

await Promise.all([
  build({ ...common, entryPoints: { app: path.join(root, 'public/js/app.js') }, outdir: out, define: { __DEMO_BUILD__: 'false' } }),
  build({ ...common, entryPoints: { demo: path.join(root, 'public/js/app.js') }, outdir: out, define: { __DEMO_BUILD__: 'true' } }),
  build({ ...common, entryPoints: { docs: path.join(root, 'public/js/docs.js') }, outdir: out, plugins: [] }),
  build({ entryPoints: { app: path.join(root, 'public/css/app.css') }, outdir: out, minify: true, bundle: false, logLevel: 'info' }),
]);
