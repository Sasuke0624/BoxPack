import { useState, useEffect } from 'react';
import { 
  Plus, 
  Minus, 
  Edit2, 
  AlertTriangle,
  History,
  X,
  Save
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Material, MaterialThickness } from '../../types/database';

interface Inventory {
  id: string;
  material_id: string;
  thickness_id: string;
  current_stock: number;
  min_stock_level: number;
  unit: string;
  material?: Material;
  thickness?: MaterialThickness;
}

interface InventoryHistory {
  id: string;
  inventory_id: string;
  movement_type: 'in' | 'out' | 'adjustment';
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason?: string;
  notes?: string;
  created_at: string;
}

export function AdminInventory() {
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [thicknesses, setThicknesses] = useState<MaterialThickness[]>([]);
  const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(null);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [history, setHistory] = useState<InventoryHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stockChange, setStockChange] = useState({ quantity: 0, reason: '', notes: '' });
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  useEffect(() => {
    loadMaterials();
  }, []);

  useEffect(() => {
    if (materials.length > 0) {
      loadInventory();
    }
  }, [materials]);

  const loadMaterials = async () => {
    const { data } = await supabase
      .from('materials')
      .select('*')
      .order('sort_order');
    if (data) {
      setMaterials(data);
    }
  };

  const loadInventory = async () => {
    setLoading(true);
    setError(null);

    const { data: inventoryData, error: fetchError } = await supabase
      .from('inventory')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    if (!inventoryData) {
      setLoading(false);
      return;
    }

    // Load materials and thicknesses for each inventory item
    const inventoryWithDetails = await Promise.all(
      inventoryData.map(async (inv) => {
        const { data: material } = await supabase
          .from('materials')
          .select('*')
          .eq('id', inv.material_id)
          .single();

        const { data: thickness } = await supabase
          .from('material_thicknesses')
          .select('*')
          .eq('id', inv.thickness_id)
          .single();

        return {
          ...inv,
          material: material || undefined,
          thickness: thickness || undefined,
        };
      })
    );

    setInventory(inventoryWithDetails);
    setLoading(false);
  };

  const loadHistory = async (inventoryId: string) => {
    const { data, error } = await supabase
      .from('inventory_history')
      .select('*')
      .eq('inventory_id', inventoryId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      setError(error.message);
    } else if (data) {
      setHistory(data);
    }
  };

  const handleStockChange = async (inventoryId: string, movementType: 'in' | 'out' | 'adjustment', quantity: number, reason: string, notes: string) => {
    setLoading(true);
    setError(null);

    const inv = inventory.find(i => i.id === inventoryId);
    if (!inv) {
      setError('在庫情報が見つかりません');
      setLoading(false);
      return;
    }

    const previousStock = inv.current_stock;
    let newStock = previousStock;

    if (movementType === 'in') {
      newStock = previousStock + quantity;
    } else if (movementType === 'out') {
      newStock = Math.max(0, previousStock - quantity);
    } else if (movementType === 'adjustment') {
      newStock = quantity;
    }

    // Update inventory
    const { error: updateError } = await supabase
      .from('inventory')
      .update({
        current_stock: newStock,
        updated_at: new Date().toISOString(),
      })
      .eq('id', inventoryId);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    // Create history record
    const { data: user } = await supabase.auth.getUser();
    console.log('user', user);
    const { error: historyError } = await supabase
      .from('inventory_history')
      .insert({
        inventory_id: inventoryId,
        movement_type: movementType,
        quantity: movementType === 'adjustment' ? newStock - previousStock : quantity,
        previous_stock: previousStock,
        new_stock: newStock,
        reason: reason || null,
        notes: notes || null,
        created_by: user.data.user?.id || null,
      });

    if (historyError) {
      setError(historyError.message);
    } else {
      await loadInventory();
      setShowStockModal(false);
      setStockChange({ quantity: 0, reason: '', notes: '' });
      setSelectedInventory(null);
    }
    setLoading(false);
  };

  const handleCreateInventory = async (materialId: string, thicknessId: string, initialStock: number, minStock: number) => {
    setLoading(true);
    setError(null);

    const { error } = await supabase
      .from('inventory')
      .insert({
        material_id: materialId,
        thickness_id: thicknessId,
        current_stock: initialStock,
        min_stock_level: minStock,
      });

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        setError('この材料と厚みの組み合わせは既に登録されています');
      } else {
        setError(error.message);
      }
    } else {
      await loadInventory();
    }
    setLoading(false);
  };

  const handleUpdateMinStock = async (inventoryId: string, minStock: number) => {
    setLoading(true);
    setError(null);

    const { error } = await supabase
      .from('inventory')
      .update({
        min_stock_level: minStock,
        updated_at: new Date().toISOString(),
      })
      .eq('id', inventoryId);

    if (error) {
      setError(error.message);
    } else {
      await loadInventory();
    }
    setLoading(false);
  };

  const openStockModal = (inv: Inventory, movementType: 'in' | 'out' | 'adjustment') => {
    setSelectedInventory(inv);
    setStockChange({
      quantity: movementType === 'adjustment' ? inv.current_stock : 0,
      reason: '',
      notes: '',
    });
    setShowStockModal(true);
  };

  const openHistoryModal = async (inv: Inventory) => {
    setSelectedInventory(inv);
    setShowHistoryModal(true);
    await loadHistory(inv.id);
  };

  const filteredInventory = showLowStockOnly
    ? inventory.filter(inv => inv.current_stock <= inv.min_stock_level)
    : inventory;

  const lowStockCount = inventory.filter(inv => inv.current_stock <= inv.min_stock_level).length;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">在庫管理</h2>
          {lowStockCount > 0 && (
            <div className="mt-2 flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
              <span className="text-sm font-medium">
                {lowStockCount}件の在庫アラートがあります
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showLowStockOnly}
              onChange={(e) => setShowLowStockOnly(e.target.checked)}
              className="h-4 w-4 text-amber-600 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">在庫不足のみ表示</span>
          </label>
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
                  材料
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  厚み
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  現在在庫
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  最低在庫
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状態
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && inventory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    読み込み中...
                  </td>
                </tr>
              ) : filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    {showLowStockOnly ? '在庫不足のアイテムはありません' : '在庫が登録されていません'}
                  </td>
                </tr>
              ) : (
                filteredInventory.map((inv) => {
                  const isLowStock = inv.current_stock <= inv.min_stock_level;
                  return (
                    <tr key={inv.id} className={isLowStock ? 'bg-red-50' : 'hover:bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {inv.material?.name || '不明'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {inv.thickness?.thickness_mm || '不明'}mm
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {inv.current_stock} {inv.unit || '枚'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            value={inv.min_stock_level}
                            onChange={(e) => {
                              const newMin = parseInt(e.target.value) || 0;
                              handleUpdateMinStock(inv.id, newMin);
                            }}
                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          />
                          <span className="text-sm text-gray-500">{inv.unit || '枚'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isLowStock ? (
                          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3" />
                            在庫不足
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                            正常
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openStockModal(inv, 'in')}
                            className="text-green-600 hover:text-green-900"
                            title="入庫"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openStockModal(inv, 'out')}
                            className="text-orange-600 hover:text-orange-900"
                            title="出庫"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openStockModal(inv, 'adjustment')}
                            className="text-blue-600 hover:text-blue-900"
                            title="調整"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openHistoryModal(inv)}
                            className="text-gray-600 hover:text-gray-900"
                            title="履歴"
                          >
                            <History className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Change Modal */}
      {showStockModal && selectedInventory && (
        <StockChangeModal
          inventory={selectedInventory}
          movementType={stockChange.quantity === selectedInventory.current_stock ? 'adjustment' : 'in'}
          quantity={stockChange.quantity}
          reason={stockChange.reason}
          notes={stockChange.notes}
          onQuantityChange={(q) => setStockChange({ ...stockChange, quantity: q })}
          onReasonChange={(r) => setStockChange({ ...stockChange, reason: r })}
          onNotesChange={(n) => setStockChange({ ...stockChange, notes: n })}
          onClose={() => {
            setShowStockModal(false);
            setSelectedInventory(null);
            setStockChange({ quantity: 0, reason: '', notes: '' });
          }}
          onSave={(type, qty, reason, notes) => {
            if (selectedInventory) {
              handleStockChange(selectedInventory.id, type, qty, reason, notes);
            }
          }}
          loading={loading}
        />
      )}

      {/* History Modal */}
      {showHistoryModal && selectedInventory && (
        <HistoryModal
          inventory={selectedInventory}
          history={history}
          onClose={() => {
            setShowHistoryModal(false);
            setSelectedInventory(null);
            setHistory([]);
          }}
        />
      )}
    </div>
  );
}

interface StockChangeModalProps {
  inventory: Inventory;
  movementType: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  notes: string;
  onQuantityChange: (q: number) => void;
  onReasonChange: (r: string) => void;
  onNotesChange: (n: string) => void;
  onClose: () => void;
  onSave: (type: 'in' | 'out' | 'adjustment', qty: number, reason: string, notes: string) => void;
  loading: boolean;
}

function StockChangeModal({
  inventory,
  movementType,
  quantity,
  reason,
  notes,
  onQuantityChange,
  onReasonChange,
  onNotesChange,
  onClose,
  onSave,
  loading,
}: StockChangeModalProps) {
  const [type, setType] = useState<'in' | 'out' | 'adjustment'>(movementType);

  const getTitle = () => {
    if (type === 'in') return '入庫';
    if (type === 'out') return '出庫';
    return '在庫調整';
  };

  const handleSave = () => {
    if (type === 'adjustment') {
      onSave(type, quantity, reason, notes);
    } else if (quantity > 0) {
      onSave(type, quantity, reason, notes);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900">
            {getTitle()} - {inventory.material?.name} {inventory.thickness?.thickness_mm}mm
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              操作タイプ
            </label>
            <select
              value={type}
              onChange={(e) => {
                const newType = e.target.value as 'in' | 'out' | 'adjustment';
                setType(newType);
                if (newType === 'adjustment') {
                  onQuantityChange(inventory.current_stock);
                } else {
                  onQuantityChange(0);
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="in">入庫</option>
              <option value="out">出庫</option>
              <option value="adjustment">在庫調整</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {type === 'adjustment' ? '在庫数' : type === 'in' ? '入庫数量' : '出庫数量'} <span className="text-red-600">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => onQuantityChange(parseInt(e.target.value) || 0)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                required
              />
              <span className="text-gray-600">{inventory.unit || '枚'}</span>
            </div>
            {type !== 'adjustment' && (
              <p className="mt-1 text-xs text-gray-500">
                現在在庫: {inventory.current_stock} {inventory.unit || '枚'}
                {type === 'out' && ` → 更新後: ${Math.max(0, inventory.current_stock - quantity)} ${inventory.unit || '枚'}`}
                {type === 'in' && ` → 更新後: ${inventory.current_stock + quantity} ${inventory.unit || '枚'}`}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              理由
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="例: 入荷、出荷、棚卸など"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              備考
            </label>
            <textarea
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              rows={3}
              placeholder="追加情報があれば記入してください"
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
              onClick={handleSave}
              disabled={loading || quantity < 0 || (type !== 'adjustment' && quantity === 0)}
              className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
              {loading ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface HistoryModalProps {
  inventory: Inventory;
  history: InventoryHistory[];
  onClose: () => void;
}

function HistoryModal({ inventory, history, onClose }: HistoryModalProps) {
  const getMovementTypeLabel = (type: string) => {
    const labels = {
      in: '入庫',
      out: '出庫',
      adjustment: '調整',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getMovementTypeColor = (type: string) => {
    const colors = {
      in: 'bg-green-100 text-green-800',
      out: 'bg-orange-100 text-orange-800',
      adjustment: 'bg-blue-100 text-blue-800',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900">
            在庫履歴 - {inventory.material?.name} {inventory.thickness?.thickness_mm}mm
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>
        <div className="p-6">
          {history.length === 0 ? (
            <div className="text-center text-gray-500 py-8">履歴がありません</div>
          ) : (
            <div className="space-y-4">
              {history.map((h) => (
                <div key={h.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${getMovementTypeColor(h.movement_type)}`}>
                        {getMovementTypeLabel(h.movement_type)}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        数量: {h.quantity > 0 ? '+' : ''}{h.quantity} {inventory.unit || '枚'}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(h.created_at).toLocaleString('ja-JP')}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>在庫: {h.previous_stock} → {h.new_stock} {inventory.unit || '枚'}</p>
                    {h.reason && <p className="mt-1">理由: {h.reason}</p>}
                    {h.notes && <p className="mt-1">備考: {h.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

