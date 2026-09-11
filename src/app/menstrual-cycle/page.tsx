import {
  INTRO_PARAGRAPH,
  CYCLE_PHASES,
  TRAINING_INTRO_PARAGRAPH,
  TRAINING_POINTS_INTRO,
  TRAINING_POINTS,
  DIET_INTRO_PARAGRAPH,
  DIET_CHANGES,
  DIET_NOTE_PARAGRAPH,
  SWEET_CRAVING_INTRO,
  SWEET_CRAVING_SWAPS,
  SWEET_CRAVING_CLOSING,
  PERIOD_CARE_POINTS,
  IRREGULARITY_INTRO_PARAGRAPH,
  IRREGULARITY_EXAMPLES,
  IRREGULARITY_MEANING_PARAGRAPH,
  IRREGULARITY_ACTION_PARAGRAPH,
  CLOSING_NOTE,
} from "@/lib/menstrual-cycle";

export default function MenstrualCyclePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">
          生理周期と筋トレ・ダイエットについて
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          生理周期とトレーニング・食事管理の関係についての解説です。
        </p>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700">
        <p>{INTRO_PARAGRAPH}</p>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="font-semibold text-gray-900">生理周期の4つの時期</h2>
        <div className="mt-3 space-y-3">
          {CYCLE_PHASES.map((phase) => (
            <div
              key={phase.label}
              className="rounded-lg border border-gray-100 bg-gray-50 p-3"
            >
              <p className="text-sm font-medium text-gray-900">
                {phase.label}
              </p>
              <p className="mt-1 text-sm text-gray-700">{phase.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="font-semibold text-gray-900">トレーニングについて</h2>
        <div className="mt-2 space-y-2 text-sm text-gray-700">
          <p>{TRAINING_INTRO_PARAGRAPH}</p>
          <p className="font-medium">{TRAINING_POINTS_INTRO}</p>
          <ul className="list-disc space-y-1 pl-5">
            {TRAINING_POINTS.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="font-semibold text-gray-900">
          ダイエット(食事管理)について
        </h2>
        <div className="mt-2 space-y-2 text-sm text-gray-700">
          <p>{DIET_INTRO_PARAGRAPH}</p>
          <ul className="list-disc space-y-1 pl-5">
            {DIET_CHANGES.map((change) => (
              <li key={change}>{change}</li>
            ))}
          </ul>
          <p>{DIET_NOTE_PARAGRAPH}</p>
        </div>

        <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-3">
          <h3 className="font-medium text-gray-900">
            ◆ 生理前に甘いものが欲しくなったときの工夫
          </h3>
          <div className="mt-2 space-y-2 text-sm text-gray-700">
            <p>{SWEET_CRAVING_INTRO}</p>
            <ul className="list-disc space-y-1 pl-5">
              {SWEET_CRAVING_SWAPS.map((swap) => (
                <li key={swap}>{swap}</li>
              ))}
            </ul>
            <p>{SWEET_CRAVING_CLOSING}</p>
          </div>
        </div>

        <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
          <h3 className="font-medium text-gray-900">
            ◆ 生理中に気をつけたいこと
          </h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
            {PERIOD_CARE_POINTS.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="font-semibold text-gray-900">
          一番大事なこと:無理なダイエットで生理が乱れていませんか?
        </h2>
        <div className="mt-2 space-y-2 text-sm text-gray-700">
          <p>{IRREGULARITY_INTRO_PARAGRAPH}</p>
          <ul className="list-disc space-y-1 pl-5">
            {IRREGULARITY_EXAMPLES.map((example) => (
              <li key={example}>{example}</li>
            ))}
          </ul>
          <p>{IRREGULARITY_MEANING_PARAGRAPH}</p>
          <p>{IRREGULARITY_ACTION_PARAGRAPH}</p>
        </div>
      </section>

      <p className="text-sm text-gray-600">{CLOSING_NOTE}</p>
    </div>
  );
}
