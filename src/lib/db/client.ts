import Dexie, { type EntityTable } from "dexie";
import type { Client } from "./clients";
import type { Measurement } from "./measurements";
import type { Food } from "./foods";
import type { MealLog } from "./meal-logs";
import type { UsualMeal } from "./usual-meals";
import type { Exercise } from "./exercises";
import type { UsualExercise } from "./usual-exercises";
import type { ProtocolCheck } from "./protocol-checks";
import { DEFAULT_EXERCISES } from "./seed-exercises";
import { DEFAULT_PFC_PRESET, isPFCPreset } from "@/lib/health/pfc-preset";

export type ClientRecord = Client & { createdAt: string };
export type MeasurementRecord = Measurement & { clientId: number };
export type MealLogRecord = MealLog & { clientId: number };
export type FoodRecord = Food;
export type UsualMealRecord = UsualMeal;
export type ExerciseRecord = Exercise;
export type UsualExerciseRecord = UsualExercise;
export type ProtocolCheckRecord = ProtocolCheck & { clientId: number };

class DietTrackerDB extends Dexie {
  clients!: EntityTable<ClientRecord, "id">;
  measurements!: EntityTable<MeasurementRecord, "id">;
  foods!: EntityTable<FoodRecord, "id">;
  mealLogs!: EntityTable<MealLogRecord, "id">;
  usualMeals!: EntityTable<UsualMealRecord, "id">;
  exercises!: EntityTable<ExerciseRecord, "id">;
  usualExercises!: EntityTable<UsualExerciseRecord, "id">;
  protocolChecks!: EntityTable<ProtocolCheckRecord, "id">;

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

    this.version(2).stores({
      protocolChecks: "++id, clientId, [clientId+recordedAt]",
    });

    // 過去に存在した"diet"プリセット(現在は"health"に統合済み)がDB上に
    // 残っている端末向けの一度きりの移行。以後はstripCreatedAt側の
    // フォールバックに頼らず、保存データ自体が正しい値になる。
    this.version(3)
      .stores({})
      .upgrade(async (tx) => {
        await tx
          .table<ClientRecord, number>("clients")
          .toCollection()
          .modify((client) => {
            if (!isPFCPreset(client.pfcPreset)) {
              client.pfcPreset = DEFAULT_PFC_PRESET;
            }
          });
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
