import { getOpenAIClient } from "./client";

export interface JsonSchemaSpec {
  name: string;
  strict: boolean;
  schema: Record<string, unknown>;
}

/**
 * OpenAI Chat Completions APIをJSON応答モードで呼び出す共通ヘルパー。
 * jsonSchemaを指定した場合はStructured Outputs(strict mode)で出力形式をAPI側に強制させる。
 * これにより、プロンプトの指示だけでは起きがちな型のずれ(配列/文字列/真偽値の取り違え等)を防ぐ。
 * それでもレスポンスは信頼できない外部入力として扱い、呼び出し元でzodスキーマによる検証も行うこと。
 */
export async function callOpenAIJson(params: {
  model: string;
  systemPrompt: string;
  userPrompt: string;
  jsonSchema: JsonSchemaSpec;
}): Promise<unknown> {
  const client = getOpenAIClient();
  const response = await client.chat.completions.create({
    model: params.model,
    messages: [
      { role: "system", content: params.systemPrompt },
      { role: "user", content: params.userPrompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: params.jsonSchema,
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI APIから空のレスポンスが返されました。");
  }
  return JSON.parse(content);
}
