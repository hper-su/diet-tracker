// Firestoreの clients.name には姓名の間に半角スペースが入っていることがある
// (例:「望月 良枝」)一方、Excel等の外部データはスペース無しで書かれていること
// が多い(例:「望月良枝」)。この差だけで一致しないことを防ぐため、比較前に
// 半角・全角スペースを取り除く。
export function normalizeClientName(name) {
  return name.replace(/[\s　]/g, "");
}

// Excel側の表記(誤字・旧字体・区切り記号の有無を含む)→ Firestore側の正式な
// お客様名、が既に判明している分の対応表。ここに無い名前はそのままの表記で
// お客様を検索する(既存お客様が見つからなければ新規作成の候補として扱う)。
export const CLIENT_NAME_OVERRIDES = new Map([
  ["宮本漢之", "宮本漠之"],
  ["髙井由起", "高井由起"],
  ["堀漱太", "堀瀬太"],
  ["チョンヨンファ", "チョン・ヨンファ"],
]);

export function resolveClientName(excelName) {
  return CLIENT_NAME_OVERRIDES.get(excelName) ?? excelName;
}

// Firestoreの既存お客様一覧(name付き)から、resolveClientName後の名前と
// スペース無視の完全一致で1件を探す。0件・複数件ヒットはnullを返し、
// 呼び出し側で「新規お客様」または「要手動確認」として扱う。
export function findMatchingClient(clients, excelName) {
  const target = normalizeClientName(resolveClientName(excelName));
  const matches = clients.filter((client) => normalizeClientName(client.name) === target);
  return matches.length === 1 ? matches[0] : null;
}
