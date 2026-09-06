import type { Gender } from "@/lib/health/bmr";
import {
  DEFAULT_ACTIVITY_LEVEL,
  isActivityLevel,
  type ActivityLevel,
} from "@/lib/health/activity-level";
import {
  DEFAULT_PFC_PRESET,
  isPFCPreset,
  type PFCPreset,
} from "@/lib/health/pfc-preset";
import type { ValidationResult } from "./result";

const VALID_GENDERS: Gender[] = ["male", "female", "other"];

export type ClientInput = {
  name: string;
  birthdate: string;
  heightRaw: string;
  genderRaw: string;
  activityLevelRaw: string;
  pfcPresetRaw: string;
  memo: string;
};

export type ClientData = {
  name: string;
  birthdate: string | null;
  heightCm: number | null;
  gender: Gender | null;
  activityLevel: ActivityLevel;
  pfcPreset: PFCPreset;
  memo: string | null;
};

export function validateClientInput(
  input: ClientInput,
): ValidationResult<ClientData> {
  const name = input.name.trim();
  if (!name) {
    return { ok: false, error: "お名前を入力してください。" };
  }

  const birthdate = input.birthdate || null;

  let heightCm: number | null = null;
  if (input.heightRaw) {
    const parsedHeight = Number(input.heightRaw);
    if (!(parsedHeight > 0)) {
      return { ok: false, error: "身長は正の数で入力してください。" };
    }
    heightCm = parsedHeight;
  }

  let gender: Gender | null = null;
  if (input.genderRaw) {
    if (!VALID_GENDERS.includes(input.genderRaw as Gender)) {
      return { ok: false, error: "性別の指定が不正です。" };
    }
    gender = input.genderRaw as Gender;
  }

  let activityLevel: ActivityLevel = DEFAULT_ACTIVITY_LEVEL;
  if (input.activityLevelRaw) {
    if (!isActivityLevel(input.activityLevelRaw)) {
      return { ok: false, error: "活動レベルの指定が不正です。" };
    }
    activityLevel = input.activityLevelRaw;
  }

  let pfcPreset: PFCPreset = DEFAULT_PFC_PRESET;
  if (input.pfcPresetRaw) {
    if (!isPFCPreset(input.pfcPresetRaw)) {
      return { ok: false, error: "PFCバランスの指定が不正です。" };
    }
    pfcPreset = input.pfcPresetRaw;
  }

  return {
    ok: true,
    data: {
      name,
      birthdate,
      heightCm,
      gender,
      activityLevel,
      pfcPreset,
      memo: input.memo || null,
    },
  };
}
