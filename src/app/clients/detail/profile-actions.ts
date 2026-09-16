import { updateClientProfile } from "@/lib/db/clients";
import { validateClientInput } from "@/lib/validation/client";

export type UpdateClientProfileState =
  | { error?: string; success?: boolean }
  | undefined;

export async function updateClientProfileAction(
  _prevState: UpdateClientProfileState,
  formData: FormData,
): Promise<UpdateClientProfileState> {
  const clientId = String(formData.get("client_id") ?? "");
  if (!clientId) {
    return { error: "お客様が指定されていません。" };
  }

  const result = validateClientInput({
    name: String(formData.get("name") ?? ""),
    birthdate: String(formData.get("birthdate") ?? ""),
    heightRaw: String(formData.get("height_cm") ?? ""),
    genderRaw: String(formData.get("gender") ?? ""),
    activityLevelRaw: String(formData.get("activity_level") ?? ""),
    pfcPresetRaw: String(formData.get("pfc_preset") ?? ""),
    memo: String(formData.get("memo") ?? ""),
  });

  if (!result.ok) {
    return { error: result.error };
  }

  const course = String(formData.get("course") ?? "").trim() || null;
  const purpose = String(formData.get("purpose") ?? "").trim() || null;

  await updateClientProfile(clientId, {
    ...result.data,
    course,
    purpose,
  });

  return { success: true };
}
