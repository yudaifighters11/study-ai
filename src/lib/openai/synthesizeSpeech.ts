import { getOpenAIClient, getTtsModel } from "./client";

export type TtsVoice =
  | "alloy"
  | "ash"
  | "ballad"
  | "coral"
  | "echo"
  | "fable"
  | "nova"
  | "onyx"
  | "sage"
  | "shimmer";

// TOEICのナレーションとして自然に聞こえる、中立的な声をPart2の既定値として使用する。
const DEFAULT_TTS_VOICE: TtsVoice = "alloy";

/**
 * リスニング問題のscript_text(または会話の1発言)を音声(mp3)に変換する。
 * 「何を話すか」はscript_text生成側のプロンプトで既に決まっているため、
 * ここでは文章をそのまま音声化するだけで、内容に関する指示は行わない。
 * voiceを省略した場合はPart2向けの既定の声(alloy)を使う。Part3(複数話者の会話)では
 * 話者ごとに異なるvoiceを指定して呼び出す。
 */
export async function synthesizeSpeech(
  text: string,
  voice: TtsVoice = DEFAULT_TTS_VOICE
): Promise<Buffer> {
  const client = getOpenAIClient();
  const response = await client.audio.speech.create({
    model: getTtsModel(),
    voice,
    input: text,
  });
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
