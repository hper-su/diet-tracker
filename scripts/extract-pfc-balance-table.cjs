// お客様(本人)が用意した「PFCバランス表」Excelファイルから、家庭料理の定番品と
// 主要チェーン店(コンビニ・飲食店)のメニューを抽出し、
// src/lib/db/data/pfc-balance-table.json を再生成する。
//
// 使い方: node scripts/extract-pfc-balance-table.cjs <xlsxファイルのパス>
//
// シートの列構成(1行目がヘッダー):
// A=分類、B=食品名、C=一人前の目安量、D=カロリー(kcal)、
// E=たんぱく質P(g)、F=脂質F(g)、G=炭水化物C(g)、H〜J=P/F/C比率(%)、K=出典・備考。
// xlsxは実体がZIPアーカイブなので、外部ライブラリを使わず
// xl/sharedStrings.xml と xl/worksheets/sheet1.xml を直接展開・パースする
// (extract-mext-foods.cjsと同じ方式)。

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const os = require("os");

const xlsxPath = process.argv[2];
if (!xlsxPath) {
  console.error("使い方: node scripts/extract-pfc-balance-table.cjs <xlsxファイルのパス>");
  process.exit(1);
}

const outputPath = path.join(
  __dirname,
  "..",
  "src/lib/db/data/pfc-balance-table.json",
);

const extractDir = fs.mkdtempSync(path.join(os.tmpdir(), "pfc-xlsx-"));
execFileSync("unzip", ["-o", xlsxPath, "-d", extractDir], { stdio: "ignore" });

function loadSharedStrings() {
  const xml = fs.readFileSync(path.join(extractDir, "xl/sharedStrings.xml"), "utf8");
  const items = [];
  const siRegex = /<si>([\s\S]*?)<\/si>/g;
  let m;
  while ((m = siRegex.exec(xml))) {
    const texts = [...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((x) => x[1]);
    items.push(
      texts
        .join("")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'"),
    );
  }
  return items;
}

function parseSheetRows(sheetPath) {
  const xml = fs.readFileSync(sheetPath, "utf8");
  const rows = [];
  const rowRegex = /<row r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g;
  let rm;
  while ((rm = rowRegex.exec(xml))) {
    const cells = {};
    const cellRegex =
      /<c r="([A-Z]+)(\d+)"([^>]*)>(?:([\s\S]*?))?<\/c>|<c r="([A-Z]+)(\d+)"([^>]*)\/>/g;
    let cm;
    while ((cm = cellRegex.exec(rm[2]))) {
      const col = cm[1] || cm[5];
      const attrs = cm[3] || cm[6] || "";
      const body = cm[4] || "";
      const vMatch = body.match(/<v>([\s\S]*?)<\/v>/);
      cells[col] = { value: vMatch ? vMatch[1] : null, isString: /t="s"/.test(attrs) };
    }
    rows.push({ rowNum: Number(rm[1]), cells });
  }
  return rows;
}

const sharedStrings = loadSharedStrings();
const rows = parseSheetRows(path.join(extractDir, "xl/worksheets/sheet1.xml"));

function cellText(cell) {
  if (!cell || cell.value === null) return "";
  return cell.isString ? sharedStrings[Number(cell.value)] ?? "" : cell.value;
}

function parseNumeric(raw) {
  if (raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

const results = [];
let skipped = 0;
for (const row of rows) {
  if (row.rowNum <= 1) continue; // ヘッダー行をスキップ

  const category = cellText(row.cells["A"]).trim();
  const name = cellText(row.cells["B"]).trim();
  const servingLabel = cellText(row.cells["C"]).trim() || "1人前";
  if (!name) continue; // 末尾の注釈行など、食品名が無い行はスキップ

  const kcal = parseNumeric(cellText(row.cells["D"]));
  const protein = parseNumeric(cellText(row.cells["E"]));
  const fat = parseNumeric(cellText(row.cells["F"]));
  const carb = parseNumeric(cellText(row.cells["G"]));

  if (kcal === null || protein === null || fat === null || carb === null) {
    skipped++;
    continue;
  }

  results.push({ category, name, servingLabel, kcal, protein, fat, carb });
}

// 「（単品）焼鮭(ガスト)」「［テイクアウト］みそ汁(やよい軒)」のように、食品名の
// 先頭に半角/全角の丸括弧・角括弧が区切りなしで直接続いているケースを、
// その括弧の中身を分類側に括り出すことで直す
// (例: category="ガスト", name="（単品）焼鮭(ガスト)"
//      → category="ガスト・単品", name="焼鮭(ガスト)")。
// 直後に何も続かない場合は、全角/半角の括弧を外すだけにする。
function repairBracketPrefix(category, name) {
  const m = name.match(/^[（(]([^）)]+)[）)]|^[［\[]([^］\]]+)[］\]]/);
  if (!m) return { category, name };
  const bracketContent = m[1] ?? m[2];
  const rest = name.slice(m[0].length);
  if (rest === "" || rest.startsWith("(")) {
    return { category, name: `${bracketContent}${rest}` };
  }
  const newCategory = category ? `${category}・${bracketContent}` : bracketContent;
  return { category: newCategory, name: rest };
}

const repaired = results.map((f) => {
  let cur = { category: f.category, name: f.name };
  for (let i = 0; i < 4; i++) {
    const next = repairBracketPrefix(cur.category, cur.name);
    if (next.category === cur.category && next.name === cur.name) break;
    cur = next;
  }
  return { ...f, category: cur.category, name: cur.name };
});

// 括り出しの結果、(category, name)が同じキーになる行が出た場合は1件にまとめる
// (先勝ち)。
const seen = new Set();
const deduped = [];
for (const f of repaired) {
  const key = `${f.category} ${f.name}`;
  if (seen.has(key)) continue;
  seen.add(key);
  deduped.push(f);
}

fs.writeFileSync(outputPath, JSON.stringify(deduped, null, 2), "utf8");
fs.rmSync(extractDir, { recursive: true, force: true });

console.log(`抽出件数: ${deduped.length}件(栄養価不明のためスキップ: ${skipped}件、括弧の括り出しによる重複統合: ${repaired.length - deduped.length}件)`);
console.log(`書き込み先: ${outputPath}`);
