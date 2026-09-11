import {
  INTRO_PARAGRAPH,
  OVERCOME_POINTS,
  STALL_REASON_PARAGRAPHS,
  SLEEP_HORMONE_PARAGRAPHS,
  PROGRESS_METRICS_PARAGRAPHS,
  STRENGTH_TRAINING_PARAGRAPHS,
  ALCOHOL_PARAGRAPHS,
  HYDRATION_PARAGRAPHS,
  CLOSING_NOTE,
} from "@/lib/diet-plateau";

export default function DietPlateauPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">
          ダイエットが停滞したときに知っておきたいこと
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          停滞期の考え方と、乗り越えるためのポイントについての解説です。
        </p>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700">
        <p>{INTRO_PARAGRAPH}</p>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="font-semibold text-gray-900">
          停滞を乗り越えるためのポイント
        </h2>
        <div className="mt-3 space-y-3">
          {OVERCOME_POINTS.map((point) => (
            <div
              key={point.title}
              className="rounded-lg border border-gray-100 bg-gray-50 p-3"
            >
              <p className="text-sm font-medium text-gray-900">
                {point.title}
              </p>
              <p className="mt-1 text-sm text-gray-700">{point.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="font-semibold text-gray-900">なぜ停滞するのか</h2>
        <div className="mt-2 space-y-2 text-sm text-gray-700">
          {STALL_REASON_PARAGRAPHS.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="font-semibold text-gray-900">
          睡眠・ホルモンバランス・心の状態も見逃せません
        </h2>
        <div className="mt-2 space-y-2 text-sm text-gray-700">
          {SLEEP_HORMONE_PARAGRAPHS.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="font-semibold text-gray-900">
          体重以外の指標で進捗を確認する
        </h2>
        <div className="mt-2 space-y-2 text-sm text-gray-700">
          {PROGRESS_METRICS_PARAGRAPHS.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="font-semibold text-gray-900">
          筋力トレーニングを止めない
        </h2>
        <div className="mt-2 space-y-2 text-sm text-gray-700">
          {STRENGTH_TRAINING_PARAGRAPHS.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="font-semibold text-gray-900">アルコールとの付き合い方</h2>
        <div className="mt-2 space-y-2 text-sm text-gray-700">
          {ALCOHOL_PARAGRAPHS.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="font-semibold text-gray-900">水分摂取を見直す</h2>
        <div className="mt-2 space-y-2 text-sm text-gray-700">
          {HYDRATION_PARAGRAPHS.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </section>

      <p className="text-sm text-gray-600">{CLOSING_NOTE}</p>
    </div>
  );
}
