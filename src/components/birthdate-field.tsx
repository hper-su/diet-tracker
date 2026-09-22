// 生年月日入力欄。"YYYY-MM-DD" と、区切りなしの "YYYYMMDD" の両方を受け付ける。
// サーバー側のフォーマット検証(src/lib/validation/client.ts)と条件を合わせておくこと。
export const BIRTHDATE_PATTERN = "\\d{4}-\\d{2}-\\d{2}|\\d{8}";
const BIRTHDATE_PLACEHOLDER = "例: 19880320";
const BIRTHDATE_TITLE =
  "YYYY-MM-DD、または区切りなしのYYYYMMDD形式で入力してください(例: 1988-03-20 / 19880320)";

export function BirthdateField({
  defaultValue,
  optional,
}: {
  defaultValue?: string;
  optional?: boolean;
}) {
  return (
    <label className="block min-w-0 text-sm">
      <span className="mb-1 block truncate text-xs text-gray-500">
        生年月日{optional ? "(任意)" : ""}
      </span>
      <input
        name="birthdate"
        type="text"
        inputMode="numeric"
        placeholder={BIRTHDATE_PLACEHOLDER}
        pattern={BIRTHDATE_PATTERN}
        title={BIRTHDATE_TITLE}
        defaultValue={defaultValue}
        className="block w-full min-w-0 rounded border border-gray-300 px-3 py-2 text-sm"
      />
    </label>
  );
}
