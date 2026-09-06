export type MaintenanceInput = {
  bmr: number;
  // 活動係数(厚生労働省「肥満と健康」の身体活動レベルI〜IIIに基づく)。
  activityFactor: number;
};

export function calculateMaintenanceCalories({
  bmr,
  activityFactor,
}: MaintenanceInput): number {
  return bmr * activityFactor;
}

export type TargetIntakeInput = {
  maintenanceCalories: number;
  dailyCalorieAdjustment: number;
};

export function calculateTargetIntakeCalories({
  maintenanceCalories,
  dailyCalorieAdjustment,
}: TargetIntakeInput): number {
  return Math.max(maintenanceCalories + dailyCalorieAdjustment, 0);
}
