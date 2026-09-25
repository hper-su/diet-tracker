"use client";

import { useActionState, useState } from "react";
import { submitKeepingInput } from "./submit-keeping-input";

type ActionState = { error?: string } | undefined;

// 食品マスタ・種目マスタ・食事記録・筋トレ記録の各行(一覧の行をクリックして
// その場で編集するUI)で共通する状態管理をまとめたフック。
// - 保存が成功したら(pendingがtrue→falseに変わり、エラーが無ければ)編集欄を閉じる。
// - エラー表示は、キャンセルで一度確認済みにしたら、同じ送信結果のままでは
//   再表示しない。dismiss時点のstate参照を覚えておき、新しい送信結果
//   (useActionStateが返す新しいstateオブジェクト)が届くまで表示しないことで、
//   「キャンセル後に編集を開き直すと前回のエラーが一瞬だけ残る」「再送信した
//   瞬間、まだ古いエラーのままなのに一瞬表示されてしまう」の両方を防ぐ
//   (pendingの変化を見て単純なbooleanフラグをリセットする方式だと、新しい
//   送信が完了する前に古いエラーが再表示される一瞬が発生するため、参照比較にする)。
export function useEditableRow<S extends ActionState>(
  action: (state: S, formData: FormData) => S | Promise<S>,
  initialState: S,
) {
  const [editing, setEditing] = useState(false);
  // Sは常にPromiseでない具象型(呼び出し側のActionState)なので、Awaited<S>はS自身と
  // 構造的に一致する。TSはジェネリックなSに対してそれを自動では証明できないためcastする。
  const [state, formAction, pending] = useActionState<S, FormData>(
    action,
    initialState as Awaited<S>,
  );
  const [dismissedState, setDismissedState] = useState(state);

  const [prevPending, setPrevPending] = useState(pending);
  if (pending !== prevPending) {
    setPrevPending(pending);
    if (!pending && !state?.error) {
      setEditing(false);
    }
  }

  function cancel() {
    setEditing(false);
    setDismissedState(state);
  }

  return {
    editing,
    setEditing,
    formAction,
    // formAction(<form action>)の代わりに使うと、エラー時に入力欄が初期値へ戻らない。
    onSubmit: submitKeepingInput(formAction),
    pending,
    error: state !== dismissedState ? state?.error : undefined,
    cancel,
  };
}
