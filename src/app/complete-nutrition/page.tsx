import {
  PAGE_SUBTITLE,
  INTRO_PARAGRAPH,
  SIMPLE_MACRO_TABLE,
  SIMPLE_VITAMIN_TABLE,
  SIMPLE_MINERAL_TABLE,
  EXERCISE_PLUS_ONE,
  DETAIL_INTRO,
  DETAIL_MACRO_TABLE,
  DETAIL_VITAMIN_TABLE,
  DETAIL_MINERAL_TABLE,
  PRACTICAL_POINTS_HEADING,
  PRACTICAL_POINTS,
  DAILY_INTAKE_HEADING,
  DAILY_INTAKE_INTRO,
  DAILY_INTAKE_TABLE,
  SUPPLEMENT_HEADING,
  SUPPLEMENT_INTRO,
  SUPPLEMENT_POINTS,
  EXCESS_RISK_HEADING,
  EXCESS_RISK_TABLE,
  CLOSING_NOTE,
  type NutrientTable,
} from "@/lib/complete-nutrition";

function NutrientTableSection({ table }: { table: NutrientTable }) {
  return (
    <div>
      <h3 className="text-sm font-medium text-gray-900">{table.heading}</h3>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full min-w-max text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="px-3 py-2">栄養素</th>
              <th className="px-3 py-2">摂れる食材</th>
              <th className="px-3 py-2">働き</th>
              <th className="px-3 py-2">{table.noteLabel}</th>
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row) => (
              <tr key={row.name} className="border-t border-gray-100">
                <td className="px-3 py-2 font-medium text-gray-900 whitespace-nowrap">
                  {row.name}
                </td>
                <td className="px-3 py-2 text-gray-700">{row.foods}</td>
                <td className="px-3 py-2 text-gray-700">{row.role}</td>
                <td className="px-3 py-2 text-gray-700">{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function CompleteNutritionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">完全栄養素</h1>
        <p className="mt-1 text-sm text-gray-600">{PAGE_SUBTITLE}</p>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700">
        <p>{INTRO_PARAGRAPH}</p>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="font-semibold text-gray-900">お客様配布用シンプル版</h2>
        <div className="mt-3 space-y-4">
          <NutrientTableSection table={SIMPLE_MACRO_TABLE} />
          <NutrientTableSection table={SIMPLE_VITAMIN_TABLE} />
          <NutrientTableSection table={SIMPLE_MINERAL_TABLE} />
        </div>

        <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-3">
          <h3 className="font-medium text-gray-900">運動する方へのプラスワン</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
            {EXERCISE_PLUS_ONE.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="font-semibold text-gray-900">33種類の栄養素の詳細</h2>
        <p className="mt-1 text-sm text-gray-700">{DETAIL_INTRO}</p>
        <div className="mt-3 space-y-4">
          <NutrientTableSection table={DETAIL_MACRO_TABLE} />
          <NutrientTableSection table={DETAIL_VITAMIN_TABLE} />
          <NutrientTableSection table={DETAIL_MINERAL_TABLE} />
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="font-semibold text-gray-900">{PRACTICAL_POINTS_HEADING}</h2>
        <div className="mt-3 space-y-3">
          {PRACTICAL_POINTS.map((point) => (
            <div key={point.title} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
              <p className="text-sm font-medium text-gray-900">{point.title}</p>
              <p className="mt-1 text-sm text-gray-700">{point.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="font-semibold text-gray-900">{DAILY_INTAKE_HEADING}</h2>
        <p className="mt-1 text-sm text-gray-700">{DAILY_INTAKE_INTRO}</p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-max text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="px-3 py-2">栄養素</th>
                <th className="px-3 py-2">男性の目安</th>
                <th className="px-3 py-2">女性の目安</th>
              </tr>
            </thead>
            <tbody>
              {DAILY_INTAKE_TABLE.map((row) => (
                <tr key={row.name} className="border-t border-gray-100">
                  <td className="px-3 py-2 font-medium text-gray-900 whitespace-nowrap">
                    {row.name}
                  </td>
                  <td className="px-3 py-2 text-gray-700">{row.male}</td>
                  <td className="px-3 py-2 text-gray-700">{row.female}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="font-semibold text-gray-900">{SUPPLEMENT_HEADING}</h2>
        <p className="mt-2 text-sm text-gray-700">{SUPPLEMENT_INTRO}</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
          {SUPPLEMENT_POINTS.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="font-semibold text-gray-900">{EXCESS_RISK_HEADING}</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-max text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="px-3 py-2">分類</th>
                <th className="px-3 py-2">栄養素</th>
                <th className="px-3 py-2">理由</th>
              </tr>
            </thead>
            <tbody>
              {EXCESS_RISK_TABLE.map((row) => (
                <tr key={row.category} className="border-t border-gray-100">
                  <td className="px-3 py-2 font-medium text-gray-900">{row.category}</td>
                  <td className="px-3 py-2 text-gray-700">{row.nutrients}</td>
                  <td className="px-3 py-2 text-gray-700">{row.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-sm text-gray-600">{CLOSING_NOTE}</p>
    </div>
  );
}
