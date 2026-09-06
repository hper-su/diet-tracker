export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

// 各バリデーションで繰り返し出てくる「文字列を正の数として解釈し、
// だめならエラーを返す」処理の共通化。
export function parsePositiveNumber(
  raw: string,
  errorMessage: string,
): ValidationResult<number> {
  const value = Number(raw);
  if (!(value > 0)) {
    return { ok: false, error: errorMessage };
  }
  return { ok: true, data: value };
}
