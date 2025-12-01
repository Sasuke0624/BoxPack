import { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  Truck, 
  Eye, 
  Filter,
  X,
  Download,
  FileText
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Order, OrderItem, Material, MaterialThickness, Profile } from '../../types/database';

interface OrderWithUser extends Order {
  user?: Profile;
  items?: (OrderItem & {
    material?: Material;
    thickness?: MaterialThickness;
  })[];
}

export function AdminOrders() {
  const [orders, setOrders] = useState<OrderWithUser[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithUser | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [shippingEta, setShippingEta] = useState('');

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const loadOrders = async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data: ordersData, error: fetchError } = await query;

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    if (!ordersData) {
      setLoading(false);
      return;
    }

    // Load user profiles separately
    const userIds = [...new Set(ordersData.map(order => order.user_id))];
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, email, full_name, company_name, phone')
      .in('id', userIds);

    const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

    // Load order items for each order
    const ordersWithItems = await Promise.all(
      ordersData.map(async (order) => {
        // Load order items
        const { data: items } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', order.id);

        // Load materials and thicknesses for items
        const itemsWithDetails = await Promise.all(
          (items || []).map(async (item) => {
            const { data: material } = await supabase
              .from('materials')
              .select('id, name')
              .eq('id', item.material_id)
              .single();

            const { data: thickness } = await supabase
              .from('material_thicknesses')
              .select('id, thickness_mm')
              .eq('id', item.thickness_id)
              .single();

            return {
              ...item,
              material: material || undefined,
              thickness: thickness || undefined,
            };
          })
        );

        return {
          ...order,
          user: profilesMap.get(order.user_id),
          items: itemsWithDetails,
        };
      })
    );

    setOrders(ordersWithItems);
    setLoading(false);
  };

  const handleApproveOrder = async (orderId: string) => {
    if (!confirm('この注文を承認しますか？')) {
      return;
    }

    setLoading(true);
    setError(null);

    const { error } = await supabase
      .from('orders')
      .update({ 
        status: 'confirmed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) {
      setError(error.message);
    } else {
      await loadOrders();
    }
    setLoading(false);
  };

  const handleUpdateShipping = async (orderId: string) => {
    if (!shippingEta) {
      setError('配送予定日を入力してください');
      return;
    }

    setLoading(true);
    setError(null);

    const { error } = await supabase
      .from('orders')
      .update({ 
        status: 'shipped',
        shipping_eta: shippingEta,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) {
      setError(error.message);
    } else {
      await loadOrders();
      setShowShippingModal(false);
      setShippingEta('');
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
      }
    }
    setLoading(false);
  };


  const getStatusBadge = (status: Order['status']) => {
    const statusConfig = {
      pending: { label: '承認待ち', color: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: '承認済み', color: 'bg-blue-100 text-blue-800' },
      manufacturing: { label: '製造中', color: 'bg-purple-100 text-purple-800' },
      shipped: { label: '配送中', color: 'bg-indigo-100 text-indigo-800' },
      delivered: { label: '配送完了', color: 'bg-green-100 text-green-800' },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const openShippingModal = (order: OrderWithUser) => {
    setSelectedOrder(order);
    setShippingEta(order.shipping_eta ? new Date(order.shipping_eta).toISOString().slice(0, 16) : '');
    setShowShippingModal(true);
  };

  const openDetailModal = async (order: OrderWithUser) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  return (
    <div className='overflow-auto'>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900">注文管理</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="all">すべて</option>
              <option value="pending">承認待ち</option>
              <option value="confirmed">承認済み</option>
              <option value="manufacturing">製造中</option>
              <option value="shipped">配送中</option>
              <option value="delivered">配送完了</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  注文番号
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  顧客
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  合計金額
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状態
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  配送予定日
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  注文日
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    読み込み中...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    注文がありません
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{order.order_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.user?.full_name || order.user?.email || '不明'}
                      </div>
                      {order.user?.company_name && (
                        <div className="text-sm text-gray-500">{order.user.company_name}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ¥{order.total_amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.shipping_eta 
                        ? new Date(order.shipping_eta).toLocaleDateString('ja-JP')
                        : '-'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString('ja-JP')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openDetailModal(order)}
                          className="text-blue-600 hover:text-blue-900"
                          title="詳細を見る"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {order.status === 'pending' && (
                          <button
                            onClick={() => handleApproveOrder(order.id)}
                            className="text-green-600 hover:text-green-900"
                            title="承認"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {order.status !== 'shipped' && order.status !== 'delivered' && (
                          <button
                            onClick={() => openShippingModal(order)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="配送中に変更"
                          >
                            <Truck className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {showDetailModal && selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedOrder(null);
          }}
        />
      )}

      {/* Shipping Modal */}
      {showShippingModal && selectedOrder && (
        <ShippingModal
          order={selectedOrder}
          shippingEta={shippingEta}
          onShippingEtaChange={setShippingEta}
          onClose={() => {
            setShowShippingModal(false);
            setSelectedOrder(null);
            setShippingEta('');
          }}
          onSave={() => handleUpdateShipping(selectedOrder.id)}
          loading={loading}
        />
      )}
    </div>
  );
}

interface OrderDetailModalProps {
  order: OrderWithUser;
  onClose: () => void;
}

function OrderDetailModal({ order, onClose }: OrderDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900">注文詳細 - {order.order_number}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          {/* Customer Info */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">顧客情報</h4>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <p><span className="font-medium">名前:</span> {order.user?.full_name || '-'}</p>
              <p><span className="font-medium">メール:</span> {order.user?.email || '-'}</p>
              <p><span className="font-medium">会社名:</span> {order.user?.company_name || '-'}</p>
              <p><span className="font-medium">電話:</span> {order.user?.phone || '-'}</p>
            </div>
          </div>

          {/* Shipping Address */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">配送先</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <p>〒{order.shipping_address.postal_code}</p>
              <p>{order.shipping_address.prefecture} {order.shipping_address.city} {order.shipping_address.address_line}</p>
              {order.shipping_address.building && <p>{order.shipping_address.building}</p>}
              <p className="mt-2"><span className="font-medium">受取人:</span> {order.shipping_address.recipient_name}</p>
              <p><span className="font-medium">電話:</span> {order.shipping_address.phone}</p>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">注文明細</h4>
            <div className="space-y-4">
              {order.items?.map((item) => (
                <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-gray-900">
                        {item.material?.name || '不明'} - {item.thickness?.thickness_mm || '不明'}mm
                      </p>
                      <p className="text-sm text-gray-600">
                        サイズ: {item.width_mm} × {item.depth_mm} × {item.height_mm} mm
                      </p>
                      <p className="text-sm text-gray-600">数量: {item.quantity}個</p>
                    </div>
                    <p className="font-semibold text-gray-900">
                      ¥{item.subtotal.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">小計</span>
              <span className="text-gray-900">¥{order.total_amount.toLocaleString()}</span>
            </div>
            {order.points_used > 0 && (
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">使用ポイント</span>
                <span className="text-gray-900">-{order.points_used}pt</span>
              </div>
            )}
            <div className="flex justify-between items-center text-lg font-bold">
              <span>合計</span>
              <span>¥{order.total_amount.toLocaleString()}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              閉じる
            </button>
            <button
              className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-2"
              onClick={() => {
                // TODO: Implement PDF download
                alert('PDFダウンロード機能は実装予定です');
              }}
            >
              <Download className="w-5 h-5" />
              見積書をダウンロード
            </button>
            <button
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
              onClick={() => {
                // TODO: Implement invoice download
                alert('送り状ダウンロード機能は実装予定です');
              }}
            >
              <FileText className="w-5 h-5" />
              送り状をダウンロード
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ShippingModalProps {
  order: OrderWithUser;
  shippingEta: string;
  onShippingEtaChange: (eta: string) => void;
  onClose: () => void;
  onSave: () => void;
  loading: boolean;
}

function ShippingModal({ order, shippingEta, onShippingEtaChange, onClose, onSave, loading }: ShippingModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900">配送情報を更新</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">注文番号: {order.order_number}</p>
            <p className="text-sm text-gray-600">状態を「配送中」に変更し、配送予定日を設定します。</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              配送予定日 <span className="text-red-600">*</span>
            </label>
            <input
              type="datetime-local"
              value={shippingEta}
              onChange={(e) => onShippingEtaChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={onSave}
              disabled={loading || !shippingEta}
              className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Truck className="w-5 h-5" />
              {loading ? '更新中...' : '配送中に変更'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

