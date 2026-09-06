"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { getClient } from "@/lib/db/clients";
import { formatClientName } from "@/lib/format/client-name";
import { listFoods } from "@/lib/db/foods";
import { listExercises } from "@/lib/db/exercises";
import { listUsualMeals, type UsualMealType } from "@/lib/db/usual-meals";
import { getCurrentDietPlan } from "@/lib/server/current-plan";
import { buildDietPlanFormulas } from "@/lib/health/diet-plan";
import { KCAL_PER_KG_BODY_WEIGHT } from "@/lib/health/calorie-adjustment";
import { sumMealLogAmounts } from "@/lib/health/meal-totals";
import { ACTIVITY_LEVEL_SOURCE } from "@/lib/health/activity-level";
import { PFC_PRESETS } from "@/lib/health/pfc-preset";
import { calculateMacroRatioPercent } from "@/lib/health/pfc-balance";
import { ClientTabs } from "../client-tabs";
import { PlanGoalForm } from "./plan-goal-form";
import { UsualMealForm } from "./usual-meal-form";
import { deleteUsualMealAction } from "./usual-meal-actions";
import { UsualExerciseForm } from "./usual-exercise-form";
import { deleteUsualExerciseAction } from "./usual-exercise-actions";

const USUAL_MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;

const USUAL_MEAL_TYPE_LABELS: Record<UsualMealType, string> = {
  breakfast: "朝食",
  lunch: "昼食",
  dinner: "夕食",
  snack: "間食",
};

// 献立例(家庭料理編・コンビニ編・外食編)のP/F/C表示を「P94g(25%)・F46g(24%)・C188g(51%)」
// のように統一するための共通表示。%はカロリーベースの比率で、四捨五入の都合で
// 合計がぴったり100%にならないことがある(他の%表示箇所と同様の扱い)。
function MacroBreakdown({
  macros,
}: {
  macros: { proteinG: number; fatG: number; carbG: number };
}) {
  const ratio = calculateMacroRatioPercent(macros);
  return (
    <>
      P{macros.proteinG.toFixed(0)}g
      {ratio && `(${ratio.proteinPct.toFixed(0)}%)`}・F
      {macros.fatG.toFixed(0)}g
      {ratio && `(${ratio.fatPct.toFixed(0)}%)`}・C
      {macros.carbG.toFixed(0)}g
      {ratio && `(${ratio.carbPct.toFixed(0)}%)`}
    </>
  );
}

const MACRO_LABELS = {
  protein: {
    heading: "P: たんぱく質",
    detail: "1g=4kcal。筋肉や臓器の材料",
  },
  fat: {
    heading: "F: 脂質",
    detail: "1g=9kcal。ホルモンや細胞膜の材料",
  },
  carb: {
    heading: "C: 炭水化物",
    detail: "1g=4kcal。エネルギー源",
  },
} as const;

export default function ClientPlanPage() {
  return (
    <Suspense>
      <ClientPlanPageInner />
    </Suspense>
  );
}

function ClientPlanPageInner() {
  const searchParams = useSearchParams();
  const clientId = Number(searchParams.get("id"));

  const data = useLiveQuery(async () => {
    const client = await getClient(clientId);
    if (!client) return { client: null };

    const [planResult, foods, exercises, usualMeals] = await Promise.all([
      getCurrentDietPlan(clientId),
      listFoods(),
      listExercises(),
      listUsualMeals(clientId),
    ]);

    return { client, planResult, foods, exercises, usualMeals };
  }, [clientId]);

  if (!Number.isInteger(clientId) || clientId <= 0) {
    return <NotFound />;
  }

  if (!data) {
    return null;
  }

  if (!data.client) {
    return <NotFound />;
  }

  const { client, planResult, foods, exercises, usualMeals } = data;
  const {
    plan,
    pfc,
    pfcPreset,
    mealSuggestions,
    mealSuggestionsError,
    mealCombos,
    missingFields,
    planInputs,
    usualExercises,
    avgDailyExerciseKcalTotal,
  } = planResult;
  const pfcPresetInfo = PFC_PRESETS[pfcPreset];
  const formulas = plan && planInputs ? buildDietPlanFormulas(planInputs, plan) : null;

  const usualMealsByType = Object.fromEntries(
    USUAL_MEAL_TYPES.map((type) => [
      type,
      usualMeals.filter((meal) => meal.mealType === type),
    ]),
  ) as Record<UsualMealType, typeof usualMeals>;
  const usualMealsTotal = sumMealLogAmounts(usualMeals);
  const usualMealsTotalRatio = calculateMacroRatioPercent(usualMealsTotal);

  return (
    <div className="space-y-6">
      <ClientTabs id={client.id} active="plan" />

      <h1 className="text-lg font-semibold">
        {formatClientName(client.name)} - プラン
      </h1>

      <PlanGoalForm
        clientId={client.id}
        currentWeightChangeKg={client.targetWeightChangeKg}
        currentPeriodMonths={client.targetPeriodMonths}
        currentTargetWeightKg={client.targetWeightKg}
      />

      <section className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-gray-900">普段の運動習慣</h2>
          <p className="text-sm text-gray-500">
            平均{" "}
            <span className="text-lg font-semibold text-gray-900">
              {avgDailyExerciseKcalTotal.toFixed(0)}
            </span>{" "}
            kcal/日
          </p>
        </div>
        <p className="text-xs text-gray-400">
          出典: 厚生労働省「健康づくりのための身体活動・運動ガイド2023」のメッツ表。
          メッツ×体重×時間×1.05で算出し、週の頻度から1日あたりの平均消費カロリーとして表示しています(参考値。下のメンテナンスカロリーには加算していません)。
        </p>
        <ul className="space-y-1">
          {usualExercises.map((habit) => (
            <li
              key={habit.id}
              className="flex items-center justify-between gap-2 text-sm text-gray-700"
            >
              <span className="truncate">
                {habit.exerciseName}({habit.mets}メッツ) × {habit.durationMin}分
              </span>
              <span className="flex shrink-0 items-center gap-3">
                <span className="text-right">
                  {habit.kcalPerSession != null ? (
                    <>
                      <span className="font-medium text-gray-900">
                        {habit.kcalPerSession.toFixed(0)}kcal
                      </span>
                      <span className="text-gray-500">(1回あたり)</span>
                      <span className="block text-xs text-gray-400">
                        週{habit.frequencyPerWeek}回のペース → 平均
                        {habit.avgDailyKcal!.toFixed(0)}kcal/日(参考値)
                      </span>
                    </>
                  ) : (
                    "体重の記録が必要です"
                  )}
                </span>
                <form action={deleteUsualExerciseAction}>
                  <input type="hidden" name="id" value={habit.id} />
                  <input type="hidden" name="client_id" value={client.id} />
                  <button
                    type="submit"
                    className="text-gray-400 hover:text-red-600"
                  >
                    削除
                  </button>
                </form>
              </span>
            </li>
          ))}
          {usualExercises.length === 0 && (
            <li className="text-xs text-gray-400">まだ記録がありません。</li>
          )}
        </ul>
        <UsualExerciseForm clientId={client.id} exercises={exercises} />
      </section>

      {!plan ? (
        <section className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <p className="font-medium">
            ⚠ プランを算出するには、以下の情報が不足しています
          </p>
          <ul className="list-disc space-y-1 pl-5">
            {missingFields.map((field) => (
              <li key={field.label}>
                <span className="font-medium">{field.label}</span>
                <span> — {field.hint}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-sm text-gray-500">
                基礎代謝量(BMR)
                {plan.bmrIsEstimated ? "・推定値" : "・実測値"}
              </p>
              <p className="text-2xl font-semibold">
                {plan.bmr.toFixed(0)}{" "}
                <span className="text-sm font-normal text-gray-500">kcal/日</span>
              </p>
              {formulas && (
                <p className="mt-1 text-xs text-gray-400">{formulas.bmr}</p>
              )}
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-sm text-gray-500">メンテナンスカロリー</p>
              <p className="text-2xl font-semibold">
                {plan.maintenanceCalories.toFixed(0)}{" "}
                <span className="text-sm font-normal text-gray-500">kcal/日</span>
              </p>
              {formulas && (
                <p className="mt-1 text-xs text-gray-400">
                  {formulas.maintenanceCalories}
                </p>
              )}
              <p className="mt-1 text-[10px] text-gray-300">
                {ACTIVITY_LEVEL_SOURCE}
                。活動レベルは「概要」タブのプロフィールで変更できます。
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-sm text-gray-500">摂取目標カロリー</p>
              <p className="text-2xl font-semibold">
                {plan.targetIntakeCalories.toFixed(0)}{" "}
                <span className="text-sm font-normal text-gray-500">kcal/日</span>
              </p>
              {formulas && (
                <p className="mt-1 text-xs text-gray-400">
                  {formulas.targetIntakeCalories}
                </p>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
            <p className="font-medium">カロリーと体重変化の目安</p>
            <p className="mt-1 text-xs">
              体脂肪を1kg減らす・増やすには、約{KCAL_PER_KG_BODY_WEIGHT.toLocaleString()}
              kcalの摂取カロリーの過不足(消費または蓄積)が必要とされています。上の「摂取目標カロリー」は、この目安と1か月あたりの目標体重変化から算出しています。
            </p>
          </section>

          <section className="space-y-1 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            {plan.notes.map((note) => (
              <p key={note}>※ {note}</p>
            ))}
          </section>

          {pfc && (
            <section className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700">
              <h2 className="font-medium text-gray-900">
                PFCバランス(1日の目安)
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                {pfcPresetInfo.label}(P{Math.round(pfcPresetInfo.proteinRatio * 100)}%・F
                {Math.round(pfcPresetInfo.fatRatio * 100)}%・C
                {Math.round(pfcPresetInfo.carbRatio * 100)}%) — {pfcPresetInfo.description}
              </p>
              <p className="text-[10px] text-gray-300">
                理想のPFCバランスは「概要」タブのプロフィールで変更できます。
              </p>
              <div className="mt-3 grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">
                    {MACRO_LABELS.protein.heading}
                  </p>
                  <p className="text-lg font-semibold">{pfc.proteinG.toFixed(0)}g</p>
                  <p className="text-xs text-gray-500">
                    {pfc.proteinKcal.toFixed(0)} kcal
                  </p>
                  <p className="mt-1 text-[10px] text-gray-400">
                    {MACRO_LABELS.protein.detail}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">{MACRO_LABELS.fat.heading}</p>
                  <p className="text-lg font-semibold">{pfc.fatG.toFixed(0)}g</p>
                  <p className="text-xs text-gray-500">
                    {pfc.fatKcal.toFixed(0)} kcal
                  </p>
                  <p className="mt-1 text-[10px] text-gray-400">
                    {MACRO_LABELS.fat.detail}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">{MACRO_LABELS.carb.heading}</p>
                  <p className="text-lg font-semibold">{pfc.carbG.toFixed(0)}g</p>
                  <p className="text-xs text-gray-500">
                    {pfc.carbKcal.toFixed(0)} kcal
                  </p>
                  <p className="mt-1 text-[10px] text-gray-400">
                    {MACRO_LABELS.carb.detail}
                  </p>
                </div>
              </div>

              {mealSuggestionsError && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-900">
                  献立例(家庭料理編)を表示できません: {mealSuggestionsError}
                </div>
              )}

              {mealSuggestions && (
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900">
                      3食に分けた場合の献立例(家庭料理編)
                    </p>
                    <p className="shrink-0 text-right text-xs text-gray-500">
                      1日合計{" "}
                      <span className="font-semibold text-gray-900">
                        約
                        {(
                          mealSuggestions.breakfast.kcal +
                          mealSuggestions.lunch.kcal +
                          mealSuggestions.dinner.kcal
                        ).toFixed(0)}
                      </span>{" "}
                      kcal
                      <span className="block text-[10px] text-gray-400">
                        <MacroBreakdown
                          macros={{
                            proteinG:
                              mealSuggestions.breakfast.proteinG +
                              mealSuggestions.lunch.proteinG +
                              mealSuggestions.dinner.proteinG,
                            fatG:
                              mealSuggestions.breakfast.fatG +
                              mealSuggestions.lunch.fatG +
                              mealSuggestions.dinner.fatG,
                            carbG:
                              mealSuggestions.breakfast.carbG +
                              mealSuggestions.lunch.carbG +
                              mealSuggestions.dinner.carbG,
                          }}
                        />
                      </span>
                    </p>
                  </div>
                  <p className="text-[10px] text-gray-400">
                    摂取目標カロリーから算出したP/F/Cの1日分を3食均等に割り、
                    高たんぱく・低脂質な献立例(主食・主菜・副菜)に近づくよう
                    量を調整した目安です。脂質は献立の食材から出る実際の量を示しており、
                    目標とぴったり一致しない場合があります。実際の献立は自由に組み合わせてください。
                  </p>
                  <div className="mt-2 grid gap-3 sm:grid-cols-3">
                    {(
                      [
                        { label: "朝食", suggestion: mealSuggestions.breakfast },
                        { label: "昼食", suggestion: mealSuggestions.lunch },
                        { label: "夕食", suggestion: mealSuggestions.dinner },
                      ] as const
                    ).map(({ label, suggestion }) => (
                      <div
                        key={label}
                        className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-gray-900">
                            {label}
                          </h3>
                          <span className="text-sm font-semibold text-gray-900">
                            約{suggestion.kcal.toFixed(0)} kcal
                          </span>
                        </div>
                        <ul className="mt-2 space-y-1 text-xs text-gray-600">
                          {suggestion.items.map((item) => (
                            <li
                              key={item.label}
                              className="flex items-start justify-between gap-2"
                            >
                              <span className="min-w-0 flex-1 break-words">
                                {item.label}
                              </span>
                              <span className="shrink-0 whitespace-nowrap text-gray-500">
                                約{item.grams}g({item.kcal.toFixed(0)}kcal)
                              </span>
                            </li>
                          ))}
                        </ul>
                        <p className="mt-2 text-[10px] text-gray-400">
                          <MacroBreakdown macros={suggestion} />
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {mealCombos && (
                <>
                  {(
                    [
                      {
                        heading: "3食に分けた場合の献立例(コンビニ編)",
                        note: "コンビニで買える実在の商品(セブンイレブン・ローソン・ファミリーマート等)を、1食あたり最大4品目まで組み合わせ、1食分のP/F/C目標に近づけた例です。個数は各1個で、グラム単位の調整はできないため目標とぴったり一致しない場合があります。",
                        combos: mealCombos.convenienceStore,
                      },
                      {
                        heading: "3食に分けた場合の献立例(外食編)",
                        note: "飲食店チェーン(やよい軒・ガスト・松屋等)の実在のメニューを、1食あたり最大4品目まで組み合わせ、1食分のP/F/C目標に近づけた例です。個数は各1品で、グラム単位の調整はできないため目標とぴったり一致しない場合があります。",
                        combos: mealCombos.eatingOut,
                      },
                    ] as const
                  ).map(({ heading, note, combos }) => {
                    const dailyTotal = {
                      kcal: combos.breakfast.kcal + combos.lunch.kcal + combos.dinner.kcal,
                      proteinG:
                        combos.breakfast.proteinG + combos.lunch.proteinG + combos.dinner.proteinG,
                      fatG: combos.breakfast.fatG + combos.lunch.fatG + combos.dinner.fatG,
                      carbG: combos.breakfast.carbG + combos.lunch.carbG + combos.dinner.carbG,
                    };
                    return (
                    <div key={heading} className="mt-4 border-t border-gray-100 pt-4">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-gray-900">{heading}</p>
                        <p className="shrink-0 text-right text-xs text-gray-500">
                          1日合計{" "}
                          <span className="font-semibold text-gray-900">
                            約{dailyTotal.kcal.toFixed(0)}
                          </span>{" "}
                          kcal
                          <span className="block text-[10px] text-gray-400">
                            <MacroBreakdown macros={dailyTotal} />
                          </span>
                        </p>
                      </div>
                      <p className="text-[10px] text-gray-400">{note}</p>
                      <div className="mt-2 grid gap-3 sm:grid-cols-3">
                        {(
                          [
                            { label: "朝食", combo: combos.breakfast },
                            { label: "昼食", combo: combos.lunch },
                            { label: "夕食", combo: combos.dinner },
                          ] as const
                        ).map(({ label, combo }) => (
                          <div
                            key={label}
                            className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                          >
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-medium text-gray-900">
                                {label}
                              </h3>
                              <span className="text-sm font-semibold text-gray-900">
                                約{combo.kcal.toFixed(0)} kcal
                              </span>
                            </div>
                            {combo.items.length > 0 ? (
                              <ul className="mt-2 space-y-1 text-xs text-gray-600">
                                {combo.items.map((item) => (
                                  <li
                                    key={item.label}
                                    className="flex items-start justify-between gap-2"
                                  >
                                    <span className="min-w-0 flex-1 break-words">
                                      {item.label}
                                    </span>
                                    <span className="shrink-0 whitespace-nowrap text-gray-500">
                                      1個({item.kcal.toFixed(0)}kcal)
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="mt-2 text-xs text-gray-400">
                                候補となる商品が見つかりませんでした。
                              </p>
                            )}
                            <p className="mt-2 text-[10px] text-gray-400">
                              <MacroBreakdown macros={combo} />
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                    );
                  })}
                </>
              )}
            </section>
          )}
        </>
      )}

      <section className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-gray-900">
            普段の3食(1日の目安)
          </h2>
          <p className="text-right text-sm text-gray-500">
            合計{" "}
            <span className="text-lg font-semibold text-gray-900">
              {usualMealsTotal.kcal.toFixed(0)}
            </span>{" "}
            kcal
            <span className="block text-xs text-gray-400">
              P{usualMealsTotal.proteinG.toFixed(0)}g・F
              {usualMealsTotal.fatG.toFixed(0)}g・C
              {usualMealsTotal.carbG.toFixed(0)}g
              {usualMealsTotalRatio && (
                <>
                  (P{usualMealsTotalRatio.proteinPct.toFixed(0)}%・F
                  {usualMealsTotalRatio.fatPct.toFixed(0)}%・C
                  {usualMealsTotalRatio.carbPct.toFixed(0)}%)
                </>
              )}
            </span>
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {USUAL_MEAL_TYPES.map((type) => {
            const items = usualMealsByType[type];
            const subtotal = sumMealLogAmounts(items);
            return (
              <div
                key={type}
                className="rounded-lg border border-gray-200 bg-gray-50 p-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900">
                    {USUAL_MEAL_TYPE_LABELS[type]}
                  </h3>
                  <span className="text-sm font-semibold text-gray-900">
                    {subtotal.kcal.toFixed(0)} kcal
                  </span>
                </div>
                <ul className="mt-2 space-y-1">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-2 text-xs text-gray-600"
                    >
                      <span className="truncate">
                        {item.foodName} × {item.quantity}
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        {item.kcal.toFixed(0)} kcal
                        <form action={deleteUsualMealAction}>
                          <input type="hidden" name="id" value={item.id} />
                          <input
                            type="hidden"
                            name="client_id"
                            value={client.id}
                          />
                          <button
                            type="submit"
                            className="text-gray-400 hover:text-red-600"
                          >
                            削除
                          </button>
                        </form>
                      </span>
                    </li>
                  ))}
                  {items.length === 0 && (
                    <li className="text-xs text-gray-400">
                      まだ記録がありません。
                    </li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>

        <UsualMealForm clientId={client.id} foods={foods} />
      </section>
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
