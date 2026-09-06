import { calculateBMR, type Gender } from "./bmr";
import {
  calculateMaintenanceCalories,
  calculateTargetIntakeCalories,
} from "./maintenance";
import {
  ACTIVITY_LEVELS,
  getActivityFactor,
  type ActivityLevel,
} from "./activity-level";
import {
  calculateDailyCalorieAdjustment,
  KCAL_PER_KG_BODY_WEIGHT,
} from "./calorie-adjustment";

export type DietPlanInput = {
  weightKg: number;
  heightCm: number;
  age: number;
  gender: Gender;
  activityLevel: ActivityLevel;
  monthlyWeightChangeKg: number;
  // 体組成計等で実測したBMR(kcal/日)。指定すると、身長・体重・年齢・性別から
  // Mifflin-St Jeor式で推定する代わりにこの実測値を優先して使用する。
  bmrOverrideKcal?: number;
};

export type DietPlan = {
  bmr: number;
  bmrIsEstimated: boolean;
  maintenanceCalories: number;
  targetIntakeCalories: number;
  notes: string[];
};

const ESTIMATE_NOTE =
  "この基礎代謝量はMifflin-St Jeor式による推定値です。体組成計等で実測したBMRを記録すると、そちらが優先して使われます。";

const MEASURED_BMR_NOTE =
  "この基礎代謝量は、記録された体組成計等の実測値を使用しています。";

const OTHER_GENDER_NOTE =
  "性別が「その他」のため、男性・女性の計算式の平均値を用いた概算になります。";

function buildGoalNote(monthlyWeightChangeKg: number): string {
  if (monthlyWeightChangeKg > 0) {
    return `月あたり約${monthlyWeightChangeKg}kgの増量ペースを目安に算出しています。`;
  }
  if (monthlyWeightChangeKg < 0) {
    return `月あたり約${Math.abs(monthlyWeightChangeKg)}kgの減量ペースを目安に算出しています。`;
  }
  return "体重維持(現状キープ)を目安に算出しています。";
}

export function buildDietPlan(input: DietPlanInput): DietPlan | null {
  let bmr: number;
  let bmrIsEstimated: boolean;

  if (input.bmrOverrideKcal !== undefined) {
    if (!(input.bmrOverrideKcal > 0)) {
      return null;
    }
    bmr = input.bmrOverrideKcal;
    bmrIsEstimated = false;
  } else {
    const calculatedBmr = calculateBMR({
      weightKg: input.weightKg,
      heightCm: input.heightCm,
      age: input.age,
      gender: input.gender,
    });

    if (calculatedBmr === null) {
      return null;
    }

    bmr = calculatedBmr;
    bmrIsEstimated = true;
  }

  const maintenanceCalories = calculateMaintenanceCalories({
    bmr,
    activityFactor: getActivityFactor(input.activityLevel),
  });

  const dailyCalorieAdjustment = calculateDailyCalorieAdjustment(
    input.monthlyWeightChangeKg,
  );

  const targetIntakeCalories = calculateTargetIntakeCalories({
    maintenanceCalories,
    dailyCalorieAdjustment,
  });

  const notes = [
    buildGoalNote(input.monthlyWeightChangeKg),
    bmrIsEstimated ? ESTIMATE_NOTE : MEASURED_BMR_NOTE,
  ];
  if (bmrIsEstimated && input.gender === "other") {
    notes.push(OTHER_GENDER_NOTE);
  }

  return { bmr, bmrIsEstimated, maintenanceCalories, targetIntakeCalories, notes };
}

export type DietPlanFormulas = {
  bmr: string;
  maintenanceCalories: string;
  targetIntakeCalories: string;
};

function fmt(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

// 画面に「どう計算されたか」を示すための、実際の数値を当てはめた計算式の文字列を組み立てる。
export function buildDietPlanFormulas(
  input: DietPlanInput,
  plan: DietPlan,
): DietPlanFormulas {
  const bmrText = plan.bmrIsEstimated
    ? (() => {
        const base = `10 × ${fmt(input.weightKg)}kg + 6.25 × ${fmt(input.heightCm)}cm − 5 × ${fmt(input.age)}歳`;
        if (input.gender === "male") {
          return `${base} + 5 = ${plan.bmr.toFixed(0)}kcal`;
        }
        if (input.gender === "female") {
          return `${base} − 161 = ${plan.bmr.toFixed(0)}kcal`;
        }
        return `${base} − 78(男性式+5と女性式−161の平均) = ${plan.bmr.toFixed(0)}kcal`;
      })()
    : `体組成計等の実測値をそのまま使用 = ${plan.bmr.toFixed(0)}kcal`;

  const activityLevelInfo = ACTIVITY_LEVELS[input.activityLevel];
  const maintenanceText = `${plan.bmr.toFixed(0)}kcal × ${activityLevelInfo.factor}(活動係数・${activityLevelInfo.label}) = ${plan.maintenanceCalories.toFixed(0)}kcal`;

  const dailyCalorieAdjustment = calculateDailyCalorieAdjustment(
    input.monthlyWeightChangeKg,
  );
  const sign = dailyCalorieAdjustment >= 0 ? "+" : "−";
  const targetIntakeText = `${plan.maintenanceCalories.toFixed(0)}kcal ${sign} ${Math.abs(dailyCalorieAdjustment).toFixed(0)}kcal(${fmt(input.monthlyWeightChangeKg)}kg × ${KCAL_PER_KG_BODY_WEIGHT}kcal ÷ 30日) = ${plan.targetIntakeCalories.toFixed(0)}kcal`;

  return {
    bmr: bmrText,
    maintenanceCalories: maintenanceText,
    targetIntakeCalories: targetIntakeText,
  };
}
