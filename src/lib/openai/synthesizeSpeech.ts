import { getOpenAIClient, getTtsModel } from "./client";

// TOEICのナレーションとして自然に聞こえる、中立的な声を固定で使用する。
const TTS_VOICE = "alloy";

/**
 * リスニング問題のscript_textを音声(mp3)に変換する。
 * 「何を話すか」はscript_text生成側のプロンプトで既に決まっているため、
 * ここでは文章をそのまま音声化するだけで、内容に関する指示は行わない。
 */
export async function synthesizeSpeech(text: string): Promise<Buffer> {
  const client = getOpenAIClient();
  const response = await client.audio.speech.create({
    model: getTtsModel(),
    voice: TTS_VOICE,
    input: text,
  });
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
