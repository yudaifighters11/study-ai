import OpenAI from "openai";

let cachedClient: OpenAI | null = null;

/**
 * OpenAIクライアントの初期化。APIキーはコードへ直接記載せず、必ず環境変数から取得する。
 */
export function getOpenAIClient(): OpenAI {
  if (!cachedClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "OPENAI_API_KEY が設定されていません。.env.local を確認してください。"
      );
    }
    cachedClient = new OpenAI({ apiKey });
  }
  return cachedClient;
}

/**
 * ミス分析・類題生成に使用するモデル名。
 * モデルIDはコードへ直接記載せず、環境変数(OPENAI_GENERATION_MODEL)で管理する。
 */
export function getGenerationModel(): string {
  const model = process.env.OPENAI_GENERATION_MODEL;
  if (!model) {
    throw new Error(
      "OPENAI_GENERATION_MODEL が設定されていません。.env.local を確認してください。"
    );
  }
  return model;
}

/**
 * 生成問題の品質チェックに使用するモデル名(生成用と別モデルを想定)。
 * モデルIDはコードへ直接記載せず、環境変数(OPENAI_VALIDATION_MODEL)で管理する。
 */
export function getValidationModel(): string {
  const model = process.env.OPENAI_VALIDATION_MODEL;
  if (!model) {
    throw new Error(
      "OPENAI_VALIDATION_MODEL が設定されていません。.env.local を確認してください。"
    );
  }
  return model;
}

/**
 * リスニング問題の音声合成(TTS)に使用するモデル名。
 * モデルIDはコードへ直接記載せず、環境変数(OPENAI_TTS_MODEL)で管理する。
 */
export function getTtsModel(): string {
  const model = process.env.OPENAI_TTS_MODEL;
  if (!model) {
    throw new Error(
      "OPENAI_TTS_MODEL が設定されていません。.env.local を確認してください。"
    );
  }
  return model;
}
