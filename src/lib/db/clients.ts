import { supabase, unwrap, runWithColumnFallback } from "./supabase";
import { notifyChange } from "./realtime";
import type { ClientRecord } from "./client";
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
  course: string | null;
  purpose: string | null;
  targetMonthlyWeightChangeKg: number | null;
  targetWeightChangeKg: number | null;
  targetPeriodMonths: number | null;
  targetWeightKg: number | null;
  targetBodyFatPct: number | null;
  memo: string | null;
};

export async function listClients(): Promise<Client[]> {
  const rows = await unwrap<ClientRecord[]>(
    supabase.from("clients").select("*").order("createdAt", { ascending: false }),
  );
  return rows.map(stripCreatedAt);
}

export async function getClient(id: number): Promise<Client | null> {
  const row = await unwrap<ClientRecord | null>(
    supabase.from("clients").select("*").eq("id", id).maybeSingle(),
  );
  return row ? stripCreatedAt(row) : null;
}

function stripCreatedAt(row: ClientRecord): Client {
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
  const row = await unwrap<{ id: number }>(
    supabase
      .from("clients")
      .insert({
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
      })
      .select("id")
      .single(),
  );
  notifyChange(["clients"]);
  return row.id;
}

export type UpdateClientProfileInput = {
  name: string;
  birthdate: string | null;
  heightCm: number | null;
  gender: Gender | null;
  activityLevel: ActivityLevel;
  pfcPreset: PFCPreset;
  course: string | null;
  purpose: string | null;
  memo: string | null;
};

export async function updateClientProfile(
  id: number,
  input: UpdateClientProfileInput,
): Promise<{ droppedColumns: string[] }> {
  const result = await runWithColumnFallback(
    {
      name: input.name,
      birthdate: input.birthdate,
      heightCm: input.heightCm,
      gender: input.gender,
      activityLevel: input.activityLevel,
      pfcPreset: input.pfcPreset,
      course: input.course,
      purpose: input.purpose,
      memo: input.memo,
    },
    (row) => supabase.from("clients").update(row).eq("id", id),
  );
  notifyChange(["clients"]);
  return result;
}

export async function updateClientGoal(
  id: number,
  targetMonthlyWeightChangeKg: number,
  targetWeightChangeKg: number,
  targetPeriodMonths: number,
  targetWeightKg: number | null,
  targetBodyFatPct: number | null,
): Promise<{ droppedColumns: string[] }> {
  const result = await runWithColumnFallback(
    {
      targetMonthlyWeightChangeKg,
      targetWeightChangeKg,
      targetPeriodMonths,
      targetWeightKg,
      targetBodyFatPct,
    },
    (row) => supabase.from("clients").update(row).eq("id", id),
  );
  notifyChange(["clients"]);
  return result;
}
