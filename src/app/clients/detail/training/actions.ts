import { getExercise } from "@/lib/db/exercises";
import {
  insertTrainingLogs,
  updateTrainingLog,
  deleteTrainingLog,
  listTrainingLogsByDate,
  setDailyMemo,
  type InsertTrainingLogInput,
} from "@/lib/db/training-logs";
import { validateTrainingLogInput, type TrainingLogData } from "@/lib/validation/training-log";

type AddTrainingLogState = { error?: string } | undefined;

// 1回の送信で複数の種目(exercise_id[]・weight[]・reps[]・sets[]・memo[])を
// まとめて登録できるようにする(食事記録フォームと同様の複数行送信)。
// 未入力の行(種目が選ばれていない行)は無視し、1件も選ばれていなければエラーにする。
export async function addTrainingLogAction(
  _prevState: AddTrainingLogState,
  formData: FormData,
): Promise<AddTrainingLogState> {
  const clientId = String(formData.get("client_id") ?? "");
  if (!clientId) {
    return { error: "お客様が指定されていません。" };
  }
  const recordedAt = String(formData.get("recorded_at") ?? "");

  const exerciseIds = formData.getAll("exercise_id").map(String);
  const weights = formData.getAll("weight").map(String);
  const reps = formData.getAll("reps").map(String);
  const sets = formData.getAll("sets").map(String);
  const memos = formData.getAll("memo").map(String);

  const entries = exerciseIds
    .map((exerciseIdRaw, i) => ({
      rowNumber: i + 1, // フォーム上の行番号(未選択の行も数える)。入力エラーの案内に使う
      exerciseIdRaw,
      weight: weights[i] ?? "",
      reps: reps[i] ?? "",
      sets: sets[i] ?? "",
      memo: memos[i] ?? "",
    }))
    .filter((entry) => entry.exerciseIdRaw);

  if (entries.length === 0) {
    return { error: "種目を1件以上選択してください。" };
  }

  const validated: TrainingLogData[] = [];
  for (const { rowNumber, ...entry } of entries) {
    const result = validateTrainingLogInput({ recordedAt, ...entry });
    if (!result.ok) {
      // 複数行を同時に登録するため、どの行のエラーか分かるようにする。
      return { error: exerciseIds.length > 1 ? `${rowNumber}行目: ${result.error}` : result.error };
    }
    validated.push(result.data);
  }

  const exercises = await Promise.all(validated.map((entry) => getExercise(entry.exerciseId)));

  const toInsert: InsertTrainingLogInput[] = [];
  for (let i = 0; i < validated.length; i++) {
    const entry = validated[i];
    const exercise = exercises[i];
    if (!exercise) {
      return { error: "指定された種目が見つかりません。" };
    }

    toInsert.push({
      clientId,
      recordedAt: entry.recordedAt,
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      weight: entry.weight,
      reps: entry.reps,
      sets: entry.sets,
      memo: entry.memo,
    });
  }

  await insertTrainingLogs(toInsert);
}

type UpdateTrainingLogState = { error?: string } | undefined;

export async function updateTrainingLogAction(
  _prevState: UpdateTrainingLogState,
  formData: FormData,
): Promise<UpdateTrainingLogState> {
  const id = String(formData.get("id") ?? "");
  const clientId = String(formData.get("client_id") ?? "");
  if (!id || !clientId) {
    return { error: "記録が指定されていません。" };
  }

  const result = validateTrainingLogInput({
    recordedAt: String(formData.get("recorded_at") ?? ""),
    exerciseIdRaw: String(formData.get("exercise_id") ?? ""),
    weight: String(formData.get("weight") ?? ""),
    reps: String(formData.get("reps") ?? ""),
    sets: String(formData.get("sets") ?? ""),
    memo: String(formData.get("memo") ?? ""),
  });

  if (!result.ok) {
    return { error: result.error };
  }

  const exercise = await getExercise(result.data.exerciseId);
  if (!exercise) {
    return { error: "指定された種目が見つかりません。" };
  }

  await updateTrainingLog(clientId, id, {
    recordedAt: result.data.recordedAt,
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    weight: result.data.weight,
    reps: result.data.reps,
    sets: result.data.sets,
    memo: result.data.memo,
  });
}

export async function deleteTrainingLogAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const clientId = String(formData.get("client_id") ?? "");
  if (id && clientId) {
    await deleteTrainingLog(clientId, id);
  }
}

export type DailyMemoState = { error?: string } | undefined;

// その日全体の総括メモを保存する(種目とは別に1日1件だけ持つ)。
export async function setDailyMemoAction(
  _prevState: DailyMemoState,
  formData: FormData,
): Promise<DailyMemoState> {
  const clientId = String(formData.get("client_id") ?? "");
  const recordedAt = String(formData.get("recorded_at") ?? "");
  if (!clientId || !recordedAt) {
    return { error: "お客様または日付が指定されていません。" };
  }

  const logs = await listTrainingLogsByDate(clientId, recordedAt);
  await setDailyMemo(clientId, recordedAt, logs, String(formData.get("memo") ?? ""));
}
