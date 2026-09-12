import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY が設定されていません。" +
      ".env.local を作成し、SupabaseプロジェクトのURLとanonキーを設定してください(README参照)。",
  );
}

export const supabase = createClient(url, anonKey);

// PostgREST(Supabaseが使うAPI層)は安全のため、1回のSELECTにつきデフォルトで
// 最大1000件までしか返さない(超えた分は何のエラーも出ないまま黙って
// 切り捨てられる)。件数が1000件を超えうるテーブル(食品マスタや、バックアップ
// /復元で全テーブルを対象にするエクスポート機能など)を`.select("*")`で
// 直接全件取得すると、データが見えなくなる/バックアップから漏れる不具合に
// なるため、1000件ずつページングして取りこぼしを防ぐ。
const SELECT_ALL_PAGE_SIZE = 1000;

export async function selectAllRows<T>(table: string, columns = "*"): Promise<T[]> {
  const rows: T[] = [];
  for (let offset = 0; ; offset += SELECT_ALL_PAGE_SIZE) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .order("id", { ascending: true })
      .range(offset, offset + SELECT_ALL_PAGE_SIZE - 1);
    if (error) throw error;
    const page = (data ?? []) as T[];
    rows.push(...page);
    if (page.length < SELECT_ALL_PAGE_SIZE) break;
  }
  return rows;
}

type SupabaseError = { message: string; code?: string };

// db層の各関数で繰り返されがちな「{ data, error } を受けてerrorなら投げる」を
// まとめるヘルパー。unwrapはdataを返す読み取り系、runは戻り値を使わない
// 書き込み系(insert/update/delete)向け。エラーコード(重複制約など)を
// 個別に分岐したい呼び出し元は、これらを使わず従来通り自分でerrorを見る。
export async function unwrap<T>(
  query: PromiseLike<{ data: T | null; error: SupabaseError | null }>,
): Promise<T> {
  const { data, error } = await query;
  if (error) throw error;
  return data as T;
}

export async function run(
  query: PromiseLike<{ error: SupabaseError | null }>,
): Promise<void> {
  const { error } = await query;
  if (error) throw error;
}
