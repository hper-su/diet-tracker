// 登録済みのお客様の名前を表示する際、敬称として半角スペース+「様」を付与する。
// プロフィール編集フォームなど、名前そのものを編集する入力欄には使わない。
export function formatClientName(name: string): string {
  return `${name} 様`;
}
