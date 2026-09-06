// 文部科学省「日本食品標準成分表」の公式Excelファイル
// (食品成分データベース https://fooddb.mext.go.jp/ からダウンロードできる、
// 本表/表全体シートを含む xlsx)から、食品名・エネルギー(kcal)・たんぱく質・
// 脂質・炭水化物(可食部100gあたり)を抽出し、
// src/lib/db/data/mext-food-composition.json を再生成する。
//
// 使い方: node scripts/extract-mext-foods.cjs <ダウンロードしたxlsxファイルのパス> [edition]
//   edition省略時は "2023"(八訂増補2023年)。"2015"(七訂2015年版)を指定すると
//   そちらの列構成でパースする。版によって列位置とヘッダー行数が異なるため注意。
//
// xlsxは実体がZIPアーカイブなので、外部ライブラリを使わず
// xl/sharedStrings.xml と xl/worksheets/sheet1.xml(本表/表全体シート)を
// 直接展開・パースする。値が "(11.3)" のように括弧書きの場合は
// 推計値であることを示すため括弧を外して採用し、"Tr"(微量)は0として扱い、
// "-"(未測定)を含む行は栄養価が不明として取り込み対象から除外する。
//
// 八訂増補2023年(「表全体」シート): 行1〜12がヘッダー、D列=食品名、
// G列=エネルギー(kcal)、J列=たんぱく質、M列=脂質、U列=炭水化物(差引き法)。
//
// 七訂2015年版(「本表」シート): 行1〜8がヘッダー、D列=食品名、
// F列=エネルギー(kcal。G列はkJ単位なので注意)、I列=たんぱく質
// (J列はアミノ酸組成によるたんぱく質という別の値なので使わない)、
// K列=脂質(L列はトリアシルグリセロール当量という別の値なので使わない)、
// Q列=炭水化物(差引き法)。
//
// D列の食品名は「こむぎ　［パン類］　コッペパン」のように全角スペース区切りの
// 階層(食品群→細分類→…→具体的な品名)が1セルに詰め込まれているため、
// 最後のセグメントをname、それ以前を「・」で連結してcategoryとして分離する。

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const os = require("os");

const xlsxPath = process.argv[2];
const edition = process.argv[3] || "2023";
if (!xlsxPath) {
  console.error("使い方: node scripts/extract-mext-foods.cjs <xlsxファイルのパス> [edition: 2023(既定)|2015]");
  process.exit(1);
}
if (edition !== "2023" && edition !== "2015") {
  console.error(`未対応のeditionです: ${edition}(2023 または 2015 を指定してください)`);
  process.exit(1);
}

const COLUMNS =
  edition === "2015"
    ? { headerRows: 8, name: "D", kcal: "F", protein: "I", fat: "K", carb: "Q" }
    : { headerRows: 12, name: "D", kcal: "G", protein: "J", fat: "M", carb: "U" };

const outputPath = path.join(
  __dirname,
  "..",
  "src/lib/db/data/mext-food-composition.json",
);

const extractDir = fs.mkdtempSync(path.join(os.tmpdir(), "mext-xlsx-"));
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

function parseNumeric(raw) {
  if (raw === "" || raw === null || raw === undefined) return null;
  const trimmed = String(raw).trim();
  if (trimmed === "-") return null;
  if (trimmed === "Tr" || trimmed === "(Tr)") return 0;
  const n = Number(trimmed.replace(/^\(/, "").replace(/\)$/, ""));
  return Number.isFinite(n) ? n : null;
}

const sharedStrings = loadSharedStrings();
const rows = parseSheetRows(path.join(extractDir, "xl/worksheets/sheet1.xml"));

function cellText(cell) {
  if (!cell || cell.value === null) return "";
  return cell.isString ? sharedStrings[Number(cell.value)] ?? "" : cell.value;
}

const results = [];
let skipped = 0;
for (const row of rows) {
  if (row.rowNum <= COLUMNS.headerRows) continue; // ヘッダー行をスキップ
  const rawName = cellText(row.cells[COLUMNS.name]).trim();
  if (!rawName) continue;

  const kcal = parseNumeric(cellText(row.cells[COLUMNS.kcal]));
  const protein = parseNumeric(cellText(row.cells[COLUMNS.protein]));
  const fat = parseNumeric(cellText(row.cells[COLUMNS.fat]));
  const carb = parseNumeric(cellText(row.cells[COLUMNS.carb]));

  if (kcal === null || protein === null || fat === null || carb === null) {
    skipped++;
    continue;
  }

  // 「＜水産練り製品＞かに風味かまぼこ」「（魚フライ類）いかフライ」のように、
  // ＜分類＞・（分類）の直後に全角スペースなしで品名が続く場合があるため、
  // 先頭の＜...＞・（...）は区切りの有無によらず分類側に括り出す。
  let categoryPrefix = "";
  let rest = rawName;
  const bracketMatch = rawName.match(/^(＜[^＞]+＞|（[^）]+）)　*/);
  if (bracketMatch) {
    categoryPrefix = bracketMatch[1];
    rest = rawName.slice(bracketMatch[0].length);
  }

  // まれに区切りが全角スペースでなく半角スペースになっている行があるため
  // (例:「おおむぎ 七分つき押麦」)、どちらの空白も区切りとして扱う。ただし
  // 「10 %果汁入り飲料」のように数値と単位の間の半角スペースは区切りではないので、
  // 分割後に「数字だけの要素」+「%で始まる要素」を1つに戻す。
  const rawParts = rest.split(/[ 　]+/).filter((p) => p !== "");
  const parts = [];
  for (let i = 0; i < rawParts.length; i++) {
    if (/^\d+$/.test(rawParts[i]) && rawParts[i + 1]?.startsWith("%")) {
      parts.push(`${rawParts[i]} ${rawParts[i + 1]}`);
      i++;
    } else {
      parts.push(rawParts[i]);
    }
  }
  let category;
  let name;
  if (parts.length === 0) {
    category = "";
    name = categoryPrefix;
  } else if (parts.length === 1) {
    category = categoryPrefix;
    name = parts[0];
  } else {
    const restCategory = parts.slice(0, -1).join("・");
    category = categoryPrefix ? `${categoryPrefix}・${restCategory}` : restCategory;
    name = parts[parts.length - 1];
  }

  results.push({ category, name, kcal, protein, fat, carb });
}

// 「おおむぎ・押麦」/「乾」のように、末尾セグメント(1つとは限らない)が
// 具体的な食品名ではなく部位・調理/加工状態などの一般語になっているケースを、
// 品名側に「実名(修飾語・修飾語…)」の形で括り出す。
// (例: category="あけび・果皮", name="生" → category="", name="あけび(果皮・生)")
const MODIFIER_WORDS = new Set([
  // 調理・加工状態
  "生", "ゆで", "乾", "油いため", "冷凍", "焼き", "味付け", "塩漬", "素干し",
  "水煮缶詰", "缶詰", "天ぷら", "水煮", "いり", "塩抜き", "つくだ煮", "フライ",
  "蒸し", "素揚げ", "電子レンジ調理", "甘酢漬", "ストレートジュース",
  "濃縮還元ジュース", "塩辛", "ソテー", "乾燥", "甘煮", "ぬかみそ漬", "おろし",
  "水戻し", "煮干し", "味付け缶詰", "浸出液", "レトルトパウチ", "甘露煮",
  "水さらし", "しょうゆ漬", "漬物", "こしあん入り", "つぶしあん入り",
  "常法洗浄", "次亜塩素酸洗浄", "無塩", "フライ済み", "フライ用",
  "国産", "米国産", "天然", "養殖", "加工品", "家庭用", "業務用",
  // 部位(植物)
  "葉", "茎", "根", "実", "花", "種子", "果実", "果肉", "果皮", "皮",
  "薄皮", "若芽", "若ざや", "芽ばえ", "茎葉", "葉柄", "結球葉", "りん茎",
  "根茎", "花序", "塊茎", "塊根", "球茎", "地下茎", "穂", "胚芽", "ぬか",
  "内皮", "外皮", "種皮", "じょうのう", "砂じょう", "葉身", "新芽", "若茎",
  "花らい", "花蕾", "つぼみ", "根元", "根株",
  // 皮の状態・品種系統など
  "皮なし", "皮つき", "皮むき", "全粒", "黄肉種", "赤肉種", "白肉種", "緑肉種",
  // 糖度・飲料タイプ
  "高糖度", "低糖度", "果実飲料", "果実色飲料",
  "10%果汁入り飲料", "10 %果汁入り飲料",
  "20%果汁入り飲料", "20 %果汁入り飲料", "20 %果汁入り飲料（ネクター）",
  "30%果汁入り飲料", "30 %果汁入り飲料", "30 %果汁入り飲料（ネクター）",
  "50%果汁入り飲料", "50 %果汁入り飲料",
  "70%果汁入り飲料", "70 %果汁入り飲料", "（ネクター）",
  // 追加の調理・加工状態
  "塩蔵", "調味漬", "みそ漬", "無糖", "加糖", "くん製", "カット",
  "食塩添加", "食塩無添加", "普通", "未熟", "未熟豆", "粉末タイプ",
  "関東風", "関西風",
  // 追加の部位
  "全卵", "卵黄", "卵白", "精白粒", "全粒粉", "白色種", "りん茎葉",
  "花茎", "脂身", "果汁", "液汁", "おろし汁", "干し", "肉芽",
  // 追加の等級・品種・製法
  "1等", "2等", "揚げ", "硬質", "輸入", "一般用", "学校給食用強化品",
  "小麦グルテン不使用", "小麦グルテン不使用のもの", "大粒種", "国産品",
  "濃縮タイプ", "全糖", "未熟種子", "軟白",
  "凝固剤：塩化マグネシウム", "凝固剤：硫酸カルシウム",
  "胞子茎", "黄色種", "精粉", "甘口タイプ", "プレーン", "小粒",
  "和菓子", "植物性脂肪", "高脂肪", "やぎ", "殺菌乳製品",
  "脂身つき", "皮下脂肪なし", "促成", "長期熟成", "茶",
  "薄皮タイプ", "市販品", "粉", "内臓", "成魚", "肉",
]);

function repairModifierName(category, name) {
  const m = name.match(/^(.+?)\((.+)\)$/);
  const base = m ? m[1] : name;
  const existingMods = m ? m[2].split("・") : [];
  if (!MODIFIER_WORDS.has(base) || !category) return { category, name };

  const segments = category.split("・");
  const modifiers = [base, ...existingMods];
  let i = segments.length - 1;
  while (i >= 1) {
    const seg = segments[i];
    if (!seg || /[＜＞]/.test(seg) || !MODIFIER_WORDS.has(seg)) break;
    modifiers.unshift(seg);
    i--;
  }
  const realName = segments[i];
  if (!realName || /[＜＞]/.test(realName)) {
    return { category, name };
  }
  const newCategory = segments.slice(0, i).join("・");
  return { category: newCategory, name: `${realName}(${modifiers.join("・")})` };
}

// 「こむぎ・［玄穀］・国産」/「普通」のように、［...］自体が実名になってしまった
// 場合に角括弧だけを外す(＝「玄穀(国産・普通)」にする)。（...）と同じ扱い。
function repairSquareBracketPrefix(category, name) {
  const m = name.match(/^［([^］]+)］/);
  if (!m) return { category, name };
  const bracketContent = m[1];
  const rest = name.slice(m[0].length);
  if (rest === "" || rest.startsWith("(")) {
    return { category, name: `${bracketContent}${rest}` };
  }
  const newCategory = category ? `${category}・${bracketContent}` : bracketContent;
  return { category: newCategory, name: rest };
}

// 「（こんぶ類）(つくだ煮)」のように、（...）自体が実名になってしまった場合に
// 全角括弧だけを外す(＝「こんぶ類(つくだ煮)」にする。分類にできる情報がこれ以上
// ないのでこれ自体を実名として扱う)。／直後に具体的な品名が続く場合は分類側へ回す。
function repairRoundParenPrefix(category, name) {
  const m = name.match(/^（([^）]+)）/);
  if (!m) return { category, name };
  const bracketContent = m[1];
  const rest = name.slice(m[0].length);
  if (rest === "" || rest.startsWith("(")) {
    return { category, name: `${bracketContent}${rest}` };
  }
  const newCategory = category ? `${category}・${bracketContent}` : bracketContent;
  return { category: newCategory, name: rest };
}

const repaired = results.map((f) => {
  let cur = { category: f.category, name: f.name };
  for (let iter = 0; iter < 8; iter++) {
    let next = repairRoundParenPrefix(cur.category, cur.name);
    next = repairSquareBracketPrefix(next.category, next.name);
    next = repairModifierName(next.category, next.name);
    if (next.category === cur.category && next.name === cur.name) break;
    cur = next;
  }
  return { ...f, category: cur.category, name: cur.name };
});

// 上の括り出しで(category, name)が同じキーになる行が出た場合は1件にまとめる
// (先勝ち)。また、修飾語の並び順違いだけで別扱いになっている行(例:「大粒種・いり」と
// 「いり・大粒種」)も、修飾語の集合が同じなら1件にまとめる。
function normKey(category, name) {
  const m = name.match(/^(.+?)\((.+)\)$/);
  const base = m ? m[1] : name;
  const mods = m ? m[2].split("・").sort().join("|") : "";
  return `${category} ${base} ${mods}`;
}
const seen = new Map();
const normSeen = new Set();
const deduped = [];
for (const f of repaired) {
  const key = `${f.category} ${f.name}`;
  const nk = normKey(f.category, f.name);
  if (seen.has(key) || normSeen.has(nk)) continue;
  seen.set(key, true);
  normSeen.add(nk);
  deduped.push(f);
}

fs.writeFileSync(outputPath, JSON.stringify(deduped, null, 2), "utf8");
fs.rmSync(extractDir, { recursive: true, force: true });

console.log(`抽出件数: ${deduped.length}件(栄養価不明のためスキップ: ${skipped}件、修飾語の括り出しによる重複統合: ${repaired.length - deduped.length}件)`);
console.log(`書き込み先: ${outputPath}`);
