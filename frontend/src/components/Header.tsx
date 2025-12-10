import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, User, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { CONTACT_PHONE, CONTACT_EMAIL, CONTACT_ADDRESS } from '../constants/contact';

export function Header() {
  const { user, signOut, profile } = useAuth();
  const { items } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPage = location.pathname;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="bg-amber-50 border-b border-amber-100 text-amber-900 text-xs sm:text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex sm:flex-row items-center sm:gap-4 text-center sm:text-left gap-3 justify-center">
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="font-semibold">電話:</span>
              <a href={`tel:${CONTACT_PHONE}`} className="hover:underline">
                {CONTACT_PHONE}
              </a>
            </div>
            <div className="hidden sm:block text-amber-300">|</div>
            <div className="flex sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="font-semibold">メール:</span>
              <a href={`mailto:${CONTACT_EMAIL}`} className="hover:underline break-all">
                {CONTACT_EMAIL}
              </a>
            </div>
          </div>
          <div className="text-center sm:text-right whitespace-pre-wrap leading-tight">
            {CONTACT_ADDRESS}
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link
            to="/"
            className="flex items-center space-x-2 text-gray-900 hover:text-gray-700 transition-colors"
          >
            <img src="http://162.43.33.101/api/img/logo.webp" alt="LOGO" className="w-8 h-8" />
            <span className="text-2xl font-bold tracking-tight text-blue-900">BOXPACK</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`text-sm font-medium transition-colors ${
                currentPage === '/' ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              ホーム
            </Link>
            <Link
              to="/quote"
              className={`text-sm font-medium transition-colors ${
                currentPage === '/quote' ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              見積もり
            </Link>
            {user && (
              <Link
                to="/mypage"
                className={`text-sm font-medium transition-colors ${
                  currentPage === '/mypage' ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                マイページ
              </Link>
            )}
            {profile?.role === 'admin' && (
              <Link
                to="/admin/dashboard"
                className={`text-sm font-medium transition-colors ${
                  currentPage.startsWith('/admin') ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                管理ページ
              </Link>
            )}
          </nav>

          <div className="flex items-center space-x-4">
            <Link
              to="/cart"
              className="relative p-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              <ShoppingCart className="w-6 h-6" />
              {items.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {items.length}
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center space-x-2">
                <Link
                  to="/mypage"
                  className="p-2 text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <User className="w-6 h-6" />
                </Link>
                <button
                  onClick={handleSignOut}
                  className="p-2 text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <LogOut className="w-6 h-6" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors"
              >
                ログイン
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
