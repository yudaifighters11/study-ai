const STORAGE_KEY = "quizSession";

// 学習メニューの分野指定機能で選んだ大中小分類・詳細分類・難易度。指定しなかった項目はnull。
export interface QuizCategoryFilter {
  majorCategory: string | null;
  middleCategory: string | null;
  minorCategory: string | null;
  detailCategory: string | null;
  // 1(基礎)〜5(難関)。複数選択可(いずれかに一致すれば出題対象)。指定しない場合はnull。
  difficulty: number[] | null;
}

export interface QuizSession {
  total: number;
  index: number; // 解答済みの問題数
  correctCount: number;
  // セッション中、常にこの分野指定を適用する(未指定の場合はnull)
  categoryFilter: QuizCategoryFilter | null;
}

export function startQuizSession(
  total: number,
  categoryFilter: QuizCategoryFilter | null = null
): QuizSession {
  const session: QuizSession = { total, index: 0, correctCount: 0, categoryFilter };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  return session;
}

export function readQuizSession(): QuizSession | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  return JSON.parse(raw) as QuizSession;
}

export function recordQuizSessionAnswer(isCorrect: boolean): QuizSession | null {
  const session = readQuizSession();
  if (!session) return null;
  const updated: QuizSession = {
    ...session,
    index: session.index + 1,
    correctCount: session.correctCount + (isCorrect ? 1 : 0),
  };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function clearQuizSession(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

const PASSAGE_GROUP_ANSWERS_KEY = "passageGroupAnswers";

/**
 * 設問グループ(1つの文書を複数の設問が共有する形式)の各設問の回答結果を、
 * セットの合計結果画面(quiz/passage-result)でまとめて表示するために一時保存する。
 * 新しいグループの1問目を開始する際にresetPassageGroupAnswersでクリアすること。
 */
export function resetPassageGroupAnswers(): void {
  sessionStorage.removeItem(PASSAGE_GROUP_ANSWERS_KEY);
}

export function appendPassageGroupAnswer<T>(entry: T): void {
  const raw = sessionStorage.getItem(PASSAGE_GROUP_ANSWERS_KEY);
  const list: T[] = raw ? JSON.parse(raw) : [];
  list.push(entry);
  sessionStorage.setItem(PASSAGE_GROUP_ANSWERS_KEY, JSON.stringify(list));
}

export function readPassageGroupAnswers<T>(): T[] {
  const raw = sessionStorage.getItem(PASSAGE_GROUP_ANSWERS_KEY);
  return raw ? (JSON.parse(raw) as T[]) : [];
}
