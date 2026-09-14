import { Emphasized } from "@/components/emphasized";
import { StatBox } from "@/components/stat-box";
import {
  INTRO_PARAGRAPH,
  OVERCOME_HEADING,
  OVERCOME_POINTS,
  STALL_REASON_PARAGRAPHS,
  SLEEP_HORMONE_INTRO,
  SLEEP_HORMONE_SECTIONS,
  SLEEP_HORMONE_STAT,
  SLEEP_HORMONE_CLOSING,
  PROGRESS_STRENGTH_HEADING,
  PROGRESS_HEADING,
  PROGRESS_PARAGRAPH,
  PROGRESS_INDICATORS,
  STRENGTH_HEADING,
  STRENGTH_PARAGRAPH,
  ALCOHOL_INTRO,
  ALCOHOL_STAT,
  ALCOHOL_POINTS,
  ALCOHOL_CLOSING,
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
        <h2 className="font-semibold text-gray-900">なぜ停滞するのか</h2>
        <div className="mt-2 space-y-2 text-sm text-gray-700">
          {STALL_REASON_PARAGRAPHS.map((paragraph, i) => (
            <p key={i}>
              <Emphasized text={paragraph} />
            </p>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="font-semibold text-gray-900">{OVERCOME_HEADING}</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {OVERCOME_POINTS.map((point) => (
            <div
              key={point.order}
              className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-semibold text-white">
                {point.order}
              </span>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {point.title}
                </p>
                <p className="mt-1 text-sm text-gray-700">{point.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="font-semibold text-gray-900">
          睡眠・ホルモンバランス・心の状態も見逃せません
        </h2>
        <p className="mt-2 text-sm text-gray-700">{SLEEP_HORMONE_INTRO}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {SLEEP_HORMONE_SECTIONS.map((section) => (
            <div
              key={section.title}
              className="rounded-lg border border-gray-100 bg-gray-50 p-3"
            >
              <p className="text-sm font-medium text-gray-900">
                {section.title}
              </p>
              <p className="mt-1 text-sm text-gray-700">{section.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-3">
          <StatBox stat={SLEEP_HORMONE_STAT} />
        </div>
        <p className="mt-3 text-sm text-gray-700">{SLEEP_HORMONE_CLOSING}</p>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="font-semibold text-gray-900">
          {PROGRESS_STRENGTH_HEADING}
        </h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              {PROGRESS_HEADING}
            </h3>
            <p className="mt-1 text-sm text-gray-700">{PROGRESS_PARAGRAPH}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {PROGRESS_INDICATORS.map((indicator) => (
                <span
                  key={indicator}
                  className="rounded-full border border-gray-300 bg-white px-2 py-0.5 text-xs text-gray-700"
                >
                  {indicator}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              {STRENGTH_HEADING}
            </h3>
            <p className="mt-1 text-sm text-gray-700">{STRENGTH_PARAGRAPH}</p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="font-semibold text-gray-900">アルコールとの付き合い方</h2>
        <p className="mt-2 text-sm text-gray-700">{ALCOHOL_INTRO}</p>
        <div className="mt-3">
          <StatBox stat={ALCOHOL_STAT} />
        </div>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-700">
          {ALCOHOL_POINTS.map((point) => (
            <li key={point}>
              <Emphasized text={point} />
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-gray-700">{ALCOHOL_CLOSING}</p>
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
