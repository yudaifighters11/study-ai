import { readFile } from "fs/promises";
import path from "path";
import { resolvePromptFileByDetail } from "@/lib/csv/categoryMasterRepository";

const PROMPTS_DIR = path.join(process.cwd(), "data", "prompts");

async function readPromptFile(fileName: string): Promise<string | null> {
  try {
    const content = await readFile(path.join(PROMPTS_DIR, fileName), "utf-8");
    return content.trim();
  } catch {
    return null;
  }
}

/**
 * 類題生成で「何を重視して作るか」の内容部分を、試験・詳細分類の組み合わせで切り替える。
 * どのプロンプトファイルを使うかは category_master.csv の prompt_file 列(試験・詳細分類ごと)で管理し、
 * 該当行が無い、またはprompt_fileが空欄の場合は data/prompts/default.txt を使う。
 * コードや分類マスタを直さず、プロンプトファイルの中身を書き換えるだけで生成内容の方向性を調整できるようにする。
 * 出力形式(JSON構造)のルールはここに含めず、呼び出し元で常に共通のものを付加すること。
 */
export async function getExamGenerationContentPrompt(
  examType: string,
  detailCategory: string | null
): Promise<string> {
  const mappedFile = await resolvePromptFileByDetail(examType, detailCategory);
  if (mappedFile) {
    const mapped = await readPromptFile(mappedFile);
    if (mapped) return mapped;
  }

  const fallback = await readPromptFile("default.txt");
  if (fallback) return fallback;

  throw new Error(
    "プロンプト設定ファイル(data/prompts/default.txt)が見つかりません。"
  );
}
