// サイト全体への簡易アクセス制限。サーバーを持たない静的PWAのため、
// 本格的な認証ではなく「URLを知らない第三者による閲覧を防ぐ」ための
// 簡易パスワードロック。パスワードそのものではなくSHA-256ハッシュ値を
// 埋め込み、入力値をハッシュ化して比較する。

const PASSWORD_HASH_HEX =
  "0f8e631d28e2a339b435ea55da61c718da28902056ed719e576ff1c1b4cb2baf";

export const AUTH_STORAGE_KEY = "diet-tracker-auth";

export async function verifyPassword(input: string): Promise<boolean> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input),
  );
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hex === PASSWORD_HASH_HEX;
}
