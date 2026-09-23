import { describe, expect, it } from "vitest";
import {
  EXPORT_FORMAT_VERSION,
  ImportFormatError,
  isExportedData,
  validateAndSanitize,
  type ExportedData,
} from "./import-export";

function baseData(): ExportedData {
  return {
    version: EXPORT_FORMAT_VERSION,
    exportedAt: "2026-09-09T00:00:00.000Z",
    clients: [
      {
        id: "1",
        name: "テスト太郎",
        birthdate: null,
        heightCm: null,
        gender: null,
        activityLevel: "moderate",
        pfcPreset: "health",
        course: null,
        purpose: null,
        targetMonthlyWeightChangeKg: null,
        targetWeightChangeKg: null,
        targetPeriodMonths: null,
        targetWeightKg: null,
        targetBodyFatPct: null,
        memo: null,
        createdAt: "2026-09-01T00:00:00.000Z",
      },
    ],
    measurements: [],
    foods: [
      {
        id: "1",
        category: "主食",
        name: "白米",
        servingLabel: "1杯",
        kcal: 250,
        proteinG: 4,
        fatG: 0.5,
        carbG: 55,
      },
    ],
    mealLogs: [],
    usualMeals: [],
    protocolChecks: [
      {
        id: "1",
        clientId: "1",
        recordedAt: "2026-09-09",
        conditionId: "lumbar",
        results: [{ step: 0, achieved: true }],
        memo: null,
      },
    ],
    exercises: [
      { id: "1", name: "ラットプルダウン", aliases: ["ラット"] },
    ],
    trainingLogs: [],
  };
}

describe("isExportedData", () => {
  it("accepts a fully-formed export object", () => {
    expect(isExportedData(baseData())).toBe(true);
  });

  it("accepts an export object missing protocolChecks (pre-existing export format)", () => {
    const data = baseData() as Record<string, unknown>;
    delete data.protocolChecks;
    expect(isExportedData(data)).toBe(true);
  });

  it("rejects a mismatched version", () => {
    expect(isExportedData({ ...baseData(), version: 999 })).toBe(false);
  });

  it("rejects null and non-object values", () => {
    expect(isExportedData(null)).toBe(false);
    expect(isExportedData("a string")).toBe(false);
    expect(isExportedData(42)).toBe(false);
  });

  it("rejects an object with a required array field missing", () => {
    const data = baseData() as Record<string, unknown>;
    delete data.clients;
    expect(isExportedData(data)).toBe(false);
  });

  it("rejects protocolChecks that is present but not an array", () => {
    const data = baseData() as unknown as Record<string, unknown>;
    data.protocolChecks = "not-an-array";
    expect(isExportedData(data)).toBe(false);
  });

  it("accepts an export object missing exercises/trainingLogs (pre-existing export format)", () => {
    const data = baseData() as Record<string, unknown>;
    delete data.exercises;
    delete data.trainingLogs;
    expect(isExportedData(data)).toBe(true);
  });
});

describe("validateAndSanitize", () => {
  it("passes valid data through unchanged", () => {
    const data = baseData();
    const result = validateAndSanitize(data);
    expect(result.clients).toEqual(data.clients);
    expect(result.protocolChecks).toEqual(data.protocolChecks);
  });

  it("defaults protocolChecks to an empty array when absent", () => {
    const data = baseData() as Record<string, unknown>;
    delete data.protocolChecks;
    const result = validateAndSanitize(
      data as unknown as Parameters<typeof validateAndSanitize>[0],
    );
    expect(result.protocolChecks).toEqual([]);
  });

  it("throws when a protocol check references a non-existent client", () => {
    const data = baseData();
    data.protocolChecks[0].clientId = "999";
    expect(() => validateAndSanitize(data)).toThrow(ImportFormatError);
  });

  it("throws when a measurement references a non-existent client", () => {
    const data = baseData();
    data.measurements.push({
      id: "1",
      clientId: "999",
      recordedAt: "2026-09-09",
      weightKg: 60,
      bodyFatPct: null,
      muscleMassKg: null,
      bodyWaterPct: null,
      visceralFatLevel: null,
      bmrKcal: null,
      memo: null,
    });
    expect(() => validateAndSanitize(data)).toThrow(ImportFormatError);
  });

  it("throws when a client has an invalid id or missing name", () => {
    const data = baseData();
    data.clients[0].name = "";
    expect(() => validateAndSanitize(data)).toThrow(ImportFormatError);
  });

  it("nulls out a mealLog's foodId when the referenced food no longer exists", () => {
    const data = baseData();
    data.mealLogs.push({
      id: "1",
      clientId: "1",
      recordedAt: "2026-09-09",
      mealType: "lunch",
      foodId: "999",
      foodName: "存在しない食品",
      quantity: 1,
      kcal: 100,
      proteinG: 1,
      fatG: 1,
      carbG: 1,
      memo: null,
    });
    const result = validateAndSanitize(data);
    expect(result.mealLogs[0].foodId).toBeNull();
  });

  it("throws when a mealLog references a non-existent client", () => {
    const data = baseData();
    data.mealLogs.push({
      id: "1",
      clientId: "999",
      recordedAt: "2026-09-09",
      mealType: "lunch",
      foodId: null,
      foodName: "白米",
      quantity: 1,
      kcal: 100,
      proteinG: 1,
      fatG: 1,
      carbG: 1,
      memo: null,
    });
    expect(() => validateAndSanitize(data)).toThrow(ImportFormatError);
  });

  it("throws when a mealLog has a non-numeric nutrient value", () => {
    const data = baseData();
    data.mealLogs.push({
      id: "1",
      clientId: "1",
      recordedAt: "2026-09-09",
      mealType: "lunch",
      foodId: null,
      foodName: "白米",
      quantity: 1,
      kcal: "abc" as unknown as number,
      proteinG: 1,
      fatG: 1,
      carbG: 1,
      memo: null,
    });
    expect(() => validateAndSanitize(data)).toThrow(ImportFormatError);
  });

  it("accepts negative nutrient values on a mealLog (manual daily adjustment row)", () => {
    const data = baseData();
    data.mealLogs.push({
      id: "1",
      clientId: "1",
      recordedAt: "2026-09-09",
      mealType: "snack",
      foodId: null,
      foodName: "手入力調整",
      quantity: 1,
      kcal: -120,
      proteinG: -5,
      fatG: 0,
      carbG: -10,
      memo: null,
    });
    expect(validateAndSanitize(data).mealLogs[0].kcal).toBe(-120);
  });

  it("defaults exercises/trainingLogs to an empty array when absent", () => {
    const data = baseData() as Record<string, unknown>;
    delete data.exercises;
    delete data.trainingLogs;
    const result = validateAndSanitize(
      data as unknown as Parameters<typeof validateAndSanitize>[0],
    );
    expect(result.exercises).toEqual([]);
    expect(result.trainingLogs).toEqual([]);
  });

  it("throws when exercises has a duplicate name", () => {
    const data = baseData();
    data.exercises.push({ id: "2", name: "ラットプルダウン", aliases: [] });
    expect(() => validateAndSanitize(data)).toThrow(ImportFormatError);
  });

  it("throws when a trainingLog references a non-existent client", () => {
    const data = baseData();
    data.trainingLogs.push({
      id: "1",
      clientId: "999",
      recordedAt: "2026-09-09",
      exerciseId: "1",
      exerciseName: "ラットプルダウン",
      weight: "60",
      reps: "10",
      sets: "3",
      memo: null,
    });
    expect(() => validateAndSanitize(data)).toThrow(ImportFormatError);
  });

  it("nulls out a trainingLog's exerciseId when the referenced exercise no longer exists", () => {
    const data = baseData();
    data.trainingLogs.push({
      id: "1",
      clientId: "1",
      recordedAt: "2026-09-09",
      exerciseId: "999",
      exerciseName: "存在しない種目",
      weight: "60",
      reps: "10",
      sets: "3",
      memo: null,
    });
    const result = validateAndSanitize(data);
    expect(result.trainingLogs[0].exerciseId).toBeNull();
  });

  it("accepts a trainingLog with recordedAt null (date unknown, historical import)", () => {
    const data = baseData();
    data.trainingLogs.push({
      id: "1",
      clientId: "1",
      recordedAt: null,
      exerciseId: "1",
      exerciseName: "ラットプルダウン",
      weight: "60",
      reps: "10",
      sets: "3",
      memo: null,
    });
    expect(validateAndSanitize(data).trainingLogs[0].recordedAt).toBeNull();
  });
});
