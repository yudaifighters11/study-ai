import { synthesizeSpeech, TtsVoice } from "./synthesizeSpeech";

export interface ConversationTurn {
  speaker: string;
  text: string;
}

const FEMALE_VOICES: TtsVoice[] = ["nova", "shimmer"];
const MALE_VOICES: TtsVoice[] = ["onyx", "echo"];
const NEUTRAL_VOICES: TtsVoice[] = ["fable", "coral"];

/**
 * 会話に登場する話者ラベル(初出順)に、話者ごとに異なる声を割り当てる。
 * ラベルに"Woman"を含む場合は女性寄りの声、"Man"を含む場合は男性寄りの声を、
 * 同じ性別の話者が複数いる場合(Woman 1 / Woman 2等)は重複しないよう順に割り当てる。
 * どちらでもない場合は中立的な声を割り当てる。
 */
function assignVoices(speakers: string[]): Map<string, TtsVoice> {
  const voiceMap = new Map<string, TtsVoice>();
  let femaleIndex = 0;
  let maleIndex = 0;
  let neutralIndex = 0;

  for (const speaker of speakers) {
    const lower = speaker.toLowerCase();
    if (lower.includes("woman") || lower.includes("girl")) {
      voiceMap.set(speaker, FEMALE_VOICES[femaleIndex % FEMALE_VOICES.length]);
      femaleIndex++;
    } else if (lower.includes("man") || lower.includes("boy")) {
      voiceMap.set(speaker, MALE_VOICES[maleIndex % MALE_VOICES.length]);
      maleIndex++;
    } else {
      voiceMap.set(speaker, NEUTRAL_VOICES[neutralIndex % NEUTRAL_VOICES.length]);
      neutralIndex++;
    }
  }
  return voiceMap;
}

/**
 * TOEICリスニング Part3(会話問題)向け: 話者ごとに異なる声でTTSを呼び、
 * 発言順に音声(mp3バッファ)を単純に連結して1つの会話音声を作る。
 * 音声処理ライブラリ(ffmpeg等)は使わず、バッファの連結のみで対応する。
 */
export async function synthesizeConversation(
  turns: ConversationTurn[]
): Promise<Buffer> {
  const uniqueSpeakers = Array.from(new Set(turns.map((t) => t.speaker)));
  const voiceMap = assignVoices(uniqueSpeakers);

  const buffers: Buffer[] = [];
  for (const turn of turns) {
    const voice = voiceMap.get(turn.speaker) ?? "alloy";
    const buffer = await synthesizeSpeech(turn.text, voice);
    buffers.push(buffer);
  }
  return Buffer.concat(buffers);
}
