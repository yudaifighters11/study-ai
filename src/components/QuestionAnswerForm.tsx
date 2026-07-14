"use client";

import { useEffect, useRef, useState } from "react";
import { ChoiceKey, ConfidenceLevel } from "@/types/enums";
import { PublicQuestion } from "@/lib/questionPresenter";
import { getActiveChoiceKeys, getChoiceText } from "@/lib/questionChoices";
import { getExamTheme } from "@/components/examTheme";
import { ConfidenceSelector } from "./ConfidenceSelector";

export interface ListeningDisplaySettings {
  showQuestionText: boolean;
  showChoiceText: boolean;
  showConversationText: boolean;
}

interface QuestionAnswerFormProps {
  question: PublicQuestion;
  onSubmit: (params: {
    selectedChoice: ChoiceKey;
    confidenceLevel: ConfidenceLevel | null;
    answerTimeSeconds: number;
  }) => void | Promise<void>;
  submitting: boolean;
  submitError?: string | null;
  headerBadge?: React.ReactNode;
  // リスニング問題(exam_type === "toeic_listening")のみで使用する、問題文・問の文の表示設定。
  listeningDisplay?: ListeningDisplaySettings;
  onChangeListeningDisplay?: (
    field: keyof ListeningDisplaySettings,
    value: boolean
  ) => void;
}

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        checked ? "bg-blue-600" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function PlayIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={props.className}>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

/**
 * リスニング問題の音声再生UI(枠組みのみ)。
 * audio_urlがまだない問題(現時点ではすべて)は再生ボタンを無効化し、仮実装であることを明示する。
 * 音声合成・保存の実装後、audio_urlが入るようになれば自動的に再生できるようになる。
 */
function ListeningAudioPlayer({ audioUrl }: { audioUrl: string | null }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
      <button
        type="button"
        disabled={!audioUrl}
        onClick={() => {
          if (!audioRef.current) return;
          void audioRef.current.play();
        }}
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white transition-colors disabled:bg-gray-300"
      >
        <PlayIcon className="h-5 w-5" />
      </button>
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-gray-900">
          {playing ? "再生中..." : "音声を再生"}
        </span>
        {!audioUrl && (
          <span className="text-xs text-gray-500">
            仮実装: この問題の音声はまだ準備されていません
          </span>
        )}
      </div>
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onPlay={() => setPlaying(true)}
          onEnded={() => setPlaying(false)}
          className="hidden"
        />
      )}
    </div>
  );
}

/**
 * 過去問画面・AI類題画面で共通利用する回答フォーム。
 * セクション7-2の要素(問題文/選択肢4つ/自信度3択/回答ボタン/解答時間計測/出題年度/対応シラバス/有効性)を表示する。
 */
export function QuestionAnswerForm({
  question,
  onSubmit,
  submitting,
  submitError,
  headerBadge,
  listeningDisplay,
  onChangeListeningDisplay,
}: QuestionAnswerFormProps) {
  const [selectedChoice, setSelectedChoice] = useState<ChoiceKey | null>(null);
  const [confidenceLevel, setConfidenceLevel] = useState<ConfidenceLevel | null>(
    null
  );
  const [startedAt, setStartedAt] = useState<number>(() => Date.now());

  useEffect(() => {
    setSelectedChoice(null);
    setConfidenceLevel(null);
    setStartedAt(Date.now());
  }, [question.question_id]);

  const canSubmit = selectedChoice !== null && !submitting;
  const examTheme = getExamTheme(question.exam_type);
  const isListening = question.exam_type === "toeic_listening";
  const showQuestionText = !isListening || (listeningDisplay?.showQuestionText ?? true);
  const showChoiceText = !isListening || (listeningDisplay?.showChoiceText ?? true);
  // 会話文(Part3等)は、複数設問が音声を共有する場合(passage_group_id あり)のみ切り替え対象にする。
  const hasConversation = isListening && question.passage_group_id !== null;
  const showConversationText = listeningDisplay?.showConversationText ?? false;

  const handleSubmit = () => {
    if (!selectedChoice) return;
    const answerTimeSeconds = Math.round((Date.now() - startedAt) / 1000);
    void onSubmit({ selectedChoice, confidenceLevel, answerTimeSeconds });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
        <span className="rounded bg-gray-200 px-2 py-1">
          出題年度: {question.source_year}
        </span>
        {question.syllabus_version !== "N/A" && (
          <span className="rounded bg-gray-200 px-2 py-1">
            対応シラバス: {question.syllabus_version}
          </span>
        )}
        <span className="rounded bg-gray-200 px-2 py-1">
          {question.is_current && question.is_current_exam_scope
            ? "現在も出題対象の問題です"
            : "現在は出題対象外の問題です"}
        </span>
        {question.passage_order && question.passage_total_questions && (
          <span className="rounded bg-indigo-100 px-2 py-1 text-indigo-700">
            設問 {question.passage_order}/{question.passage_total_questions}
          </span>
        )}
        {headerBadge}
      </div>

      <span
        className={`inline-block w-fit rounded-full px-3 py-1 text-xs font-semibold ${examTheme.badgeBg}`}
      >
        {question.middle_category}
      </span>

      {question.passage_text && (
        <div className="whitespace-pre-wrap rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm leading-relaxed text-gray-800">
          {question.passage_text}
        </div>
      )}

      {isListening && <ListeningAudioPlayer audioUrl={question.audio_url} />}

      {isListening && onChangeListeningDisplay && (
        <div className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-700">問題文を表示</span>
            <ToggleSwitch
              checked={showQuestionText}
              onChange={() =>
                onChangeListeningDisplay("showQuestionText", !showQuestionText)
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-700">問の文(選択肢の文)を表示</span>
            <ToggleSwitch
              checked={showChoiceText}
              onChange={() =>
                onChangeListeningDisplay("showChoiceText", !showChoiceText)
              }
            />
          </div>
          {hasConversation && (
            <div className="flex items-center justify-between">
              <span className="text-gray-700">会話文を表示</span>
              <ToggleSwitch
                checked={showConversationText}
                onChange={() =>
                  onChangeListeningDisplay(
                    "showConversationText",
                    !showConversationText
                  )
                }
              />
            </div>
          )}
        </div>
      )}

      {hasConversation && showConversationText && question.script_text && (
        <div className="whitespace-pre-wrap rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm leading-relaxed text-gray-800">
          {question.script_text}
        </div>
      )}

      {showQuestionText && (
        <p className="whitespace-pre-wrap text-base font-medium leading-relaxed text-gray-900">
          {question.question_text}
        </p>
      )}

      <div className="flex flex-col gap-2.5">
        {getActiveChoiceKeys(question).map((key, i) => (
          <button
            key={key}
            type="button"
            onClick={() => setSelectedChoice(key)}
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
              selectedChoice === key
                ? "border-blue-600 bg-blue-50"
                : "border-gray-200 bg-white"
            }`}
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                selectedChoice === key ? "border-blue-600" : "border-gray-300"
              }`}
            >
              {selectedChoice === key && (
                <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
              )}
            </span>
            <span className="text-gray-900">
              {i + 1}
              {showChoiceText ? `. ${getChoiceText(question, key)}` : ""}
            </span>
          </button>
        ))}
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold text-gray-500">自信度(任意)</p>
        <ConfidenceSelector value={confidenceLevel} onChange={setConfidenceLevel} />
      </div>

      {submitError && (
        <p className="text-sm text-red-600">{submitError}</p>
      )}

      <button
        type="button"
        disabled={!canSubmit}
        onClick={handleSubmit}
        className="rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {submitting ? "採点中..." : "回答する"}
      </button>
    </div>
  );
}
