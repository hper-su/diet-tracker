import {
  INTRO_PARAGRAPH,
  NUTRITION_PRIORITIES,
  WATER_PROTEIN_SECTION,
  PRACTICE_ROWS,
  CONTINUATION_TIPS,
  CLOSING_NOTE,
} from "@/lib/nutrition-guidance";

export default function NutritionGuidancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">食事指導</h1>
        <p className="mt-1 text-sm text-gray-600">
          ダイエット中の食事の考え方についての解説です。
        </p>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700">
        <p>{INTRO_PARAGRAPH}</p>
      </section>

      <div className="space-y-4">
        <h2 className="text-base font-semibold text-gray-900">
          優先順位で考える食事の中身
        </h2>

        {NUTRITION_PRIORITIES.map((priority) => (
          <section
            key={priority.order}
            className="rounded-lg border border-gray-200 bg-white p-4"
          >
            <h3 className="flex items-center gap-2 font-semibold text-gray-900">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs text-white">
                {priority.order}
              </span>
              {priority.title}
            </h3>

            <div className="mt-2 space-y-2 text-sm text-gray-700">
              {priority.paragraphs.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>

            {priority.bulletList && (
              <div className="mt-2 text-sm text-gray-700">
                {priority.bulletListIntro && (
                  <p className="font-medium">{priority.bulletListIntro}</p>
                )}
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  {priority.bulletList.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {priority.subSections && (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {priority.subSections.map((sub) => (
                  <div
                    key={sub.title}
                    className="rounded-lg border border-gray-100 bg-gray-50 p-3"
                  >
                    <p className="text-sm font-medium text-gray-900">
                      {sub.reading ? (
                        <ruby>
                          {sub.title}
                          <rp>(</rp>
                          <rt className="text-[10px] font-normal text-gray-500">
                            {sub.reading}
                          </rt>
                          <rp>)</rp>
                        </ruby>
                      ) : (
                        sub.title
                      )}
                    </p>
                    <p className="mt-1 text-xs text-gray-600">{sub.body}</p>
                  </div>
                ))}
              </div>
            )}

            {priority.closingParagraph && (
              <p className="mt-3 text-sm text-gray-700">
                {priority.closingParagraph}
              </p>
            )}

            {priority.example && (
              <p className="mt-3 text-xs text-gray-500">{priority.example}</p>
            )}
          </section>
        ))}
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="font-semibold text-gray-900">
          {WATER_PROTEIN_SECTION.title}
        </h2>

        <div className="mt-4 space-y-2 text-sm text-gray-700">
          <h3 className="font-semibold text-gray-900">
            {WATER_PROTEIN_SECTION.water.heading}
          </h3>
          {WATER_PROTEIN_SECTION.water.paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          <p className="font-medium">{WATER_PROTEIN_SECTION.water.timingIntro}</p>
          <ul className="list-disc space-y-1 pl-5">
            {WATER_PROTEIN_SECTION.water.timingItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="font-medium">{WATER_PROTEIN_SECTION.water.guideIntro}</p>
          <ul className="list-disc space-y-1 pl-5">
            {WATER_PROTEIN_SECTION.water.guideItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="mt-6 space-y-2 text-sm text-gray-700">
          <h3 className="font-semibold text-gray-900">
            {WATER_PROTEIN_SECTION.protein.heading}
          </h3>
          <p>{WATER_PROTEIN_SECTION.protein.intro}</p>
          <ul className="list-disc space-y-1 pl-5">
            {WATER_PROTEIN_SECTION.protein.breakdownItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p>{WATER_PROTEIN_SECTION.protein.exampleIntro}</p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="px-3 py-2"></th>
                  {WATER_PROTEIN_SECTION.protein.comparisonColumns.map((col) => (
                    <th key={col} className="px-3 py-2">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {WATER_PROTEIN_SECTION.protein.comparisonRows.map((row) => (
                  <tr key={row.label} className="border-t border-gray-100">
                    <td className="px-3 py-2 font-medium text-gray-900">
                      {row.label}
                    </td>
                    {row.values.map((value, i) => (
                      <td key={i} className="px-3 py-2 text-gray-700">
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p>{WATER_PROTEIN_SECTION.protein.differenceNote}</p>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
            <p className="text-sm font-medium text-gray-900">1食の目安</p>
            <p className="mt-1 text-xs text-gray-600">
              {WATER_PROTEIN_SECTION.protein.guideNote}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="font-semibold text-gray-900">実践的な組み立て方</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="px-3 py-2">優先度</th>
                <th className="px-3 py-2">やること</th>
              </tr>
            </thead>
            <tbody>
              {PRACTICE_ROWS.map((row) => (
                <tr key={row.action} className="border-t border-gray-100">
                  <td className="px-3 py-2 whitespace-nowrap font-medium text-gray-900">
                    {row.priority}
                  </td>
                  <td className="px-3 py-2 text-gray-700">{row.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="font-semibold text-gray-900">続けるためのポイント</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-700">
          {CONTINUATION_TIPS.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </section>

      <p className="text-sm text-gray-600">{CLOSING_NOTE}</p>
    </div>
  );
}
