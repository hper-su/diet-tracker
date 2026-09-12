import { supabase } from "./supabase";

const TABLES = [
  "clients",
  "measurements",
  "foods",
  "mealLogs",
  "usualMeals",
  "exercises",
  "usualExercises",
  "protocolChecks",
] as const;

export type TableName = (typeof TABLES)[number];

type Listener = { tables: ReadonlySet<TableName>; callback: () => void };

const listeners = new Set<Listener>();
let channel: ReturnType<typeof supabase.channel> | null = null;

function ensureChannel() {
  if (channel) return;
  channel = supabase.channel("db-changes");
  for (const table of TABLES) {
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table },
      () => {
        for (const listener of listeners) {
          if (listener.tables.has(table)) listener.callback();
        }
      },
    );
  }
  channel.subscribe();
}

// 他端末での変更(および自分自身の変更のRealtime経由での反映)を検知して
// 一覧を再取得するための購読。アプリの生存期間中、チャンネルは1つだけ
// 張りっぱなしにする(個人利用規模のアプリのため、購読者ごとにチャンネルを
// 分ける最適化は不要)。呼び出し側が実際に依存するテーブルだけを渡すことで、
// 無関係なテーブルへの変更で再取得が走らないようにする。
export function subscribeToChanges(
  tables: readonly TableName[],
  callback: () => void,
): () => void {
  ensureChannel();
  const listener: Listener = { tables: new Set(tables), callback };
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
