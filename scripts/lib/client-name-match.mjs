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
// スペース無視の完全一致で該当する行を全て返す(0件・1件・複数件のいずれもあり得る)。
// 呼び出し側(findMatchingClient/import-training-logs.mjs)が件数に応じて
// 「新規お客様」「そのまま使う」「要手動確認」を判断する。
export function findMatchingClients(clients, excelName) {
  const target = normalizeClientName(resolveClientName(excelName));
  return clients.filter((client) => normalizeClientName(client.name) === target);
}

// 1件だけヒットした場合のみその行を返す。0件は新規お客様候補としてnullを返すが、
// 複数件ヒット(表記ゆれの結果、既存お客様同士が同じ正規化名になった等)も
// 区別なくnullを返してしまうと、呼び出し側が誤って「新規お客様」として重複登録
// してしまう恐れがある。複数件ヒットの判定が必要な場合はfindMatchingClients()を使うこと。
export function findMatchingClient(clients, excelName) {
  const matches = findMatchingClients(clients, excelName);
  return matches.length === 1 ? matches[0] : null;
}
