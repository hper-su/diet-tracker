// 数値を「ja-JP」ロケールの桁区切り(3桁カンマ)付き文字列にする。
// サーバー・クライアントで実行環境のデフォルトロケールが異なりうるため、
// ロケールを明示しないと表示がずれてハイドレーションエラーになることがある。
export function formatNumberJa(value: number): string {
  return value.toLocaleString("ja-JP");
}
