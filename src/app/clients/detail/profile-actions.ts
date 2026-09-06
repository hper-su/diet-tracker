import { updateClientProfile } from "@/lib/db/clients";
import { validateClientInput } from "@/lib/validation/client";

export type UpdateClientProfileState = { error?: string; success?: boolean } | undefined;

export async function updateClientProfileAction(
  _prevState: UpdateClientProfileState,
  formData: FormData,
): Promise<UpdateClientProfileState> {
  const clientId = Number(formData.get("client_id"));
  if (!Number.isInteger(clientId) || clientId <= 0) {
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

  await updateClientProfile(clientId, result.data);

  return { success: true };
}
