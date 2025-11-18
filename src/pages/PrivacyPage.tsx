interface PrivacyPageProps {
  onNavigate: (page: string) => void;
}

export function PrivacyPage({ onNavigate }: PrivacyPageProps) {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm p-8 lg:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">個人情報保護方針</h1>

          <div className="space-y-8 text-gray-700 leading-relaxed">
            <section>
              <p className="mb-4">
                BOXPACK（以下「当社」）は、以下のとおり個人情報保護方針を定め、
                個人情報保護の仕組みを構築し、全従業員に個人情報保護の重要性の認識と取組みを徹底させることにより、
                個人情報の保護を推進致します。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">個人情報の管理</h2>
              <p>
                当社は、お客さまの個人情報を正確かつ最新の状態に保ち、個人情報への不正アクセス・紛失・破損・改ざん・漏洩などを防止するため、
                セキュリティシステムの維持・管理体制の整備・社員教育の徹底等の必要な措置を講じ、安全対策を実施し個人情報の厳重な管理を行ないます。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">個人情報の利用目的</h2>
              <p className="mb-2">
                お客さまからお預かりした個人情報は、当社からのご連絡や業務のご案内やご質問に対する回答として、
                電子メールや資料のご送付に利用いたします。
              </p>
              <p className="mb-2">具体的には以下の目的で利用いたします。</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>木箱の見積もり作成およびご注文の処理</li>
                <li>商品の配送および配送状況のご連絡</li>
                <li>お問い合わせへの対応</li>
                <li>サービス改善のための統計データの作成</li>
                <li>新サービスや機能のご案内</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">個人情報の第三者への開示・提供の禁止</h2>
              <p className="mb-4">
                当社は、お客さまよりお預かりした個人情報を適切に管理し、次のいずれかに該当する場合を除き、
                個人情報を第三者に開示いたしません。
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>お客さまの同意がある場合</li>
                <li>お客さまが希望されるサービスを行なうために当社が業務を委託する業者に対して開示する場合</li>
                <li>法令に基づき開示することが必要である場合</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">個人情報の安全対策</h2>
              <p>
                当社は、個人情報の正確性及び安全性確保のために、セキュリティに万全の対策を講じています。
                SSL暗号化通信の使用、アクセス制御、ファイアウォールの設置など、技術的・組織的な安全管理措置を実施しています。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">ご本人の照会</h2>
              <p>
                お客さまがご本人の個人情報の照会・修正・削除などをご希望される場合には、
                ご本人であることを確認の上、対応させていただきます。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">法令、規範の遵守と見直し</h2>
              <p>
                当社は、保有する個人情報に関して適用される日本の法令、その他規範を遵守するとともに、
                本ポリシーの内容を適宜見直し、その改善に努めます。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Cookie（クッキー）について</h2>
              <p className="mb-4">
                当サービスでは、より良いサービスの提供のため、Cookieを使用することがあります。
                Cookieの使用により個人を特定できる情報の収集を行うことはありません。
              </p>
              <p>
                また、Cookieの受け入れを希望されない場合は、ブラウザの設定で変更することができます。
                ただし、Cookieを無効にした場合、サービスの一部機能がご利用いただけない場合がございます。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">お問い合わせ</h2>
              <p>
                当社の個人情報の取扱に関するお問い合わせは、当サービスのお問い合わせフォームよりご連絡ください。
              </p>
            </section>

            <div className="pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-600">制定日：2024年1月1日</p>
              <p className="text-sm text-gray-600">最終改定日：2024年1月1日</p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => onNavigate('home')}
              className="px-8 py-3 text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors"
            >
              ホームに戻る
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
