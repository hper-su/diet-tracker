"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLiveQuery } from "@/lib/db/use-live-query";
import { getClient } from "@/lib/db/clients";
import { formatClientName } from "@/lib/format/client-name";
import { listFoods } from "@/lib/db/foods";
import { listMealLogsByDate, listMealLogTotalsByDateRange } from "@/lib/db/meal-logs";
import { listUsualMeals } from "@/lib/db/usual-meals";
import { fillDailyMealTotals, sumMealLogAmounts } from "@/lib/health/meal-totals";
import { calculateMacroRatioPercent } from "@/lib/health/pfc-balance";
import { getCurrentDietPlan } from "@/lib/server/current-plan";
import { addDaysISODate, listISODateRange, todayISODate } from "@/lib/date";
import { ClientTabs } from "../client-tabs";
import { MealLogForm } from "./meal-log-form";
import { MealSummaryChart, PFCTrendChart } from "./meal-summary-chart";
import { deleteMealLogAction, addUsualMealsAsLogAction } from "./actions";

const SUMMARY_RANGES = { "7": "週次(7日)", "30": "月次(30日)" } as const;
type SummaryRangeDays = keyof typeof SUMMARY_RANGES;

const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: "朝食",
  lunch: "昼食",
  dinner: "夕食",
  snack: "間食",
};

export default function ClientMealsPage() {
  return (
    <Suspense>
      <ClientMealsPageInner />
    </Suspense>
  );
}

function ClientMealsPageInner() {
  const searchParams = useSearchParams();
  const clientId = Number(searchParams.get("id"));
  const date = searchParams.get("date") || todayISODate();
  const summaryRangeDays: SummaryRangeDays = searchParams.get("range") === "30" ? "30" : "7";

  const summaryFromDate = addDaysISODate(date, -(Number(summaryRangeDays) - 1));
  const summaryDates = listISODateRange(summaryFromDate, date);

  const data = useLiveQuery(async () => {
    const client = await getClient(clientId);
    if (!client) return { client: null };

    const [foods, usualMeals, logs, planResult, rangeTotals] = await Promise.all([
      listFoods(),
      listUsualMeals(clientId),
      listMealLogsByDate(clientId, date),
      getCurrentDietPlan(clientId),
      listMealLogTotalsByDateRange(clientId, summaryFromDate, date),
    ]);

    return { client, foods, usualMeals, logs, planResult, rangeTotals };
  }, [clientId, date, summaryFromDate], [
    "clients",
    "foods",
    "usualMeals",
    "mealLogs",
    "measurements",
    "usualExercises",
  ]);

  if (!Number.isInteger(clientId) || clientId <= 0) {
    return <NotFound />;
  }

  if (!data) {
    return null;
  }

  if (!data.client) {
    return <NotFound />;
  }

  const { client, foods, usualMeals, logs, planResult, rangeTotals } = data;
  const { plan, pfc } = planResult;

  const totals = sumMealLogAmounts(
    logs.map((l) => ({
      kcal: l.kcal,
      proteinG: l.proteinG,
      fatG: l.fatG,
      carbG: l.carbG,
    })),
  );
  const totalsRatio = calculateMacroRatioPercent(totals);
  // プランタブの「PFCバランス(1日の目安)」と同じ目標値。実際の記録と見比べられるよう、
  // このページでも目標のg・%(カロリーベース、実際の記録と同じ算出方法)を表示する。
  const pfcTargetRatio = pfc ? calculateMacroRatioPercent(pfc) : null;

  const remainingKcal = plan ? plan.targetIntakeCalories - totals.kcal : null;

  const summaryData = fillDailyMealTotals(rangeTotals, summaryDates);
  // 週次(7日)表示のときだけ使う、直近7日の合計と目標(1日の目標×7日分)。
  const weeklyTotals = sumMealLogAmounts(summaryData);
  const weeklyTargetKcal = plan ? plan.targetIntakeCalories * 7 : null;
  const weeklyTargetPfc = pfc
    ? { proteinG: pfc.proteinG * 7, fatG: pfc.fatG * 7, carbG: pfc.carbG * 7 }
    : null;

  return (
    <div className="space-y-6">
      <ClientTabs id={client.id} active="meals" />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">
          {formatClientName(client.name)} - 食事記録
        </h1>
        <div className="flex items-center gap-2 text-sm">
          <Link
            href={`/clients/detail/meals?id=${clientId}&date=${addDaysISODate(date, -1)}&range=${summaryRangeDays}`}
            className="rounded border border-gray-300 px-2 py-1 hover:bg-gray-50"
          >
            ← 前日
          </Link>
          <span className="font-medium">{date}</span>
          <Link
            href={`/clients/detail/meals?id=${clientId}&date=${addDaysISODate(date, 1)}&range=${summaryRangeDays}`}
            className="rounded border border-gray-300 px-2 py-1 hover:bg-gray-50"
          >
            翌日 →
          </Link>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">合計カロリー</p>
          <p className="text-2xl font-semibold">
            {totals.kcal.toFixed(0)}{" "}
            <span className="text-sm font-normal text-gray-500">kcal</span>
          </p>
          {plan && (
            <p className="text-xs text-gray-400">
              目標 {plan.targetIntakeCalories.toFixed(0)}kcal
            </p>
          )}
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">たんぱく質</p>
          <p className="text-2xl font-semibold">
            {totals.proteinG.toFixed(0)}
            <span className="text-sm font-normal text-gray-500">g</span>
          </p>
          {totalsRatio && (
            <p className="text-xs text-gray-400">
              {totalsRatio.proteinPct.toFixed(0)}%
            </p>
          )}
          {pfc && (
            <p className="text-xs text-gray-400">
              目標 {pfc.proteinG.toFixed(0)}g
              {pfcTargetRatio && `(${pfcTargetRatio.proteinPct.toFixed(0)}%)`}
            </p>
          )}
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">脂質</p>
          <p className="text-2xl font-semibold">
            {totals.fatG.toFixed(0)}
            <span className="text-sm font-normal text-gray-500">g</span>
          </p>
          {totalsRatio && (
            <p className="text-xs text-gray-400">
              {totalsRatio.fatPct.toFixed(0)}%
            </p>
          )}
          {pfc && (
            <p className="text-xs text-gray-400">
              目標 {pfc.fatG.toFixed(0)}g
              {pfcTargetRatio && `(${pfcTargetRatio.fatPct.toFixed(0)}%)`}
            </p>
          )}
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">炭水化物</p>
          <p className="text-2xl font-semibold">
            {totals.carbG.toFixed(0)}
            <span className="text-sm font-normal text-gray-500">g</span>
          </p>
          {totalsRatio && (
            <p className="text-xs text-gray-400">
              {totalsRatio.carbPct.toFixed(0)}%
            </p>
          )}
          {pfc && (
            <p className="text-xs text-gray-400">
              目標 {pfc.carbG.toFixed(0)}g
              {pfcTargetRatio && `(${pfcTargetRatio.carbPct.toFixed(0)}%)`}
            </p>
          )}
        </div>
      </section>

      {plan ? (
        <section
          className={`rounded-lg border p-4 text-sm ${
            remainingKcal !== null && remainingKcal < 0
              ? "border-red-200 bg-red-50 text-red-900"
              : "border-gray-200 bg-white text-gray-700"
          }`}
        >
          目標摂取カロリー {plan.targetIntakeCalories.toFixed(0)} kcal に対して、
          この日の合計は {totals.kcal.toFixed(0)} kcal です。
          {remainingKcal !== null && (
            <span className="font-medium">
              {" "}
              (残り {remainingKcal.toFixed(0)} kcal)
            </span>
          )}
        </section>
      ) : (
        <p className="text-xs text-gray-400">
          「概要」「プラン」タブでプロフィールと測定値を入力すると、目標摂取カロリーとの差分が表示されます。
        </p>
      )}

      {summaryRangeDays === "7" && (
        <section className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-2 font-medium">週間合計(直近7日)と目標との過不足</h2>
          {rangeTotals.length >= 7 ? (
            <div className="grid gap-4 sm:grid-cols-4">
              <WeeklyStat
                label="カロリー"
                unit="kcal"
                actual={weeklyTotals.kcal}
                target={weeklyTargetKcal}
              />
              <WeeklyStat
                label="たんぱく質"
                unit="g"
                actual={weeklyTotals.proteinG}
                target={weeklyTargetPfc?.proteinG ?? null}
              />
              <WeeklyStat
                label="脂質"
                unit="g"
                actual={weeklyTotals.fatG}
                target={weeklyTargetPfc?.fatG ?? null}
              />
              <WeeklyStat
                label="炭水化物"
                unit="g"
                actual={weeklyTotals.carbG}
                target={weeklyTargetPfc?.carbG ?? null}
              />
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              直近7日分の記録が揃うと、週間の合計と目標との過不足が表示されます(現在
              {rangeTotals.length}/7日分)。
            </p>
          )}
        </section>
      )}

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-medium">摂取カロリーの推移</h2>
          <div className="flex gap-2 text-xs">
            {(Object.keys(SUMMARY_RANGES) as SummaryRangeDays[]).map((days) => (
              <Link
                key={days}
                href={`/clients/detail/meals?id=${clientId}&date=${date}&range=${days}`}
                className={`rounded border px-2 py-1 ${
                  summaryRangeDays === days
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-300 hover:bg-gray-50"
                }`}
              >
                {SUMMARY_RANGES[days]}
              </Link>
            ))}
          </div>
        </div>
        <MealSummaryChart
          data={summaryData}
          targetIntakeCalories={plan?.targetIntakeCalories ?? null}
        />
        <h2 className="mt-4 mb-2 font-medium">摂取PFCの推移(g)</h2>
        <PFCTrendChart
          data={summaryData}
          targetProteinG={pfc?.proteinG ?? null}
          targetFatG={pfc?.fatG ?? null}
          targetCarbG={pfc?.carbG ?? null}
        />
      </section>

      {usualMeals.length > 0 && (
        <form action={addUsualMealsAsLogAction}>
          <input type="hidden" name="client_id" value={clientId} />
          <input type="hidden" name="recorded_at" value={date} />
          <button
            type="submit"
            className="w-full rounded-lg border border-dashed border-gray-300 bg-white px-4 py-3 text-sm text-gray-600 hover:border-gray-400 hover:bg-gray-50"
          >
            普段の3食から{date}の記録を作成({usualMeals.length}件)
          </button>
        </form>
      )}

      <MealLogForm clientId={clientId} date={date} foods={foods} />

      <section className="rounded-lg border border-gray-200 bg-white">
        <h2 className="border-b border-gray-200 p-4 font-medium">
          {date} の記録
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="px-4 py-2">区分</th>
                <th className="px-4 py-2">食品</th>
                <th className="px-4 py-2">数量</th>
                <th className="px-4 py-2">kcal</th>
                <th className="px-4 py-2">P/F/C(g)</th>
                <th className="px-4 py-2">メモ</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-t border-gray-100">
                  <td className="px-4 py-2">{MEAL_TYPE_LABELS[log.mealType]}</td>
                  <td className="px-4 py-2">{log.foodName}</td>
                  <td className="px-4 py-2">{log.quantity}</td>
                  <td className="px-4 py-2">{log.kcal.toFixed(0)}</td>
                  <td className="px-4 py-2 text-gray-500">
                    {log.proteinG.toFixed(1)}/{log.fatG.toFixed(1)}/
                    {log.carbG.toFixed(1)}
                  </td>
                  <td className="px-4 py-2 text-gray-500">{log.memo ?? ""}</td>
                  <td className="px-4 py-2 text-right">
                    <form action={deleteMealLogAction}>
                      <input type="hidden" name="id" value={log.id} />
                      <input type="hidden" name="client_id" value={clientId} />
                      <button
                        type="submit"
                        className="text-xs text-gray-400 hover:text-red-600"
                      >
                        削除
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                    この日の記録はまだありません。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function WeeklyStat({
  label,
  unit,
  actual,
  target,
}: {
  label: string;
  unit: string;
  actual: number;
  target: number | null;
}) {
  const diff = target !== null ? Math.round(actual - target) : null;
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-xl font-semibold">
        {actual.toFixed(0)}
        <span className="text-sm font-normal text-gray-500">{unit}</span>
      </p>
      {target !== null && diff !== null && (
        <>
          <p className="text-xs text-gray-400">
            目標 {target.toFixed(0)}
            {unit}
          </p>
          <p className="text-xs font-medium text-gray-700">
            {diff > 0 ? `+${diff}` : diff}
            {unit}
            {diff > 0 ? "(超過)" : diff < 0 ? "(不足)" : ""}
          </p>
        </>
      )}
    </div>
  );
}

function NotFound() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">お客様が見つかりません。</p>
      <Link href="/clients" className="text-sm text-gray-900 underline">
        お客様一覧に戻る
      </Link>
    </div>
  );
}
