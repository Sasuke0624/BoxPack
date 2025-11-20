import { useState, useEffect } from 'react';
import { 
  Download, 
  FileText,
  Search,
  Filter,
  Eye
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Order, OrderItem, Material, MaterialThickness, Profile } from '../../types/database';

interface OrderWithDetails extends Order {
  user?: Profile;
  items?: (OrderItem & {
    material?: Material;
    thickness?: MaterialThickness;
  })[];
}

export function AdminDocuments() {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [documentType, setDocumentType] = useState<'quote' | 'invoice'>('quote');

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

    // Load user profiles
    const userIds = [...new Set(ordersData.map(order => order.user_id))];
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, email, full_name, company_name, phone')
      .in('id', userIds);

    const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

    // Load order items for each order
    const ordersWithDetails = await Promise.all(
      ordersData.map(async (order) => {
        const { data: items } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', order.id);

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

    setOrders(ordersWithDetails);
    setLoading(false);
  };

  const generatePDF = async (order: OrderWithDetails, type: 'quote' | 'invoice') => {
    // In a real implementation, this would generate a PDF
    // For now, we'll create a simple HTML document that can be printed
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setError('ポップアップがブロックされています。ブラウザの設定を確認してください。');
      return;
    }

    const html = generateDocumentHTMLForDownload(order, type);
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  const downloadPDF = async (order: OrderWithDetails, type: 'quote' | 'invoice') => {
    // In a real implementation, this would download a PDF file
    // For now, we'll create a downloadable HTML file
    const html = generateDocumentHTMLForDownload(order, type);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type === 'quote' ? '見積書' : '送り状'}_${order.order_number}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateDocumentHTMLForDownload = (order: OrderWithDetails, type: 'quote' | 'invoice'): string => {
    const title = type === 'quote' ? '見積書' : '送り状';
    const date = new Date(order.created_at).toLocaleDateString('ja-JP');
    
    return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ${order.order_number}</title>
  <style>
    body { font-family: 'MS PGothic', sans-serif; padding: 40px; }
    .header { text-align: center; margin-bottom: 40px; }
    .header h1 { font-size: 24px; margin-bottom: 10px; }
    .info { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .info-section { flex: 1; }
    .info-section h3 { border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th, td { border: 1px solid #000; padding: 8px; text-align: left; }
    th { background-color: #f0f0f0; }
    .total { text-align: right; font-weight: bold; font-size: 18px; margin-top: 20px; }
    .footer { margin-top: 40px; text-align: center; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${title}</h1>
    <p>発行日: ${date}</p>
    <p>${title === '見積書' ? '見積番号' : '注文番号'}: ${order.order_number}</p>
  </div>
  
  <div class="info">
    <div class="info-section">
      <h3>お客様情報</h3>
      <p>${order.user?.full_name || order.user?.email || '-'}</p>
      <p>${order.user?.company_name || ''}</p>
      <p>${order.user?.phone || ''}</p>
    </div>
    <div class="info-section">
      <h3>${type === 'quote' ? '見積先' : '配送先'}</h3>
      <p>〒${order.shipping_address.postal_code}</p>
      <p>${order.shipping_address.prefecture} ${order.shipping_address.city} ${order.shipping_address.address_line}</p>
      ${order.shipping_address.building ? `<p>${order.shipping_address.building}</p>` : ''}
      <p>${order.shipping_address.recipient_name} 様</p>
      <p>${order.shipping_address.phone}</p>
    </div>
  </div>
  
  <table>
    <thead>
      <tr>
        <th>品名</th>
        <th>サイズ (mm)</th>
        <th>数量</th>
        <th>単価</th>
        <th>小計</th>
      </tr>
    </thead>
    <tbody>
      ${order.items?.map(item => `
        <tr>
          <td>${item.material?.name || '不明'} - ${item.thickness?.thickness_mm || '不明'}mm</td>
          <td>${item.width_mm} × ${item.depth_mm} × ${item.height_mm}</td>
          <td>${item.quantity}</td>
          <td>¥${item.unit_price.toLocaleString()}</td>
          <td>¥${item.subtotal.toLocaleString()}</td>
        </tr>
      `).join('') || ''}
    </tbody>
  </table>
  
  <div class="total">
    <p>合計金額: ¥${order.total_amount.toLocaleString()}</p>
    ${order.points_used > 0 ? `<p>使用ポイント: -${order.points_used}pt</p>` : ''}
    ${type === 'invoice' ? `<p>支払方法: ${order.payment_method}</p>` : ''}
  </div>
  
  <div class="footer">
    <p>BOXPACK</p>
    <p>〒150-0001 東京都渋谷区神宮前1-2-3 BOXPACKビル5F</p>
    <p>TEL: 03-1234-5678 | Email: support@boxpack.jp</p>
  </div>
</body>
</html>
    `;
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900">書類管理</h2>
        <div className="flex items-center gap-4">
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value as 'quote' | 'invoice')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="quote">見積書</option>
            <option value="invoice">送り状</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="注文番号、メール、名前で検索..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        >
          <option value="all">すべてのステータス</option>
          <option value="pending">承認待ち</option>
          <option value="confirmed">承認済み</option>
          <option value="manufacturing">製造中</option>
          <option value="shipped">配送中</option>
          <option value="delivered">配送完了</option>
        </select>
      </div>

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
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    読み込み中...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    注文が見つかりません
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{order.order_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.user?.full_name || order.user?.email || '不明'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ¥{order.total_amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'shipped' ? 'bg-indigo-100 text-indigo-800' :
                        order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.status === 'pending' ? '承認待ち' :
                         order.status === 'confirmed' ? '承認済み' :
                         order.status === 'manufacturing' ? '製造中' :
                         order.status === 'shipped' ? '配送中' :
                         '配送完了'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString('ja-JP')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowPreviewModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="プレビュー"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => generatePDF(order, documentType)}
                          className="text-green-600 hover:text-green-900"
                          title="印刷"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => downloadPDF(order, documentType)}
                          className="text-amber-600 hover:text-amber-900"
                          title="ダウンロード"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreviewModal && selectedOrder && (
        <DocumentPreviewModal
          order={selectedOrder}
          documentType={documentType}
          onClose={() => {
            setShowPreviewModal(false);
            setSelectedOrder(null);
          }}
        />
      )}
    </div>
  );
}

interface DocumentPreviewModalProps {
  order: OrderWithDetails;
  documentType: 'quote' | 'invoice';
  onClose: () => void;
}

function DocumentPreviewModal({ order, documentType, onClose }: DocumentPreviewModalProps) {
  const html = generateDocumentHTML(order, documentType);
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900">
            {documentType === 'quote' ? '見積書' : '送り状'} プレビュー - {order.order_number}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <span className="text-gray-600">×</span>
          </button>
        </div>
        <div className="p-6">
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </div>
    </div>
  );
}

function generateDocumentHTML(order: OrderWithDetails, type: 'quote' | 'invoice'): string {
  const title = type === 'quote' ? '見積書' : '送り状';
  const date = new Date(order.created_at).toLocaleDateString('ja-JP');
  
  return `
    <div style="font-family: 'MS PGothic', sans-serif; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-size: 24px; margin-bottom: 10px;">${title}</h1>
        <p>発行日: ${date}</p>
        <p>${type === 'quote' ? '見積番号' : '注文番号'}: ${order.order_number}</p>
      </div>
      
      <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
        <div style="flex: 1;">
          <h3 style="border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 10px;">お客様情報</h3>
          <p>${order.user?.full_name || order.user?.email || '-'}</p>
          <p>${order.user?.company_name || ''}</p>
          <p>${order.user?.phone || ''}</p>
        </div>
        <div style="flex: 1;">
          <h3 style="border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 10px;">${type === 'quote' ? '見積先' : '配送先'}</h3>
          <p>〒${order.shipping_address.postal_code}</p>
          <p>${order.shipping_address.prefecture} ${order.shipping_address.city} ${order.shipping_address.address_line}</p>
          ${order.shipping_address.building ? `<p>${order.shipping_address.building}</p>` : ''}
          <p>${order.shipping_address.recipient_name} 様</p>
          <p>${order.shipping_address.phone}</p>
        </div>
      </div>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr>
            <th style="border: 1px solid #000; padding: 8px; background-color: #f0f0f0;">品名</th>
            <th style="border: 1px solid #000; padding: 8px; background-color: #f0f0f0;">サイズ (mm)</th>
            <th style="border: 1px solid #000; padding: 8px; background-color: #f0f0f0;">数量</th>
            <th style="border: 1px solid #000; padding: 8px; background-color: #f0f0f0;">単価</th>
            <th style="border: 1px solid #000; padding: 8px; background-color: #f0f0f0;">小計</th>
          </tr>
        </thead>
        <tbody>
          ${order.items?.map(item => `
            <tr>
              <td style="border: 1px solid #000; padding: 8px;">${item.material?.name || '不明'} - ${item.thickness?.thickness_mm || '不明'}mm</td>
              <td style="border: 1px solid #000; padding: 8px;">${item.width_mm} × ${item.depth_mm} × ${item.height_mm}</td>
              <td style="border: 1px solid #000; padding: 8px;">${item.quantity}</td>
              <td style="border: 1px solid #000; padding: 8px;">¥${item.unit_price.toLocaleString()}</td>
              <td style="border: 1px solid #000; padding: 8px;">¥${item.subtotal.toLocaleString()}</td>
            </tr>
          `).join('') || ''}
        </tbody>
      </table>
      
      <div style="text-align: right; font-weight: bold; font-size: 18px; margin-top: 20px;">
        <p>合計金額: ¥${order.total_amount.toLocaleString()}</p>
        ${order.points_used > 0 ? `<p>使用ポイント: -${order.points_used}pt</p>` : ''}
        ${type === 'invoice' ? `<p>支払方法: ${order.payment_method}</p>` : ''}
      </div>
    </div>
  `;
}

