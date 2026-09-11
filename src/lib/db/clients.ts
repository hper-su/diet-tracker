import { db } from "./client";
import type { Gender } from "@/lib/health/bmr";
import {
  DEFAULT_ACTIVITY_LEVEL,
  type ActivityLevel,
} from "@/lib/health/activity-level";
import {
  DEFAULT_PFC_PRESET,
  isPFCPreset,
  type PFCPreset,
} from "@/lib/health/pfc-preset";

export type Client = {
  id: number;
  name: string;
  birthdate: string | null;
  heightCm: number | null;
  gender: Gender | null;
  activityLevel: ActivityLevel;
  pfcPreset: PFCPreset;
  targetMonthlyWeightChangeKg: number | null;
  targetWeightChangeKg: number | null;
  targetPeriodMonths: number | null;
  targetWeightKg: number | null;
  memo: string | null;
};

export async function listClients(): Promise<Client[]> {
  const rows = await db.clients.orderBy("createdAt").reverse().toArray();
  return rows.map(stripCreatedAt);
}

export async function getClient(id: number): Promise<Client | null> {
  const row = await db.clients.get(id);
  return row ? stripCreatedAt(row) : null;
}

function stripCreatedAt(row: Client & { createdAt: string }): Client {
  const { createdAt: _createdAt, ...client } = row;
  // 過去に存在した"diet"プリセット(現在は"health"に統合済み)など、現行の
  // PFCPresetに存在しない値が保存されたままの古いレコードのフォールバック。
  if (!isPFCPreset(client.pfcPreset)) {
    client.pfcPreset = DEFAULT_PFC_PRESET;
  }
  return client;
}

export type InsertClientInput = {
  name: string;
  birthdate: string | null;
  heightCm: number | null;
  gender: Gender | null;
  memo: string | null;
};

export async function insertClient(input: InsertClientInput): Promise<number> {
  const id = await db.clients.add({
    name: input.name,
    birthdate: input.birthdate,
    heightCm: input.heightCm,
    gender: input.gender,
    activityLevel: DEFAULT_ACTIVITY_LEVEL,
    pfcPreset: DEFAULT_PFC_PRESET,
    targetMonthlyWeightChangeKg: null,
    targetWeightChangeKg: null,
    targetPeriodMonths: null,
    targetWeightKg: null,
    memo: input.memo,
    createdAt: new Date().toISOString(),
  });
  return id;
}

export type UpdateClientProfileInput = {
  name: string;
  birthdate: string | null;
  heightCm: number | null;
  gender: Gender | null;
  activityLevel: ActivityLevel;
  pfcPreset: PFCPreset;
  memo: string | null;
};

export async function updateClientProfile(
  id: number,
  input: UpdateClientProfileInput,
): Promise<void> {
  await db.clients.update(id, {
    name: input.name,
    birthdate: input.birthdate,
    heightCm: input.heightCm,
    gender: input.gender,
    activityLevel: input.activityLevel,
    pfcPreset: input.pfcPreset,
    memo: input.memo,
  });
}

export async function updateClientGoal(
  id: number,
  targetMonthlyWeightChangeKg: number,
  targetWeightChangeKg: number,
  targetPeriodMonths: number,
  targetWeightKg: number | null,
): Promise<void> {
  await db.clients.update(id, {
    targetMonthlyWeightChangeKg,
    targetWeightChangeKg,
    targetPeriodMonths,
    targetWeightKg,
  });
}
