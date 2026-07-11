/**
 * CSV上の文字列表現とドメインモデルの型(boolean/number/配列/nullable)を
 * 相互変換するための共通ヘルパー。全Repositoryで共通利用する。
 */

const LIST_SEPARATOR = ";";

export function encodeBoolean(value: boolean): string {
  return value ? "true" : "false";
}

export function decodeBoolean(value: string): boolean {
  return value.trim().toLowerCase() === "true";
}

export function encodeNullable(value: string | null): string {
  return value ?? "";
}

export function decodeNullable(value: string): string | null {
  return value.trim() === "" ? null : value;
}

export function encodeList(values: string[]): string {
  return values.join(LIST_SEPARATOR);
}

export function decodeList(value: string): string[] {
  return value.trim() === ""
    ? []
    : value
        .split(LIST_SEPARATOR)
        .map((v) => v.trim())
        .filter((v) => v.length > 0);
}

export function encodeNumber(value: number): string {
  return String(value);
}

export function decodeNumber(value: string): number {
  return Number(value);
}

export function encodeNullableNumber(value: number | null): string {
  return value === null ? "" : String(value);
}

export function decodeNullableNumber(value: string): number | null {
  return value.trim() === "" ? null : Number(value);
}
