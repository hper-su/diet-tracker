import { useEffect, useRef, useState } from "react";

// 呼び出し側が「変化を検知したらcallbackを呼ぶ」購読を登録し、購読解除関数を
// 返す関数。各db層モジュールのsubscribeTo*(Firestoreの onSnapshot をラップし、
// スナップショットの中身は使わず「変化があった」という合図だけを送るもの)がこの形。
type Subscriber = (callback: () => void) => () => void;

// dexie-react-hooksのuseLiveQueryと同じ使い方(クエリ関数+依存配列)ができる
// 置き換え版。Dexieのようなテーブルアクセス自動追跡は無いため、呼び出し側が
// querierの依存先(subscribeTo*関数の配列)を明示し、そのいずれかで変化が
// 通知されたら(自分の操作・他端末からの変更のどちらも含む)クエリ関数を
// 再実行する。Firestoreの onSnapshot はローカルの保留中書き込みでも即座に
// 発火するため、Supabase版にあった「自分の書き込みを即座に画面反映する」ための
// 別仕組み(notifyChange)は不要。
export function useLiveQuery<T>(
  querier: () => Promise<T>,
  deps: unknown[],
  subscribers: readonly Subscriber[],
): T | undefined {
  const [value, setValue] = useState<T>();
  const querierRef = useRef(querier);
  const subscribersRef = useRef(subscribers);

  useEffect(() => {
    querierRef.current = querier;
    subscribersRef.current = subscribers;
  });

  useEffect(() => {
    let cancelled = false;
    // 短時間に複数の変化通知が届く(1回の一括操作が複数ドキュメントの変更として
    // 届く場合など)と、runが重ねて呼ばれる。応答順序は呼び出し順と限らないため、
    // 古い方の応答が新しい方より後に届いて画面を上書きしないよう、一番最後に
    // 呼ばれたrun由来の応答だけを反映する。
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
    const unsubscribes = subscribersRef.current.map((subscribe) => subscribe(run));
    return () => {
      cancelled = true;
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return value;
}
