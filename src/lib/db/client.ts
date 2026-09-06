import Dexie, { type EntityTable } from "dexie";
import type { Client } from "./clients";
import type { Measurement } from "./measurements";
import type { Food } from "./foods";
import type { MealLog } from "./meal-logs";
import type { UsualMeal } from "./usual-meals";
import type { Exercise } from "./exercises";
import type { UsualExercise } from "./usual-exercises";
import { DEFAULT_EXERCISES } from "./seed-exercises";

export type ClientRecord = Client & { createdAt: string };
export type MeasurementRecord = Measurement & { clientId: number };
export type MealLogRecord = MealLog & { clientId: number };
export type FoodRecord = Food;
export type UsualMealRecord = UsualMeal;
export type ExerciseRecord = Exercise;
export type UsualExerciseRecord = UsualExercise;

class DietTrackerDB extends Dexie {
  clients!: EntityTable<ClientRecord, "id">;
  measurements!: EntityTable<MeasurementRecord, "id">;
  foods!: EntityTable<FoodRecord, "id">;
  mealLogs!: EntityTable<MealLogRecord, "id">;
  usualMeals!: EntityTable<UsualMealRecord, "id">;
  exercises!: EntityTable<ExerciseRecord, "id">;
  usualExercises!: EntityTable<UsualExerciseRecord, "id">;

  constructor() {
    super("diet-tracker");

    this.version(1).stores({
      clients: "++id, createdAt",
      measurements: "++id, clientId, [clientId+recordedAt]",
      foods: "++id, &[category+name], category, name",
      mealLogs: "++id, clientId, [clientId+recordedAt], foodId",
      usualMeals: "++id, clientId, foodId",
      exercises: "++id, &[category+name]",
      usualExercises: "++id, clientId, exerciseId",
    });

    // populateはDBが初めて作られたとき(=このブラウザで初回起動したとき)だけ
    // 一度実行される。SQLite版のような「既存件数を数えて閾値未満なら投入する」
    // 手動ガードは不要になる。
    this.on("populate", async () => {
      await this.exercises.bulkAdd(
        DEFAULT_EXERCISES.map((exercise) => ({ ...exercise })) as ExerciseRecord[],
      );
    });
  }
}

export const db = new DietTrackerDB();
