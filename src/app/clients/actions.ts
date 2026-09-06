import { insertClient } from "@/lib/db/clients";
import { validateClientInput } from "@/lib/validation/client";

export type AddClientState = { error?: string } | undefined;

export async function addClientAction(
  _prevState: AddClientState,
  formData: FormData,
): Promise<AddClientState> {
  const result = validateClientInput({
    name: String(formData.get("name") ?? ""),
    birthdate: String(formData.get("birthdate") ?? ""),
    heightRaw: String(formData.get("height_cm") ?? ""),
    genderRaw: String(formData.get("gender") ?? ""),
    activityLevelRaw: "",
    pfcPresetRaw: "",
    memo: String(formData.get("memo") ?? ""),
  });

  if (!result.ok) {
    return { error: result.error };
  }

  await insertClient(result.data);
}
