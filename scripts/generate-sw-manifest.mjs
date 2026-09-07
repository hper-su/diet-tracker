// next build (output: "export") が生成した out/ を走査し、Service Worker が
// installイベントで全件キャッシュするためのURL一覧を out/sw-precache-manifest.json
// に書き出す。package.json の "build" スクリプトから next build の直後に実行される。
import {
  readdirSync,
  statSync,
  writeFileSync,
  readFileSync,
  existsSync,
} from "node:fs";
import path from "node:path";

const OUT_DIR = path.join(process.cwd(), "out");

if (!existsSync(OUT_DIR)) {
  console.error("out/ が見つかりません。先に next build を実行してください。");
  process.exit(1);
}

function walk(dir) {
  let files = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    files = statSync(full).isDirectory() ? files.concat(walk(full)) : files.concat(full);
  }
  return files;
}

// GitHub Pagesのようにサブパス(/diet-tracker/等)配信の場合でも正しく解決されるよう、
// URLはルート絶対パス("/...")ではなく、sw.js自身の場所を基準にした相対パスで持つ。
const urls = new Set();

for (const file of walk(OUT_DIR)) {
  const rel = path.relative(OUT_DIR, file).split(path.sep).join("/");
  urls.add(rel);

  if (rel === "index.html") {
    urls.add("./");
  } else if (rel.endsWith("/index.html")) {
    urls.add(rel.slice(0, -"index.html".length));
  } else if (rel.endsWith(".html")) {
    urls.add(rel.slice(0, -".html".length));
  }
}

// sw.js自身と、これから書き出すマニフェスト自身はキャッシュ対象に含めない
// (sw.jsはブラウザのService Worker機構が別途管理し、マニフェストは常に
// installのたびにネットワークから最新を取得したいため)。
urls.delete("sw.js");
urls.delete("sw-precache-manifest.json");

const manifest = {
  buildId: Date.now().toString(36),
  urls: Array.from(urls).sort(),
};

writeFileSync(
  path.join(OUT_DIR, "sw-precache-manifest.json"),
  JSON.stringify(manifest),
);

// sw.js自体の中身が毎回まったく同じだと、ブラウザは「新しいService Workerがある」と
// 判定できず(SWの更新検知はスクリプト本体のバイト差分で行われるため)、一度
// インストールされたSWがどれだけ再デプロイしても永久に更新されない不具合になる。
// buildIdを埋め込んだ行を追記して、ビルドごとに必ずsw.js自体のバイト列が
// 変わるようにする。
const swPath = path.join(OUT_DIR, "sw.js");
const swSource = readFileSync(swPath, "utf-8");
writeFileSync(swPath, `${swSource}\n// build: ${manifest.buildId}\n`);

console.log(
  `sw-precache-manifest.json を生成しました (${manifest.urls.length}件, build ${manifest.buildId})`,
);
