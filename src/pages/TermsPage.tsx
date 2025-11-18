interface TermsPageProps {
  onNavigate: (page: string) => void;
}

export function TermsPage({ onNavigate }: TermsPageProps) {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm p-8 lg:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">利用規約</h1>

          <div className="space-y-8 text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">第1条（適用）</h2>
              <p>
                本規約は、BOXPACK（以下「当サービス」）が提供するサービスの利用条件を定めるものです。
                利用者は、本規約に同意したものとみなされます。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">第2条（利用登録）</h2>
              <p className="mb-4">
                当サービスの利用を希望する方は、本規約に同意の上、当社の定める方法によって利用登録を申請し、
                当社がこれを承認することによって、利用登録が完了するものとします。
              </p>
              <p>
                当社は、利用登録の申請者に以下の事由があると判断した場合、利用登録の申請を承認しないことがあり、
                その理由については一切の開示義務を負わないものとします。
              </p>
              <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
                <li>利用登録の申請に際して虚偽の事項を届け出た場合</li>
                <li>本規約に違反したことがある者からの申請である場合</li>
                <li>その他、当社が利用登録を相当でないと判断した場合</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">第3条（ユーザーIDおよびパスワードの管理）</h2>
              <p className="mb-4">
                利用者は、自己の責任において、当サービスのユーザーIDおよびパスワードを適切に管理するものとします。
              </p>
              <p>
                利用者は、いかなる場合にも、ユーザーIDおよびパスワードを第三者に譲渡または貸与し、
                もしくは第三者と共用することはできません。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">第4条（禁止事項）</h2>
              <p className="mb-2">利用者は、当サービスの利用にあたり、以下の行為をしてはなりません。</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>法令または公序良俗に違反する行為</li>
                <li>犯罪行為に関連する行為</li>
                <li>当社、当サービスの他の利用者、または第三者の知的財産権を侵害する行為</li>
                <li>当社、当サービスの他の利用者、または第三者の名誉や信用を毀損する行為</li>
                <li>当サービスのネットワークまたはシステム等に過度な負荷をかける行為</li>
                <li>当社のサービスの運営を妨害するおそれのある行為</li>
                <li>不正アクセスをし、またはこれを試みる行為</li>
                <li>他の利用者に関する個人情報等を収集または蓄積する行為</li>
                <li>不正な目的を持って当サービスを利用する行為</li>
                <li>その他、当社が不適切と判断する行為</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">第5条（本サービスの提供の停止等）</h2>
              <p className="mb-2">
                当社は、以下のいずれかの事由があると判断した場合、利用者に事前に通知することなく
                本サービスの全部または一部の提供を停止または中断することができるものとします。
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>本サービスにかかるコンピュータシステムの保守点検または更新を行う場合</li>
                <li>地震、落雷、火災、停電または天災などの不可抗力により、本サービスの提供が困難となった場合</li>
                <li>コンピュータまたは通信回線等が事故により停止した場合</li>
                <li>その他、当社が本サービスの提供が困難と判断した場合</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">第6条（免責事項）</h2>
              <p className="mb-4">
                当社は、本サービスに関して、利用者と他の利用者または第三者との間において生じた取引、連絡または紛争等について
                一切責任を負いません。
              </p>
              <p>
                当社の債務不履行責任は、当社の故意または重過失によらない場合には免責されるものとします。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">第7条（サービス内容の変更等）</h2>
              <p>
                当社は、利用者に通知することなく、本サービスの内容を変更しまたは本サービスの提供を中止することができるものとし、
                これによって利用者に生じた損害について一切の責任を負いません。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">第8条（利用規約の変更）</h2>
              <p>
                当社は、必要と判断した場合には、利用者に通知することなくいつでも本規約を変更することができるものとします。
                変更後の本規約は、当社ウェブサイトに掲示された時点から効力を生じるものとします。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">第9条（準拠法・裁判管轄）</h2>
              <p className="mb-4">
                本規約の解釈にあたっては、日本法を準拠法とします。
              </p>
              <p>
                本サービスに関して紛争が生じた場合には、当社の本店所在地を管轄する裁判所を専属的合意管轄とします。
              </p>
            </section>

            <div className="pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-600">制定日：2024年1月1日</p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => onNavigate('home')}
              className="px-8 py-3 text-white bg-amber-600 rounded-lg hover:bg-gray-800 transition-colors"
            >
              ホームに戻る
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
