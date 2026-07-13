import { getSupabaseClient } from "@/lib/supabase/supabaseClient";

const BUCKET = "listening-audio";

/**
 * リスニング問題の音声ファイル(mp3)をSupabase Storageへアップロードし、公開URLを返す。
 * バケットは事前に作成済み(公開バケット)。question_idごとに1ファイルとし、
 * 再生成時は同じquestion_idのファイルを上書きする。
 */
export async function uploadListeningAudio(
  questionId: string,
  audioBuffer: Buffer
): Promise<string> {
  const supabase = getSupabaseClient();
  const path = `part2/${questionId}.mp3`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, audioBuffer, {
    contentType: "audio/mpeg",
    upsert: true,
  });
  if (error) {
    throw new Error(`uploadListeningAudio failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
