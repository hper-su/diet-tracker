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
const BIRTHDATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const BIRTHDATE_PATTERN_NO_DASH = /^\d{8}$/;

// "YYYY-MM-DD"と、区切りなしの"YYYYMMDD"の両方を受け付け、
// 保存形式(YYYY-MM-DD)に正規化する。
function normalizeBirthdate(raw: string): string | null {
  if (BIRTHDATE_PATTERN.test(raw)) return raw;
  if (BIRTHDATE_PATTERN_NO_DASH.test(raw)) {
    return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
  }
  return null;
}

// new Date("1988-02-30")は「不正な日付」としてNaNにはならず、3月1日として
// 繰り上がってしまう(JSのDateの仕様)。年月日を構成要素に戻して一致するかを
// 確かめることで、存在しない日付(2月30日、4月31日など)を確実に弾く。
function isValidCalendarDate(normalized: string): boolean {
  const [year, month, day] = normalized.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

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

  const birthdateRaw = input.birthdate.trim();
  let birthdate: string | null = null;
  if (birthdateRaw) {
    const normalized = normalizeBirthdate(birthdateRaw);
    if (!normalized) {
      return {
        ok: false,
        error:
          "生年月日はYYYY-MM-DD、または区切りなしのYYYYMMDD形式で入力してください(例: 1988-03-20 / 19880320)。",
      };
    }
    if (!isValidCalendarDate(normalized)) {
      return { ok: false, error: "生年月日が正しい日付ではありません。" };
    }
    birthdate = normalized;
  }

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
