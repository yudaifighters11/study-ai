import { readFile, writeFile } from "fs/promises";
import path from "path";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";

/**
 * CSVファイルへの物理的な読み書きのみを担当する最下層モジュール。
 * 将来Supabaseへ移行する際は、このファイルとRepository層の実装のみを差し替え、
 * 上位(画面・API route・OpenAI呼び出し処理)には影響を与えない構成とする。
 */

const DATA_DIR = path.join(process.cwd(), "data");

export type CsvRow = Record<string, string>;

function resolveDataPath(fileName: string): string {
  return path.join(DATA_DIR, fileName);
}

export async function readCsvFile(fileName: string): Promise<CsvRow[]> {
  const filePath = resolveDataPath(fileName);
  const content = await readFile(filePath, "utf-8");
  if (content.trim().length === 0) {
    return [];
  }
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
  }) as CsvRow[];
}

export async function writeCsvFile(
  fileName: string,
  headers: string[],
  rows: CsvRow[]
): Promise<void> {
  const filePath = resolveDataPath(fileName);
  const csvText = stringify(rows, {
    header: true,
    columns: headers,
    quoted: true,
  });
  await writeFile(filePath, csvText, "utf-8");
}

export async function appendCsvRow(
  fileName: string,
  headers: string[],
  row: CsvRow
): Promise<void> {
  const rows = await readCsvFile(fileName);
  rows.push(row);
  await writeCsvFile(fileName, headers, rows);
}
