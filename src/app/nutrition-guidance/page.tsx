import Link from "next/link";
import { Emphasized } from "@/components/emphasized";
import { StatBox } from "@/components/stat-box";
import {
  INTRO_BEFORE,
  INTRO_BOLD,
  INTRO_AFTER,
  INTRO_HIGHLIGHT,
  INTRO_POINT,
  NUTRITION_PRIORITIES,
  PRACTICE_INTRO,
  PRACTICE_STEPS,
  CONTINUATION_TIPS,
  CLOSING_NOTE,
  type ToneCard,
} from "@/lib/nutrition-guidance";

// 「控えめに/積極的に」「NG/OK」「高GI/低GI」のような2択の対比カード。
function ToneCards({ cards }: { cards: ToneCard[] }) {
  return (
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-lg border-l-4 bg-gray-50 p-3 ${
            card.tone === "good" ? "border-l-emerald-500" : "border-l-rose-400"
          }`}
        >
          <p
            className={`text-sm font-semibold ${
              card.tone === "good" ? "text-emerald-700" : "text-rose-700"
            }`}
          >
            {card.label}
          </p>
          <p className="mt-1 text-sm text-gray-700">
            <Emphasized text={card.description} />
          </p>
          {card.foods && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {card.foods.map((food) => (
                <span
                  key={food}
                  className="rounded-full border border-gray-300 bg-white px-2 py-0.5 text-xs text-gray-700"
                >
                  {food}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function BulletList({ intro, items }: { intro?: string; items: string[] }) {
  return (
    <div className="mt-2 text-sm text-gray-700">
      {intro && <p className="font-medium">{intro}</p>}
      <ul className="mt-1 list-disc space-y-1 pl-5">
        {items.map((item) => (
          <li key={item}>
            <Emphasized text={item} />
          </li>
        ))}
      </ul>
    </div>
  );
}

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
        <p className="text-xs font-semibold tracking-wide text-gray-400">
          大前提
        </p>
        <p className="mt-1 text-base font-bold text-gray-900">
          {INTRO_BEFORE}「{INTRO_BOLD}」{INTRO_AFTER}
        </p>

        <div className="mt-3">
          <StatBox stat={INTRO_HIGHLIGHT} />
        </div>

        <p className="mt-2 rounded-lg bg-gray-50 p-3">
          <Emphasized text={INTRO_POINT} />
        </p>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="font-semibold text-gray-900">実践的な組み立て方</h2>
        <p className="mt-2 text-sm text-gray-700">{PRACTICE_INTRO}</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {PRACTICE_STEPS.map((step) => (
            <div
              key={step.order}
              className={`flex items-start gap-3 rounded-lg border p-3 ${
                step.isPremise
                  ? "border-gray-300 bg-gray-50 sm:col-span-2"
                  : "border-gray-200"
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${
                  step.isPremise ? "bg-gray-500" : "bg-gray-900"
                }`}
              >
                {step.isPremise ? "!" : step.order}
              </span>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {step.title}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">{step.summary}</p>
              </div>
            </div>
          ))}
        </div>
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
                <p key={i}>
                  <Emphasized text={paragraph} />
                </p>
              ))}
            </div>

            {priority.bulletList && (
              <BulletList
                intro={priority.bulletListIntro}
                items={priority.bulletList}
              />
            )}

            {priority.detailParagraphs && (
              <div className="mt-3 rounded-lg bg-gray-50 p-3">
                {priority.detailHeading && (
                  <p className="text-sm font-medium text-gray-900">
                    {priority.detailHeading}
                  </p>
                )}
                <div className="mt-1 space-y-2 text-sm text-gray-700">
                  {priority.detailParagraphs.map((paragraph, i) => (
                    <p key={i}>
                      <Emphasized text={paragraph} />
                    </p>
                  ))}
                </div>
                {priority.detailBulletList && (
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-gray-700">
                    {priority.detailBulletList.map((item) => (
                      <li key={item}>
                        <Emphasized text={item} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {priority.toneCards && <ToneCards cards={priority.toneCards} />}

            {priority.comparisonRows && priority.comparisonColumns && (
              <div className="mt-3 space-y-2">
                {priority.comparisonIntro && (
                  <p className="text-sm text-gray-700">
                    {priority.comparisonIntro}
                  </p>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max text-sm">
                    <thead>
                      <tr className="text-left text-gray-500">
                        <th className="px-3 py-2"></th>
                        {priority.comparisonColumns.map((col) => (
                          <th key={col} className="px-3 py-2">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {priority.comparisonRows.map((row) => (
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
              </div>
            )}

            {priority.combinationExample && (
              <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
                <p className="text-sm font-medium text-gray-900">
                  {priority.combinationExample.title}
                </p>
                <div className="mt-2 space-y-2">
                  {priority.combinationExample.meals.map((meal) => (
                    <div
                      key={meal.time}
                      className="flex flex-wrap items-center gap-1.5"
                    >
                      <span className="inline-flex shrink-0 items-center rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-gray-700 ring-1 ring-gray-200">
                        {meal.time}
                      </span>
                      {meal.items.map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-gray-300 bg-white px-2 py-0.5 text-xs text-gray-700"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-sm font-bold text-gray-900">
                  {priority.combinationExample.total}
                </p>
              </div>
            )}

            {priority.secondaryBulletList && (
              <BulletList
                intro={priority.secondaryBulletListTitle}
                items={priority.secondaryBulletList}
              />
            )}

            {priority.subheading2 && (
              <h4 className="mt-4 text-sm font-semibold text-gray-900">
                {priority.subheading2}
              </h4>
            )}

            {priority.paragraphsAfterExample && (
              <div className="mt-2 space-y-2 text-sm text-gray-700">
                {priority.paragraphsAfterExample.map((paragraph, i) => (
                  <p key={i}>
                    <Emphasized text={paragraph} />
                  </p>
                ))}
              </div>
            )}

            {priority.statHighlight && (
              <div className="mt-3">
                <StatBox stat={priority.statHighlight} />
              </div>
            )}

            {priority.tipsList && (
              <BulletList
                intro={priority.tipsListIntro}
                items={priority.tipsList}
              />
            )}

            {priority.subSections && (
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
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
                    <p className="mt-1 text-xs text-gray-600">
                      <Emphasized text={sub.body} />
                    </p>
                  </div>
                ))}
              </div>
            )}

            {priority.closingParagraph && (
              <p className="mt-3 text-sm text-gray-700">
                <Emphasized text={priority.closingParagraph} />
              </p>
            )}

            {priority.example && (
              <p className="mt-3 text-xs text-gray-500">{priority.example}</p>
            )}

            {priority.link && (
              <p className="mt-3 text-sm">
                <Link
                  href={priority.link.href}
                  className="text-blue-600 underline hover:text-blue-800"
                >
                  {priority.link.label}
                </Link>
              </p>
            )}
          </section>
        ))}
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="font-semibold text-gray-900">続けるためのポイント</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-700">
          {CONTINUATION_TIPS.map((tip) => (
            <li key={tip}>
              <Emphasized text={tip} />
            </li>
          ))}
        </ul>
      </section>

      <p className="text-sm text-gray-600">{CLOSING_NOTE}</p>
    </div>
  );
}
