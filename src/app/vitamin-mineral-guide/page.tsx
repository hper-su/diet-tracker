import { Emphasized } from "@/components/emphasized";
import {
  SUBTITLE,
  WHAT_IS_HEADING,
  WHAT_IS_PARAGRAPHS,
  VITAMIN_CATEGORY,
  MINERAL_CATEGORY,
  OTHER_NUTRIENTS_HEADING,
  OTHER_NUTRIENTS_INTRO,
  OTHER_NUTRIENTS_TABLE,
  OTHER_NUTRIENTS_QUOTE,
  COOKING_HEADING,
  COOKING_INTRO,
  COOKING_TYPES,
  ROTATION_HEADING,
  ROTATION_PARAGRAPH,
  COOKING_METHOD_TABLE,
  ROTATION_QUOTE,
  ROTATION_CLOSING,
  SUMMARY_HEADING,
  SUMMARY_ITEMS,
  TRIVIA_HEADING,
  TRIVIA_INTRO,
  TRIVIA_STATS,
  TRIVIA_TERM,
  TRIVIA_EXPLANATION,
  type NutrientCategory,
  type NutrientTable,
  type Tone,
} from "@/lib/vitamin-mineral-guide";

const TONE_CLASSES: Record<Tone, { border: string; bg: string; text: string }> = {
  blue: { border: "border-blue-300", bg: "bg-blue-50", text: "text-blue-800" },
  amber: { border: "border-amber-300", bg: "bg-amber-50", text: "text-amber-800" },
  emerald: { border: "border-emerald-300", bg: "bg-emerald-50", text: "text-emerald-800" },
  orange: { border: "border-orange-300", bg: "bg-orange-50", text: "text-orange-800" },
};

function QuoteBox({ text }: { text: string }) {
  return (
    <div className="mt-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3">
      <p className="text-xs font-medium text-gray-500">ワンポイントアドバイス</p>
      <p className="mt-1 text-sm text-gray-700">「{text}」</p>
    </div>
  );
}

function DataTable({ table }: { table: NutrientTable }) {
  return (
    <div className="mt-2 overflow-x-auto">
      <table className="w-full min-w-max text-sm">
        <thead>
          <tr className="text-left text-gray-500">
            {table.columns.map((col) => (
              <th key={col} className="px-3 py-2">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row) => (
            <tr key={row.name} className="border-t border-gray-100">
              <td className="px-3 py-2 font-medium text-gray-900">{row.name}</td>
              <td className="px-3 py-2 text-gray-700">{row.col2}</td>
              <td className="px-3 py-2 text-gray-700">{row.col3}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function NutrientCategorySection({ category }: { category: NutrientCategory }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="font-semibold text-gray-900">{category.heading}</h2>
      {category.note && (
        <p className="mt-1 text-xs text-gray-500">{category.note}</p>
      )}
      <div className="mt-3 space-y-4">
        {category.types.map((type) => {
          const tone = TONE_CLASSES[type.tone];
          return (
            <div
              key={type.label}
              className={`rounded-lg border ${tone.border} ${tone.bg} p-3`}
            >
              <p className={`text-sm font-semibold ${tone.text}`}>
                {type.emoji} {type.label}
              </p>
              {type.description && (
                <p className="mt-1 text-sm text-gray-700">
                  <Emphasized text={type.description} />
                </p>
              )}
              <DataTable table={type.table} />
              {type.quote && <QuoteBox text={type.quote} />}
              {type.warning && (
                <p className="mt-2 text-xs font-medium text-rose-700">
                  ⚠️ {type.warning}
                </p>
              )}
            </div>
          );
        })}
      </div>
      {category.sharedQuote && <QuoteBox text={category.sharedQuote} />}
    </section>
  );
}

export default function VitaminMineralGuidePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">カラダを作る栄養素ガイド</h1>
        <p className="mt-1 text-sm text-gray-600">{SUBTITLE}</p>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="font-semibold text-gray-900">{WHAT_IS_HEADING}</h2>
        <div className="mt-2 space-y-2 text-sm text-gray-700">
          {WHAT_IS_PARAGRAPHS.map((paragraph, i) => (
            <p key={i}>
              <Emphasized text={paragraph} />
            </p>
          ))}
        </div>
      </section>

      <NutrientCategorySection category={VITAMIN_CATEGORY} />
      <NutrientCategorySection category={MINERAL_CATEGORY} />

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="font-semibold text-gray-900">
          {OTHER_NUTRIENTS_HEADING}
        </h2>
        <p className="mt-2 text-sm text-gray-700">{OTHER_NUTRIENTS_INTRO}</p>
        <DataTable table={OTHER_NUTRIENTS_TABLE} />
        <QuoteBox text={OTHER_NUTRIENTS_QUOTE} />
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="font-semibold text-gray-900">{COOKING_HEADING}</h2>
        <p className="mt-2 text-sm text-gray-700">
          <Emphasized text={COOKING_INTRO} />
        </p>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {COOKING_TYPES.map((type) => {
            const tone = TONE_CLASSES[type.tone];
            return (
              <div
                key={type.label}
                className={`rounded-lg border ${tone.border} ${tone.bg} p-3`}
              >
                <p className={`text-sm font-semibold ${tone.text}`}>
                  {type.emoji} {type.label}
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
                  {type.points.map((point) => (
                    <li key={point}>
                      <Emphasized text={point} />
                    </li>
                  ))}
                </ul>
                <div className="mt-2 rounded-lg bg-white/60 p-2">
                  <p className="text-xs font-medium text-gray-500">対策</p>
                  <p className="mt-0.5 text-sm text-gray-900">
                    <Emphasized text={type.action} />
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-3">
          <h3 className="font-medium text-gray-900">{ROTATION_HEADING}</h3>
          <p className="mt-2 text-sm text-gray-700">{ROTATION_PARAGRAPH}</p>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="px-3 py-2">調理法</th>
                  <th className="px-3 py-2">得意なこと</th>
                </tr>
              </thead>
              <tbody>
                {COOKING_METHOD_TABLE.map((row) => (
                  <tr key={row.method} className="border-t border-gray-100">
                    <td className="px-3 py-2 font-medium text-gray-900 whitespace-nowrap">
                      {row.method}
                    </td>
                    <td className="px-3 py-2 text-gray-700">{row.strength}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <QuoteBox text={ROTATION_QUOTE} />
          <p className="mt-3 text-sm font-bold text-gray-900">
            <Emphasized text={ROTATION_CLOSING} />
          </p>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="font-semibold text-gray-900">{SUMMARY_HEADING}</h2>
        <ol className="mt-3 space-y-2">
          {SUMMARY_ITEMS.map((item, i) => (
            <li
              key={item.bold}
              className="flex items-start gap-2 text-sm text-gray-700"
            >
              <span className="shrink-0 text-gray-400">{i + 1}.</span>
              <span>
                {item.emoji} <span className="font-bold text-gray-900">{item.bold}</span>{" "}
                {item.body}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="font-semibold text-gray-900">{TRIVIA_HEADING}</h2>
        <p className="mt-2 text-sm text-gray-700">{TRIVIA_INTRO}</p>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {TRIVIA_STATS.map((stat) => (
            <div
              key={stat.value}
              className="rounded-lg border border-gray-100 bg-gray-50 p-3"
            >
              <p className="text-lg font-bold text-gray-900">{stat.value}</p>
              <p className="mt-1 text-xs text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 rounded-lg border border-indigo-200 bg-indigo-50 p-3">
          <p className="text-sm font-semibold text-indigo-900">{TRIVIA_TERM}</p>
          <p className="mt-1 text-sm text-indigo-900">
            <Emphasized text={TRIVIA_EXPLANATION} />
          </p>
        </div>
      </section>
    </div>
  );
}
