import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";

/**
 * 利用規約ページ。
 * 仮実装: 正式な法務レビューを受けた文書ではなく、暫定的な下書きです。
 * 内容を確定する際は専門家のレビューを受けてから正式版に差し替えてください。
 */
export default function TermsPage() {
  return (
    <div className="flex min-h-screen justify-center bg-gray-100">
      <div className="flex w-full max-w-[430px] md:max-w-2xl flex-col border-x border-gray-200 bg-gray-50">
        <AppHeader title="利用規約" />

        <main className="flex flex-col gap-4 p-4 md:p-6">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 hover:underline"
          >
            ← 戻る
          </Link>

          <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 text-sm leading-relaxed text-gray-700 shadow-sm">
            <p className="rounded-lg bg-yellow-50 p-3 text-xs text-yellow-800">
              仮実装: これは正式な法務レビューを受けた利用規約ではなく、暫定的な下書きです。内容は今後変更される可能性があります。
            </p>

            <section>
              <h2 className="mb-1 font-semibold text-gray-900">1. サービス内容</h2>
              <p>
                本サービス(New Study)は、資格試験の過去問演習と、AIによる誤答傾向分析・類題生成を行う学習支援サービスです。
              </p>
            </section>

            <section>
              <h2 className="mb-1 font-semibold text-gray-900">2. アカウント</h2>
              <p>
                本サービスの利用にはアカウント登録が必要です。登録情報は正確に入力してください。
              </p>
            </section>

            <section>
              <h2 className="mb-1 font-semibold text-gray-900">3. AI生成コンテンツについて</h2>
              <p>
                類題やミス傾向分析はAIによって生成されるため、内容に誤りを含む可能性があります。生成された問題や解説の正確性を保証するものではありません。
              </p>
            </section>

            <section>
              <h2 className="mb-1 font-semibold text-gray-900">4. 禁止事項</h2>
              <p>
                本サービスへの不正アクセス、他者に不利益を与える行為、法令に違反する行為を禁止します。
              </p>
            </section>

            <section>
              <h2 className="mb-1 font-semibold text-gray-900">5. 免責事項</h2>
              <p>
                本サービスの利用により生じた損害について、運営者は責任を負わないものとします。
              </p>
            </section>

            <section>
              <h2 className="mb-1 font-semibold text-gray-900">6. 規約の変更</h2>
              <p>
                本規約は予告なく変更されることがあります。
              </p>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
