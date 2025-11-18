import { useEffect, useState } from 'react';
import { Package, Clock, CheckCircle, Truck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Order, OrderItem, Profile } from '../types/database';

interface MyPageProps {
  onNavigate: (page: string) => void;
}

export function MyPage({ onNavigate }: MyPageProps) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadProfile();
      loadOrders();
    } else {
      onNavigate('login');
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (data) {
      setProfile(data);
    }
  };

  const loadOrders = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setOrders(data);
    }
    setLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      case 'manufacturing':
        return <Package className="w-5 h-5 text-purple-600" />;
      case 'shipped':
        return <Truck className="w-5 h-5 text-orange-600" />;
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return '注文確認中';
      case 'confirmed':
        return '注文確定';
      case 'manufacturing':
        return '製作中';
      case 'shipped':
        return '配送中';
      case 'delivered':
        return '配送完了';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">マイページ</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">プロフィール</h2>

              {profile && (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">お名前</p>
                    <p className="text-gray-900 font-medium">{profile.full_name || '-'}</p>
                  </div>

                  {profile.company_name && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">会社名</p>
                      <p className="text-gray-900 font-medium">{profile.company_name}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-gray-600 mb-1">メールアドレス</p>
                    <p className="text-gray-900 font-medium">{profile.email}</p>
                  </div>

                  {profile.phone && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">電話番号</p>
                      <p className="text-gray-900 font-medium">{profile.phone}</p>
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">保有ポイント</p>
                    <p className="text-2xl font-bold text-gray-900">{profile.points} pt</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">注文履歴</h2>

              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-6">
                    まだ注文がありません
                  </p>
                  <button
                    onClick={() => onNavigate('quote')}
                    className="px-6 py-3 text-white bg-amber-600 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    見積もり作成へ
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="border-2 border-gray-200 rounded-lg p-6 hover:border-gray-400 transition-all"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">注文番号</p>
                          <p className="font-mono text-gray-900 font-medium">
                            {order.order_number}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(order.status)}
                          <span className="text-sm font-medium text-gray-900">
                            {getStatusLabel(order.status)}
                          </span>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">注文日</p>
                          <p className="text-gray-900">
                            {new Date(order.created_at).toLocaleDateString('ja-JP')}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">合計金額</p>
                          <p className="text-xl font-bold text-gray-900">
                            ¥{order.total_amount.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-600 mb-1">配送先</p>
                        <p className="text-gray-900 text-sm">
                          〒{order.shipping_address.postal_code}{' '}
                          {order.shipping_address.prefecture}
                          {order.shipping_address.city}
                          {order.shipping_address.address_line}
                          {order.shipping_address.building && ` ${order.shipping_address.building}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
