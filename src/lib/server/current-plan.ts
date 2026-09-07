import { getClient } from "@/lib/db/clients";
import { listMeasurements } from "@/lib/db/measurements";
import { listUsualExercises } from "@/lib/db/usual-exercises";
import { findLatestNonNull } from "@/lib/health/measurements";
import { calculateAge } from "@/lib/health/age";
import { calculateExerciseKcal } from "@/lib/health/exercise-kcal";
import {
  buildDietPlan,
  type DietPlan,
  type DietPlanInput,
} from "@/lib/health/diet-plan";
import { calculatePFCBalance, type PFCBalance } from "@/lib/health/pfc-balance";
import { PFC_PRESETS, type PFCPreset } from "@/lib/health/pfc-preset";
import { buildMealMenu, type MealSuggestion } from "@/lib/health/meal-suggestion";
import { getMealTemplates } from "@/lib/server/meal-templates";
import { getMealCombos, type MealCombosByEdition } from "@/lib/server/meal-combos";

const MEALS_PER_DAY = 3;

export type DailyMealSuggestions = {
  breakfast: MealSuggestion;
  lunch: MealSuggestion;
  dinner: MealSuggestion;
};

export type MissingField = {
  label: string;
  hint: string;
};

export type UsualExerciseWithKcal = {
  id: number;
  exerciseName: string;
  mets: number;
  durationMin: number;
  frequencyPerWeek: number;
  // 最新の体重に基づく、1回あたり・1日あたり(週の頻度で平均)の消費カロリー。
  // 体重の記録がない場合は算出できないためnull。
  kcalPerSession: number | null;
  avgDailyKcal: number | null;
};

export type CurrentPlanResult = {
  plan: DietPlan | null;
  pfc: PFCBalance | null;
  pfcPreset: PFCPreset;
  // 1日のPFC目標を3食均等に分けた場合の、朝食・昼食・夕食それぞれの献立例(目安)。
  mealSuggestions: DailyMealSuggestions | null;
  // mealSuggestionsの生成に失敗した場合の理由(献立例が使う代表食品が
  // 食品マスタの編集で無くなった場合など)。画面にそのまま表示できるメッセージ。
  mealSuggestionsError: string | null;
  // 同じ目標に対する、コンビニ編・外食編の献立例(実在の商品の組み合わせ)。
  mealCombos: MealCombosByEdition | null;
  // mealCombosの生成に失敗した場合の理由。通常は分類(カテゴリ)単位の取得なので
  // 起きないが、念のためmealSuggestionsと同様に捕捉してプランタブ全体の
  // エラー落ちを防ぐ。
  mealCombosError: string | null;
  missingFields: MissingField[];
  latestWeightKg: number | null;
  // plan算出に使った入力値。計算式を画面に表示する際に使う。
  planInputs: DietPlanInput | null;
  // 「普段の運動習慣」の一覧(消費カロリー算出済み)。プランタブの一覧表示用。
  usualExercises: UsualExerciseWithKcal[];
  // usualExercisesのavgDailyKcalの合計。プランタブの見出し表示用。
  avgDailyExerciseKcalTotal: number;
};

// お客様のプロフィールと測定値の最新値から、ダイエット/増量プランを算出する。
// 概要・プラン・食事記録の各ページから使う共通ロジック。
export async function getCurrentDietPlan(clientId: number): Promise<CurrentPlanResult> {
  const [client, measurements] = await Promise.all([
    getClient(clientId),
    listMeasurements(clientId),
  ]);

  const latestWeight = findLatestNonNull(measurements, "weightKg");
  const latestBmr = findLatestNonNull(measurements, "bmrKcal");

  const age = client?.birthdate ? calculateAge(client.birthdate) : null;

  const missingFields: MissingField[] = [];
  if (client?.heightCm == null || client.heightCm <= 0) {
    missingFields.push({
      label: "身長",
      hint: "「概要」タブのプロフィールで身長(cm)を入力してください。",
    });
  }
  if (!client?.gender) {
    missingFields.push({
      label: "性別",
      hint: "「概要」タブのプロフィールで性別を選択してください。",
    });
  }
  if (!client?.birthdate) {
    missingFields.push({
      label: "生年月日",
      hint: "「概要」タブのプロフィールで生年月日を入力してください。",
    });
  } else if (age === null || age <= 0) {
    missingFields.push({
      label: "生年月日",
      hint: "登録されている生年月日の形式が正しくありません。「概要」タブで登録し直してください。",
    });
  }
  if (latestWeight?.weightKg == null || latestWeight.weightKg <= 0) {
    missingFields.push({
      label: "体重の測定記録",
      hint: "「概要」タブで体重(kg)を記録してください。",
    });
  }
  if (client?.targetMonthlyWeightChangeKg === null || client?.targetMonthlyWeightChangeKg === undefined) {
    missingFields.push({
      label: "1か月あたりの目標体重変化",
      hint: "「プラン」タブで、1か月あたりの目標体重変化(kg)を入力してください。",
    });
  }

  const canBuildPlan =
    missingFields.length === 0 &&
    age !== null &&
    client?.heightCm != null &&
    client?.gender != null &&
    latestWeight?.weightKg != null &&
    client?.targetMonthlyWeightChangeKg != null;

  const usualExercises = await listUsualExercises(clientId);
  const weightForExerciseKcal =
    latestWeight?.weightKg != null ? Number(latestWeight.weightKg) : null;

  const usualExercisesWithKcal: UsualExerciseWithKcal[] = usualExercises.map(
    (habit) => {
      const kcalPerSession =
        weightForExerciseKcal != null
          ? calculateExerciseKcal({
              mets: habit.mets,
              weightKg: weightForExerciseKcal,
              durationMin: habit.durationMin,
            })
          : null;
      return {
        id: habit.id,
        exerciseName: habit.exerciseName,
        mets: habit.mets,
        durationMin: habit.durationMin,
        frequencyPerWeek: habit.frequencyPerWeek,
        kcalPerSession,
        avgDailyKcal:
          kcalPerSession != null
            ? (kcalPerSession * habit.frequencyPerWeek) / 7
            : null,
      };
    },
  );

  const avgDailyExerciseKcal = usualExercisesWithKcal.reduce(
    (sum, habit) => sum + (habit.avgDailyKcal ?? 0),
    0,
  );

  const planInputs: DietPlanInput | null = canBuildPlan
    ? {
        weightKg: Number(latestWeight!.weightKg),
        heightCm: Number(client!.heightCm),
        age: age as number,
        gender: client!.gender!,
        activityLevel: client!.activityLevel,
        monthlyWeightChangeKg: client!.targetMonthlyWeightChangeKg as number,
        bmrOverrideKcal: latestBmr?.bmrKcal ?? undefined,
      }
    : null;

  const plan = planInputs ? buildDietPlan(planInputs) : null;

  const pfcPreset = client?.pfcPreset ?? "health";
  const pfcPresetInfo = PFC_PRESETS[pfcPreset];
  const pfc = plan
    ? calculatePFCBalance({
        targetIntakeCalories: plan.targetIntakeCalories,
        proteinRatio: pfcPresetInfo.proteinRatio,
        fatRatio: pfcPresetInfo.fatRatio,
        carbRatio: pfcPresetInfo.carbRatio,
      })
    : null;

  const perMealTarget = pfc
    ? {
        proteinG: pfc.proteinG / MEALS_PER_DAY,
        fatG: pfc.fatG / MEALS_PER_DAY,
        carbG: pfc.carbG / MEALS_PER_DAY,
      }
    : null;

  // 献立例(家庭料理編)は食品マスタの特定の食品名を直接参照しているため、
  // 食品マスタ側でその食品の名前を変更・削除するとgetMealTemplates()が例外を
  // 投げる。ここで捕捉しない場合、プランタブ全体がエラー画面になってしまうため、
  // 家庭料理編の表示だけを諦めてエラー内容を画面に出せるようにする
  // (コンビニ編・外食編は分類(カテゴリ)単位で候補を取るため、この問題は起きない)。
  let mealSuggestions: DailyMealSuggestions | null = null;
  let mealSuggestionsError: string | null = null;
  if (perMealTarget) {
    try {
      const templates = (await getMealTemplates()).MEAL_TEMPLATES_BY_GOAL[pfcPreset];
      mealSuggestions = {
        breakfast: buildMealMenu(templates.breakfast, perMealTarget),
        lunch: buildMealMenu(templates.lunch, perMealTarget),
        dinner: buildMealMenu(templates.dinner, perMealTarget),
      };
    } catch (error) {
      mealSuggestionsError =
        error instanceof Error ? error.message : String(error);
    }
  }

  let mealCombos: MealCombosByEdition | null = null;
  let mealCombosError: string | null = null;
  if (perMealTarget) {
    try {
      mealCombos = await getMealCombos(perMealTarget);
    } catch (error) {
      mealCombosError = error instanceof Error ? error.message : String(error);
    }
  }

  return {
    plan,
    pfc,
    pfcPreset,
    mealSuggestions,
    mealSuggestionsError,
    mealCombos,
    mealCombosError,
    missingFields,
    latestWeightKg: latestWeight?.weightKg ?? null,
    planInputs,
    usualExercises: usualExercisesWithKcal,
    avgDailyExerciseKcalTotal: avgDailyExerciseKcal,
  };
}
