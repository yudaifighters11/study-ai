import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";

/**
 * プライバシーポリシーページ。
 * 仮実装: 正式な法務レビューを受けた文書ではなく、暫定的な下書きです。
 * 内容を確定する際は専門家のレビューを受けてから正式版に差し替えてください。
 */
export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen justify-center bg-gray-100">
      <div className="flex w-full max-w-[430px] md:max-w-2xl flex-col border-x border-gray-200 bg-gray-50">
        <AppHeader title="プライバシーポリシー" />

        <main className="flex flex-col gap-4 p-4 md:p-6">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 hover:underline"
          >
            ← 戻る
          </Link>

          <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 text-sm leading-relaxed text-gray-700 shadow-sm">
            <p className="rounded-lg bg-yellow-50 p-3 text-xs text-yellow-800">
              仮実装: これは正式な法務レビューを受けたプライバシーポリシーではなく、暫定的な下書きです。内容は今後変更される可能性があります。
            </p>

            <section>
              <h2 className="mb-1 font-semibold text-gray-900">1. 取得する情報</h2>
              <p>
                メールアドレス、表示名、年代・身分(任意)、受験予定日・目標スコア(任意)、回答履歴、解答時間、自信度などを取得します。
              </p>
            </section>

            <section>
              <h2 className="mb-1 font-semibold text-gray-900">2. 利用目的</h2>
              <p>
                取得した情報は、正誤判定、弱点分析、AIによる類題生成など、本サービスの提供のためにのみ利用します。
              </p>
            </section>

            <section>
              <h2 className="mb-1 font-semibold text-gray-900">3. 外部サービスへの送信</h2>
              <p>
                誤答の分析および類題生成のため、問題文・選択肢・回答内容などをOpenAI APIへ送信します。データの保存にはSupabaseを利用しています。
              </p>
            </section>

            <section>
              <h2 className="mb-1 font-semibold text-gray-900">4. 第三者提供</h2>
              <p>
                法令に基づく場合を除き、取得した情報を本人の同意なく第三者に提供することはありません。
              </p>
            </section>

            <section>
              <h2 className="mb-1 font-semibold text-gray-900">5. お問い合わせ</h2>
              <p>
                本ポリシーに関するお問い合わせは、サービス運営者まで直接ご連絡ください。
              </p>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
