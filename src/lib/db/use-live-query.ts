import { useEffect, useRef, useState } from "react";
import { subscribeToChanges, type TableName } from "./realtime";

// dexie-react-hooksのuseLiveQueryと同じ使い方(クエリ関数+依存配列)ができる
// 置き換え版。Dexieのようなテーブルアクセス自動追跡は無いため、呼び出し側が
// querierの依存先テーブルをtablesで明示し、そのテーブルへの変更(自分の操作・
// 他端末からの変更のどちらも含む、Supabase Realtime経由の通知)をトリガーに
// クエリ関数を再実行する。無関係なテーブルへの変更では再実行しない。
export function useLiveQuery<T>(
  querier: () => Promise<T>,
  deps: unknown[],
  tables: readonly TableName[],
): T | undefined {
  const [value, setValue] = useState<T>();
  const querierRef = useRef(querier);
  const tablesRef = useRef(tables);

  useEffect(() => {
    querierRef.current = querier;
    tablesRef.current = tables;
  });

  useEffect(() => {
    let cancelled = false;
    // 短時間に複数のRealtime通知が届く(1回の一括操作が複数行の変更として
    // 届く場合など)と、runが重ねて呼ばれる。ネットワークの応答順序は呼び出し順と
    // 限らないため、古い方の応答が新しい方より後に届いて画面を上書きしないよう、
    // 一番最後に呼ばれたrun由来の応答だけを反映する。
    let latestRequestId = 0;

    function run() {
      const requestId = ++latestRequestId;
      querierRef.current().then(
        (result) => {
          if (!cancelled && requestId === latestRequestId) setValue(result);
        },
        (error) => {
          // 通信断など一時的な失敗で無限に再試行されない未処理rejectionを防ぐ。
          // 呼び出し側は前回値の表示を継続する(Dexie版もエラー時は前回値を保持していた)。
          if (!cancelled && requestId === latestRequestId) console.error(error);
        },
      );
    }

    run();
    const unsubscribe = subscribeToChanges(tablesRef.current, run);
    return () => {
      cancelled = true;
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return value;
}
