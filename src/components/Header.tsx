import { Package, ShoppingCart, User, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

interface HeaderProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

export function Header({ onNavigate, currentPage }: HeaderProps) {
  const { user, signOut } = useAuth();
  const { items } = useCart();

  const handleSignOut = async () => {
    await signOut();
    onNavigate('home');
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center space-x-2 text-gray-900 hover:text-gray-700 transition-colors"
          >
            <Package className="w-8 h-8" />
            <span className="text-2xl font-bold tracking-tight">BOXPACK</span>
          </button>

          <nav className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => onNavigate('home')}
              className={`text-sm font-medium transition-colors ${
                currentPage === 'home' ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              ホーム
            </button>
            <button
              onClick={() => onNavigate('quote')}
              className={`text-sm font-medium transition-colors ${
                currentPage === 'quote' ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              見積もり
            </button>
            {user && (
              <button
                onClick={() => onNavigate('mypage')}
                className={`text-sm font-medium transition-colors ${
                  currentPage === 'mypage' ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                マイページ
              </button>
            )}
          </nav>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => onNavigate('cart')}
              className="relative p-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              <ShoppingCart className="w-6 h-6" />
              {items.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {items.length}
                </span>
              )}
            </button>

            {user ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onNavigate('mypage')}
                  className="p-2 text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <User className="w-6 h-6" />
                </button>
                <button
                  onClick={handleSignOut}
                  className="p-2 text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <LogOut className="w-6 h-6" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => onNavigate('login')}
                className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-gray-800 transition-colors"
              >
                ログイン
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
