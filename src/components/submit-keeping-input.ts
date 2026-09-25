import { startTransition, type FormEvent } from "react";

// <form action={...}> は、アクションの完了後に成功・失敗を問わず入力欄を初期値へ
// 戻す(React 19の仕様)。入力チェックのエラーで、打ち込んだ内容がすべて消えて
// しまうのを避けるため、送信を自前で処理して自動リセットを起こさないようにする。
// 使い方: <form action={formAction}> の代わりに <form onSubmit={submitKeepingInput(formAction)}>。
// 成功時に欄を空へ戻したい場合は、呼び出し側で明示的に reset() する。
export function submitKeepingInput(formAction: (formData: FormData) => void) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const formData = new FormData(event.currentTarget, submitter);
    startTransition(() => formAction(formData));
  };
}
