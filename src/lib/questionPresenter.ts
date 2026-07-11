import { Question } from "@/types/question";

/**
 * 回答前にクライアントへ渡してよい問題情報のみを抽出する。
 * 正解・解説・変更理由は採点前に漏洩させないよう、ここで確実に除外する。
 */
export type PublicQuestion = Omit<
  Question,
  | "original_correct_choice"
  | "current_correct_choice"
  | "original_explanation"
  | "current_explanation"
  | "choice_a_explanation"
  | "choice_b_explanation"
  | "choice_c_explanation"
  | "choice_d_explanation"
  | "choice_e_explanation"
  | "choice_f_explanation"
  | "choice_g_explanation"
  | "choice_h_explanation"
  | "revision_note"
>;

export function toPublicQuestion(question: Question): PublicQuestion {
  const {
    original_correct_choice: _original_correct_choice,
    current_correct_choice: _current_correct_choice,
    original_explanation: _original_explanation,
    current_explanation: _current_explanation,
    choice_a_explanation: _choice_a_explanation,
    choice_b_explanation: _choice_b_explanation,
    choice_c_explanation: _choice_c_explanation,
    choice_d_explanation: _choice_d_explanation,
    choice_e_explanation: _choice_e_explanation,
    choice_f_explanation: _choice_f_explanation,
    choice_g_explanation: _choice_g_explanation,
    choice_h_explanation: _choice_h_explanation,
    revision_note: _revision_note,
    ...publicFields
  } = question;
  return publicFields;
}
