import { Link } from 'react-router-dom';
import { CONTACT_PHONE, CONTACT_EMAIL, CONTACT_ADDRESS } from '../constants/contact';

export function Footer() {
  return (
    <footer className="bg-white text-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <img src="http://162.43.33.101/api/img/logo.png" alt="LOGO" className="w-8 h-8" />
              <span className="text-2xl font-bold text-blue-900">BOXPACK</span>
            </div>
            <p className="text-sm leading-relaxed">
              木箱をもっと簡単に、もっと早く。
              <br />
              サイズを入力するだけで、すぐ価格が出て、そのまま注文できる、
              <br />
              新しい木箱調達サービスです。
            </p>
          </div>

          <div>
            <h3 className="text-black font-semibold mb-4">サービス</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/quote"
                  className="transition-colors text-black hover:underline"
                >
                  見積もり作成
                </Link>
              </li>
              <li>
                <Link
                  to="/"
                  className="transition-colors text-black hover:underline"
                >
                  特徴・機能
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">法的情報</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/terms"
                  className="transition-colors text-black hover:underline"
                >
                  利用規約
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="transition-colors text-black hover:underline"
                >
                  個人情報保護方針
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">お問い合わせ</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="font-medium">電話:</span>{' '}
                <a href={`tel:${CONTACT_PHONE}`} className="text-black hover:underline">
                  {CONTACT_PHONE}
                </a>
              </li>
              <li>
                <span className="font-medium">メール:</span>{' '}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-black hover:underline">
                  {CONTACT_EMAIL}
                </a>
              </li>
              <li>
                <span className="font-medium">住所:</span>
                <p className="text-black leading-relaxed">{CONTACT_ADDRESS}</p>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 text-sm text-center">
          <p>&copy; 2025 BOXPACK. All rights reserved.</p>
        </div>
      </div>
      
    </footer>
  );
}
