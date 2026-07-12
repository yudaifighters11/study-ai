/**
 * data/配下の既存CSVを、Supabase(Postgres)へ一括移行する一回限りのスクリプト。
 * 実行方法: npx tsx scripts/migrateToSupabase.ts
 *
 * 依存関係の順序(参照先を先に挿入)でテーブルへ書き込む。
 * 既にSupabase側にデータがある場合の重複防止のため、各テーブルとも
 * 挿入前に既存件数を確認し、0件のときだけ挿入する(誤って二重登録しない)。
 */
import { readFileSync } from "fs";
import path from "path";

// tsxで直接実行する場合、Next.jsの.env.local自動読み込みは効かないため、ここで読み込む。
function loadEnvLocal(): void {
  const envPath = path.join(process.cwd(), ".env.local");
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}
loadEnvLocal();
async function main() {
  const { getSupabaseClient } = await import("../src/lib/supabase/supabaseClient");
  const { readCsvFile } = await import("../src/lib/csv/csvClient");
  const { getAllExams } = await import("../src/lib/csv/examRepository");
  const { getAllSyllabusVersions } = await import("../src/lib/csv/syllabusRepository");
  const { getAllSyllabusChanges } = await import("../src/lib/csv/syllabusChangeRepository");
  const { getAllCategoryMasters } = await import("../src/lib/csv/categoryMasterRepository");
  const { getAllQuestions } = await import("../src/lib/csv/questionRepository");
  const { UserSchema } = await import("../src/types/user");
  const { QuestionReportSchema } = await import("../src/types/questionReport");
  const { decodeNullable } = await import("../src/lib/csv/codecs");

  const supabase = getSupabaseClient();

  async function insertTable<T extends Record<string, unknown>>(
    table: string,
    rows: T[],
    batchSize = 500
  ) {
    const { count, error: countError } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true });
    if (countError) throw new Error(`${table}件数確認に失敗: ${countError.message}`);
    if ((count ?? 0) > 0) {
      console.log(`skip ${table}: 既に${count}件あるため移行済みとみなします`);
      return;
    }

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      if (batch.length === 0) continue;
      const { error } = await supabase.from(table).insert(batch as never[]);
      if (error) {
        throw new Error(`${table}への挿入に失敗(${i}件目〜): ${error.message}`);
      }
    }
    console.log(`inserted ${table}: ${rows.length}件`);
  }

  // 1. exams
  const exams = await getAllExams();
  await insertTable("exams", exams);

  // 2. users(getAllが無いため直接CSVを読む。1件のみの想定)
  const userRows = await readCsvFile("users.csv");
  const users = userRows.map((row) =>
    UserSchema.parse({
      user_id: row.user_id,
      display_name: row.display_name,
      email: decodeNullable(row.email),
      age_group: null,
      occupation: null,
      terms_agreed_at: null,
      created_at: row.created_at,
    })
  );
  await insertTable("users", users);

  // 3. user_exams
  const userExamRows = await readCsvFile("user_exams.csv");
  const userExams = userExamRows.map((row) => ({
    user_id: row.user_id,
    exam_id: row.exam_id,
    is_current: row.is_current.trim().toLowerCase() === "true",
    planned_exam_date: decodeNullable(row.planned_exam_date),
    target_syllabus_version: decodeNullable(row.target_syllabus_version),
    target_score: null,
    registered_at: row.registered_at,
    last_studied_at: decodeNullable(row.last_studied_at),
  }));
  await insertTable("user_exams", userExams);

  // 4. syllabus_versions
  const syllabusVersions = await getAllSyllabusVersions();
  await insertTable("syllabus_versions", syllabusVersions);

  // 5. syllabus_changes
  const syllabusChanges = await getAllSyllabusChanges();
  await insertTable("syllabus_changes", syllabusChanges);

  // 6. category_master
  const categoryMasters = await getAllCategoryMasters();
  await insertTable("category_master", categoryMasters);

  // 7. questions(件数が多いためバッチ挿入)
  const questions = await getAllQuestions();
  await insertTable("questions", questions, 500);

  // 8. answer_history
  const answerHistoryRows = await readCsvFile("answer_history.csv");
  const answerHistory = answerHistoryRows.map((row) => ({
    answer_id: row.answer_id,
    user_id: row.user_id,
    question_id: row.question_id,
    selected_choice: row.selected_choice,
    evaluated_correct_choice: row.evaluated_correct_choice,
    is_correct: row.is_correct.trim().toLowerCase() === "true",
    answer_time_seconds: Number(row.answer_time_seconds),
    confidence_level: decodeNullable(row.confidence_level),
    self_reported_mistake_reason: row.self_reported_mistake_reason,
    syllabus_version: row.syllabus_version,
    evaluation_date: row.evaluation_date,
    answered_at: row.answered_at,
  }));
  await insertTable("answer_history", answerHistory);

  // 9. mistake_analyses
  const mistakeAnalysisRows = await readCsvFile("mistake_analyses.csv");
  const { decodeList } = await import("../src/lib/csv/codecs");
  const mistakeAnalyses = mistakeAnalysisRows.map((row) => ({
    analysis_id: row.analysis_id,
    user_id: row.user_id,
    answer_id: row.answer_id,
    question_id: row.question_id,
    mistake_type: row.mistake_type,
    confused_concepts: decodeList(row.confused_concepts),
    analysis_comment: row.analysis_comment,
    recommended_training: row.recommended_training,
    confidence_score: Number(row.confidence_score),
    outdated_knowledge_influence: row.outdated_knowledge_influence.trim().toLowerCase() === "true",
    syllabus_version: row.syllabus_version,
    created_at: row.created_at,
  }));
  await insertTable("mistake_analyses", mistakeAnalyses);

  // 10. question_reports
  const reportRows = await readCsvFile("question_reports.csv");
  const reports = reportRows.map((row) =>
    QuestionReportSchema.parse({
      report_id: row.report_id,
      user_id: row.user_id,
      question_id: row.question_id,
      reason: row.reason,
      comment: row.comment,
      created_at: row.created_at,
    })
  );
  await insertTable("question_reports", reports);

  console.log("done: すべてのテーブルの移行処理が完了しました");
}

main().catch((err) => {
  console.error("移行に失敗しました:", err);
  process.exit(1);
});
