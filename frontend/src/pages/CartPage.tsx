import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

export function CartPage() {
  const navigate = useNavigate();
  const { items, removeFromCart, updateQuantity, totalAmount } = useCart();
  const { user } = useAuth();

  const handleCheckout = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              カートは空です
            </h2>
            <p className="text-gray-600 mb-8">
              見積もりを作成して、カートに商品を追加しましょう
            </p>
            <button
              onClick={() => navigate('/quote')}
              className="px-8 py-3 text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors"
            >
              見積もり作成へ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">カート</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.cartId} className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      木箱 - {item.material.name}
                    </h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>サイズ: {item.width_mm} × {item.depth_mm} × {item.height_mm} mm</p>
                      <p>板厚: {item.thickness.thickness_mm}mm</p>
                      {item.selectedOptions.length > 0 && (
                        <p>
                          オプション: {item.selectedOptions.map(o => `${o.option.name}(${o.quantity}個)`).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.cartId)}
                    className="text-red-600 hover:text-red-800 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-lg font-medium text-gray-900 w-12 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">小計</p>
                    <p className="text-xl font-bold text-gray-900">
                      ¥{(item.totalPrice * item.quantity).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-8 sticky top-24">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">注文概要</h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>商品点数</span>
                  <span>{items.length}点</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>小計</span>
                  <span>¥{totalAmount.toLocaleString()}</span>
                </div>
                <div className="pt-4 border-t-2 border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">合計</span>
                    <span className="text-2xl font-bold text-gray-900">
                      ¥{totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full px-6 py-4 text-lg font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-all"
              >
                {user ? '購入手続きへ' : 'ログインして購入'}
              </button>

              <button
                onClick={() => navigate('/quote')}
                className="w-full mt-4 px-6 py-4 text-lg font-medium text-gray-900 bg-white border-2 border-gray-900 rounded-lg hover:bg-gray-50 transition-all"
              >
                買い物を続ける
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
