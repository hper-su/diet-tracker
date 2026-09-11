"use client";

import { Fragment, useMemo, useState } from "react";
import {
  CLEARANCE_CHECK_ITEMS,
  CLEARANCE_INTRO,
  CLEARANCE_OPERATION_NOTES,
  COMMON_PRINCIPLES,
  CONDITION_CATEGORY_ORDER,
  CONFLICT_CASES,
  CONFLICT_CASES_INTRO,
  CONFLICT_CASES_NOTE,
  EAP_NOTE,
  EAP_STEPS,
  MEDICATION_CROSS_REFERENCE,
  MEDICATION_CROSS_REFERENCE_INSIGHTS,
  searchConditions,
  type Condition,
  type ConditionCategory,
} from "@/lib/conditions";

// **太字** と [表示文](URL) だけを解釈する簡易インラインMarkdownレンダラー。
function renderInline(text: string) {
  const tokens = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
  return tokens.map((token, i) => {
    const boldMatch = token.match(/^\*\*([^*]+)\*\*$/);
    if (boldMatch) {
      return (
        <strong key={i} className="font-semibold text-gray-900">
          {boldMatch[1]}
        </strong>
      );
    }
    const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={i}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline hover:text-blue-800"
        >
          {linkMatch[1]}
        </a>
      );
    }
    return <Fragment key={i}>{token}</Fragment>;
  });
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
      {items.map((item, i) => (
        <li key={i}>{renderInline(item)}</li>
      ))}
    </ul>
  );
}

function InfoBlock({
  title,
  items,
  tone = "default",
}: {
  title: string;
  items: string[];
  tone?: "default" | "danger" | "warning";
}) {
  const toneClass =
    tone === "danger"
      ? "border-red-200 bg-red-50"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50"
        : "border-gray-100 bg-gray-50";
  return (
    <div className={`rounded-lg border p-3 ${toneClass}`}>
      <p className="mb-1.5 text-xs font-semibold text-gray-600">{title}</p>
      <BulletList items={items} />
    </div>
  );
}

const CATEGORY_BADGE_CLASS: Record<ConditionCategory, string> = {
  運動器系: "border-sky-200 bg-sky-50 text-sky-900",
  "循環器・代謝系": "border-rose-200 bg-rose-50 text-rose-900",
  "呼吸器・神経・精神系": "border-violet-200 bg-violet-50 text-violet-900",
  "産科・腫瘍等": "border-emerald-200 bg-emerald-50 text-emerald-900",
};

function ConditionCard({
  condition,
  defaultOpen,
}: {
  condition: Condition;
  defaultOpen: boolean;
}) {
  return (
    <details
      key={condition.id}
      open={defaultOpen}
      className="group rounded-lg border border-gray-200 bg-white"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
        <span className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 text-xs font-semibold text-gray-400">
            {condition.order}
          </span>
          <span className="truncate font-medium text-gray-900">
            {condition.name}
          </span>
        </span>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-xs ${CATEGORY_BADGE_CLASS[condition.category]}`}
        >
          {condition.category}
        </span>
      </summary>

      <div className="space-y-3 border-t border-gray-100 px-4 py-3">
        <InfoBlock title="運動時の注意点" items={condition.precautions} />
        <InfoBlock title="実施すべきこと" items={condition.doThis} />
        <InfoBlock
          title="レッドフラグサイン(中止基準)"
          items={condition.redFlags}
          tone="danger"
        />
        <InfoBlock
          title="禁忌区分"
          items={condition.contraindications}
          tone="warning"
        />
        <InfoBlock title="服薬時の注意" items={condition.medication} />
        <InfoBlock title="メンタル面への配慮" items={condition.mentalCare} />
        <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
          <p className="mb-1.5 text-xs font-semibold text-gray-600">
            年齢による留意点
          </p>
          <p className="text-sm text-gray-700">
            {renderInline(condition.ageNote)}
          </p>
        </div>

        {condition.extraChecks && (
          <InfoBlock
            title="追加すると更に良いチェック項目"
            items={condition.extraChecks}
          />
        )}

        {condition.clearedMenu && (
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
            <p className="mb-1.5 text-xs font-semibold text-blue-900">
              クリア後に実施できる代表的トレーニングメニュー
            </p>
            <ul className="space-y-1 text-sm text-blue-900">
              {condition.clearedMenu.map((item) => (
                <li key={item.category}>
                  <strong className="font-semibold">{item.category}</strong>
                  {"　"}
                  {renderInline(item.text)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </details>
  );
}

export default function ConditionsPage() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<
    ConditionCategory | "全て"
  >("全て");

  const matches = useMemo(() => searchConditions(query), [query]);
  const hasQuery = query.trim().length > 0;

  const filtered = useMemo(
    () =>
      matches.filter(
        (c) => activeCategory === "全て" || c.category === activeCategory,
      ),
    [matches, activeCategory],
  );

  const grouped = useMemo(() => {
    return CONDITION_CATEGORY_ORDER.map((category) => ({
      category,
      items: filtered.filter((c) => c.category === category),
    })).filter((g) => g.items.length > 0);
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">疾患</h1>
        <p className="mt-1 text-sm text-gray-600">
          既往症別のパーソナルトレーニング対応リファレンスです。運動時の注意点・禁忌・レッドフラグサイン・服薬時の注意などを確認できます。あくまで一般的な目安であり、個別の運動可否の最終判断は主治医の指示を優先してください。
        </p>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="疾患名・キーワードで検索(例: 高血圧、しびれ、β遮断薬)"
          className="w-full max-w-sm rounded border border-gray-300 px-3 py-2 text-sm"
        />

        <div className="mt-3 flex flex-wrap gap-2">
          {(["全て", ...CONDITION_CATEGORY_ORDER] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full border px-3 py-1 text-sm font-medium ${
                activeCategory === cat
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-300 bg-white text-gray-600"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-medium">既往症一覧(全{filtered.length}件)</h2>
        {grouped.map((group) => (
          <div key={group.category} className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-500">
              {group.category}
            </h3>
            <div className="space-y-2">
              {group.items.map((condition) => (
                <ConditionCard
                  key={condition.id}
                  condition={condition}
                  defaultOpen={hasQuery}
                />
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="py-6 text-center text-sm text-gray-500">
            該当する既往症が見つかりませんでした。
          </p>
        )}
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="font-semibold text-gray-900">
          服薬注意点 横断一覧表
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          各既往症の項目内に分散している服薬情報を、薬剤カテゴリ別に横断整理したもの。複数疾患を併発しているクライアントの服薬確認に活用する。
        </p>
        <div className="mt-3 overflow-x-auto rounded-lg border border-gray-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500">
                <th className="px-3 py-2">薬剤分類</th>
                <th className="px-3 py-2">主な対象疾患(関連項目)</th>
                <th className="px-3 py-2">運動時の主な注意点</th>
              </tr>
            </thead>
            <tbody>
              {MEDICATION_CROSS_REFERENCE.map((row) => (
                <tr key={row.drugClass} className="border-t border-gray-100">
                  <td className="px-3 py-2 whitespace-nowrap font-medium text-gray-900">
                    {row.drugClass}
                  </td>
                  <td className="px-3 py-2 text-gray-700">
                    {row.relatedConditions}
                  </td>
                  <td className="px-3 py-2 text-gray-700">
                    {renderInline(row.note)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3">
          <p className="mb-1.5 text-xs font-semibold text-gray-600">
            横断的に見えるポイント
          </p>
          <BulletList items={MEDICATION_CROSS_REFERENCE_INSIGHTS} />
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="font-semibold text-gray-900">
          共通事項(全既往症に横断する原則)
        </h2>
        <div className="mt-3">
          <BulletList items={COMMON_PRINCIPLES} />
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="font-semibold text-gray-900">
          付録A:医療機関への確認書フォーマット(メディカルクリアランス)
        </h2>
        <p className="mt-1 text-sm text-gray-700">{CLEARANCE_INTRO}</p>
        <div className="mt-3">
          <p className="mb-1.5 text-xs font-semibold text-gray-600">
            確認したい項目
          </p>
          <BulletList items={CLEARANCE_CHECK_ITEMS} />
        </div>
        <div className="mt-3">
          <p className="mb-1.5 text-xs font-semibold text-gray-600">
            運用の考え方
          </p>
          <BulletList items={CLEARANCE_OPERATION_NOTES} />
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="font-semibold text-gray-900">
          付録B:救急対応(EAP:Emergency Action Plan)基本フロー
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          各項目の「レッドフラグサイン」が出現した際に、施設全体で共通して踏む手順。
        </p>
        <div className="mt-3 overflow-x-auto rounded-lg border border-gray-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500">
                <th className="px-3 py-2">手順</th>
                <th className="px-3 py-2">内容</th>
              </tr>
            </thead>
            <tbody>
              {EAP_STEPS.map((row) => (
                <tr key={row.step} className="border-t border-gray-100">
                  <td className="px-3 py-2 whitespace-nowrap font-medium text-gray-900">
                    {row.step}
                  </td>
                  <td className="px-3 py-2 text-gray-700">{row.content}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-gray-500">{EAP_NOTE}</p>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="font-semibold text-gray-900">
          付録C:複数疾患併発時に注意点が相反するケースの解消例
        </h2>
        <p className="mt-1 text-sm text-gray-700">{CONFLICT_CASES_INTRO}</p>
        <div className="mt-3 space-y-3">
          {CONFLICT_CASES.map((c) => (
            <div
              key={c.combination}
              className="rounded-lg border border-gray-100 bg-gray-50 p-3"
            >
              <p className="text-sm font-semibold text-gray-900">
                {c.combination}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                一見の矛盾:{c.conflict}
              </p>
              <p className="mt-1 text-sm text-gray-700">
                解消の考え方:{c.resolution}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm text-gray-600">{CONFLICT_CASES_NOTE}</p>
      </section>
    </div>
  );
}
