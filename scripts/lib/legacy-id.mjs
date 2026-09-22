// 旧Supabase版から移行したドキュメントは、IDが当時の連番(例: "10")の
// ままのことがある。そのcreatedAtはimportAllData側でTimestamp.fromMillis
// (Number(id))として作り直されており、実際の登録日時とは無関係に1970年
// 前後の値になるため、削除系スクリプトが「作成日時が古い」とみなして
// 誤って削除しないよう、この形式のIDかどうかを判定する。

const LEGACY_NUMERIC_ID = /^\d+$/;

export function isLegacyNumericId(id) {
  return LEGACY_NUMERIC_ID.test(id);
}
