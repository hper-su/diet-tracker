import type { Client } from "./clients";
import type { Measurement } from "./measurements";
import type { Food } from "./foods";
import type { MealLog } from "./meal-logs";
import type { UsualMeal } from "./usual-meals";
import type { Exercise } from "./exercises";
import type { UsualExercise } from "./usual-exercises";
import type { ProtocolCheck } from "./protocol-checks";

export type ClientRecord = Client & { createdAt: string };
export type MeasurementRecord = Measurement & { clientId: number };
export type MealLogRecord = MealLog & { clientId: number };
export type FoodRecord = Food;
export type UsualMealRecord = UsualMeal;
export type ExerciseRecord = Exercise;
export type UsualExerciseRecord = UsualExercise;
export type ProtocolCheckRecord = ProtocolCheck & { clientId: number };
