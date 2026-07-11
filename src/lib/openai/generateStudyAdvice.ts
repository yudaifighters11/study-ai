import { callOpenAIJson } from "./callOpenAIJson";
import { getGenerationModel } from "./client";
import { STUDY_ADVICE_JSON_SCHEMA } from "./jsonSchemas";
import { StudyAdviceResponse, StudyAdviceResponseSchema } from "@/types/openai";
import { WeakPointStats } from "@/lib/analysis/computeWeakPointStats";
import { MISTAKE_TYPE_LABELS } from "@/types/enums";

function buildSystemPrompt(examLabel: string): string {
  return `あなたは${examLabel}の学習アドバイザーAIです。
ユーザーの正答率・ミス傾向の集計結果を基に、次に何を学習すべきかの具体的なアドバイスを日本語で書いてください。
断定的すぎる表現は避け、データからうかがえる傾向として述べてください。
サンプル数が少ない場合は、断定を避け「まだ判断材料が少ない」旨を含めてください。
出力は2〜4文程度の簡潔な文章にしてください。`;
}

/**
 * 7-5 弱点分析画面: 集計結果を基にしたAIからの学習アドバイス。
 */
export async function generateStudyAdvice(
  stats: WeakPointStats,
  examLabel: string
): Promise<StudyAdviceResponse> {
  const userPrompt = JSON.stringify({
    total_answers: stats.totalAnswers,
    overall_accuracy_rate: stats.overallAccuracyRate,
    category_accuracy: stats.categoryAccuracy,
    weakest_minor_categories: stats.minorCategoryAccuracy.slice(0, 5),
    mistake_type_frequency: stats.mistakeTypeFrequency.map((m) => ({
      mistake_type: m.mistakeType,
      label: MISTAKE_TYPE_LABELS[m.mistakeType],
      count: m.count,
    })),
    confident_but_wrong_count: stats.confidentButWrong.length,
    outdated_knowledge_mistake_count: stats.outdatedKnowledgeMistakeCount,
  });

  const raw = await callOpenAIJson({
    model: getGenerationModel(),
    systemPrompt: buildSystemPrompt(examLabel),
    userPrompt,
    jsonSchema: STUDY_ADVICE_JSON_SCHEMA,
  });

  return StudyAdviceResponseSchema.parse(raw);
}
