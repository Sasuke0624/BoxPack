import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Settings, 
  ShoppingCart, 
  Users, 
  FileText, 
  Box,
  Percent,
  LogOut,
  Menu,
  X,
  LineChart
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProtectedRoute } from '../hooks/useProtectedRoute';
import { supabase } from '../lib/supabase';
import { Material, MaterialThickness } from '../types/database';
import { AdminOptions } from './admin/AdminOptions';
import { AdminPricing } from './admin/AdminPricing';
import { AdminOrders } from './admin/AdminOrders';
import { AdminInventory } from './admin/AdminInventory';
import { AdminUsers } from './admin/AdminUsers';
import { AdminLegal } from './admin/AdminLegal';
import { AdminDocuments } from './admin/AdminDocuments';

interface AdminPageProps {
  onNavigate: (page: string) => void;
}

type AdminSection = 
  | 'dashboard' 
  | 'materials' 
  | 'options' 
  | 'pricing' 
  | 'orders' 
  | 'inventory' 
  | 'users' 
  | 'legal' 
  | 'documents';

interface AdminMenuItem {
  id: AdminSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const menuItems: AdminMenuItem[] = [
  { id: 'dashboard', label: '統計', icon: LineChart },
  { id: 'materials', label: '板材管理', icon: Package },
  { id: 'options', label: 'オプション管理', icon: Settings },
  { id: 'pricing', label: '価格設定', icon: Percent },
  { id: 'orders', label: '注文管理', icon: ShoppingCart },
  { id: 'inventory', label: '在庫管理', icon: Box },
  { id: 'users', label: 'ユーザー管理', icon: Users },
  { id: 'legal', label: '利用規約管理', icon: FileText },
  { id: 'documents', label: '書類管理', icon: FileText },
];

export function AdminPage({ onNavigate }: AdminPageProps) {
  const [currentSection, setCurrentSection] = useState<AdminSection>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { signOut, profile } = useAuth();

  // Protect route - only admins can access
  const { loading } = useProtectedRoute(() => {
    onNavigate('home');
  }, 'admin');

  const handleSignOut = async () => {
    await signOut();
    onNavigate('home');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  // Check if user is admin
  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">アクセス拒否</h1>
          <p className="text-gray-600 mb-6">管理者権限が必要です。</p>
          <button
            onClick={() => onNavigate('home')}
            className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  const renderSection = () => {
    switch (currentSection) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'materials':
        return <AdminMaterials />;
      case 'options':
        return <AdminOptions />;
      case 'pricing':
        return <AdminPricing />;
      case 'orders':
        return <AdminOrders />;
      case 'inventory':
        return <AdminInventory />;
      case 'users':
        return <AdminUsers />;
      case 'legal':
        return <AdminLegal />;
      case 'documents':
        return <AdminDocuments />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } bg-gray-900 text-white transition-all duration-300 overflow-hidden fixed lg:static lg:translate-x-0 h-screen z-40`}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold">BOXPACK 管理</h1>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => setCurrentSection(item.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        currentSection === item.id
                          ? 'bg-amber-600 text-white'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="p-4 border-t border-gray-800">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>ログアウト</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="max-h-[100vh] flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-4 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-600 hover:text-gray-900"
              >
                <Menu className="w-6 h-6" />
              </button>
              <button
                onClick={() => onNavigate('dashboard')}
                className='flex items-center gap-2 px-4 py-2 rounded-lg transition-colors bg-red-500 text-white hover:bg-red-400'
              >
                <LayoutDashboard className="w-5 h-5" />
                <span className="font-medium">ダッシュボード</span>
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {profile?.full_name || profile?.email}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {renderSection()}
        </main>
      </div>
    </div>
  );
}

// Placeholder components for each section - will be implemented in next steps
function AdminDashboard() {
  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-6">統計</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">今日の注文</h3>
          <p className="text-2xl font-bold text-gray-900">0</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">今月の売上</h3>
          <p className="text-2xl font-bold text-gray-900">¥0</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">未承認注文</h3>
          <p className="text-2xl font-bold text-gray-900">0</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">在庫アラート</h3>
          <p className="text-2xl font-bold text-gray-900">0</p>
        </div>
      </div>
    </div>
  );
}

function AdminMaterials() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [thicknesses, setThicknesses] = useState<MaterialThickness[]>([]);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showThicknessModal, setShowThicknessModal] = useState(false);
  const [editingThickness, setEditingThickness] = useState<MaterialThickness | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMaterials();
  }, []);

  useEffect(() => {
    if (selectedMaterial) {
      loadThicknesses(selectedMaterial.id);
    }
  }, [selectedMaterial]);

  const loadMaterials = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .order('sort_order');
    if (error) {
      setError(error.message);
    } else if (data) {
      setMaterials(data);
    }
    setLoading(false);
  };

  const loadThicknesses = async (materialId: string) => {
    const { data, error } = await supabase
      .from('material_thicknesses')
      .select('*')
      .eq('material_id', materialId)
      .order('thickness_mm');
    if (error) {
      setError(error.message);
    } else if (data) {
      setThicknesses(data);
    }
  };

  const handleAddMaterial = async (materialData: Partial<Material>) => {
    setLoading(true);
    setError(null);
    
    // Get max sort_order
    const maxSort = materials.length > 0 
      ? Math.max(...materials.map(m => m.sort_order)) 
      : 0;

    const { data, error } = await supabase
      .from('materials')
      .insert([{
        ...materialData,
        sort_order: maxSort + 1,
        is_active: materialData.is_active ?? true,
      }])
      .select()
      .single();

    if (error) {
      setError(error.message);
    } else if (data) {
      await loadMaterials();
      setShowMaterialModal(false);
    }
    setLoading(false);
  };

  const handleUpdateMaterial = async (id: string, materialData: Partial<Material>) => {
    setLoading(true);
    setError(null);
    
    const { error } = await supabase
      .from('materials')
      .update(materialData)
      .eq('id', id);

    if (error) {
      setError(error.message);
    } else {
      await loadMaterials();
      setShowMaterialModal(false);
    }
    setLoading(false);
  };

  const handleDeleteMaterial = async (id: string) => {
    if (!confirm('この板材を削除しますか？関連する厚み設定も削除されます。')) {
      return;
    }

    setLoading(true);
    setError(null);
    
    const { error } = await supabase
      .from('materials')
      .delete()
      .eq('id', id);

    if (error) {
      setError(error.message);
    } else {
      await loadMaterials();
      if (selectedMaterial?.id === id) {
        setSelectedMaterial(null);
      }
    }
    setLoading(false);
  };

  const handleAddThickness = async (thicknessData: Partial<MaterialThickness>) => {
    if (!selectedMaterial) return;

    setLoading(true);
    setError(null);
    
    const { data, error } = await supabase
      .from('material_thicknesses')
      .insert([{
        ...thicknessData,
        material_id: selectedMaterial.id,
        is_available: thicknessData.is_available ?? true,
      }])
      .select()
      .single();

    if (error) {
      setError(error.message);
    } else if (data) {
      await loadThicknesses(selectedMaterial.id);
      setShowThicknessModal(false);
      setEditingThickness(null);
    }
    setLoading(false);
  };

  const handleUpdateThickness = async (id: string, thicknessData: Partial<MaterialThickness>) => {
    setLoading(true);
    setError(null);
    
    const { error } = await supabase
      .from('material_thicknesses')
      .update(thicknessData)
      .eq('id', id);

    if (error) {
      setError(error.message);
    } else {
      if (selectedMaterial) {
        await loadThicknesses(selectedMaterial.id);
      }
      setShowThicknessModal(false);
      setEditingThickness(null);
    }
    setLoading(false);
  };

  const handleDeleteThickness = async (id: string) => {
    if (!confirm('この厚み設定を削除しますか？')) {
      return;
    }

    setLoading(true);
    setError(null);
    
    const { error } = await supabase
      .from('material_thicknesses')
      .delete()
      .eq('id', id);

    if (error) {
      setError(error.message);
    } else {
      if (selectedMaterial) {
        await loadThicknesses(selectedMaterial.id);
      }
    }
    setLoading(false);
  };

  return (
    <div className='overflow-auto'>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900">板材管理</h2>
        <button
          onClick={() => {
            setSelectedMaterial(null);
            setShowMaterialModal(true);
          }}
          className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
        >
          新規追加
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Materials List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">板材一覧</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {loading && materials.length === 0 ? (
              <div className="p-6 text-center text-gray-500">読み込み中...</div>
            ) : materials.length === 0 ? (
              <div className="p-6 text-center text-gray-500">板材が登録されていません</div>
            ) : (
              materials.map((material) => (
                <div
                  key={material.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedMaterial?.id === material.id ? 'bg-amber-50' : ''
                  }`}
                  onClick={() => setSelectedMaterial(material)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-900">{material.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{material.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>基本単価: ¥{material.base_price.toLocaleString()}/mm</span>
                        <span className={`px-2 py-1 rounded ${material.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {material.is_active ? '有効' : '無効'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMaterial(material);
                          setShowMaterialModal(true);
                        }}
                        className="px-3 py-1 text-sm text-amber-600 hover:bg-amber-50 rounded"
                      >
                        編集
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMaterial(material.id);
                        }}
                        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Thicknesses List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              {selectedMaterial ? `${selectedMaterial.name} - 厚み設定` : '厚み設定'}
            </h3>
            {selectedMaterial && (
              <button
                onClick={() => {
                  setEditingThickness(null);
                  setShowThicknessModal(true);
                }}
                className="px-3 py-1 text-sm bg-amber-600 text-white rounded hover:bg-amber-700"
              >
                追加
              </button>
            )}
          </div>
          {selectedMaterial ? (
            <div className="divide-y divide-gray-200">
              {thicknesses.length === 0 ? (
                <div className="p-6 text-center text-gray-500">厚み設定がありません</div>
              ) : (
                thicknesses.map((thickness) => (
                  <div key={thickness.id} className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-semibold text-gray-900">{thickness.thickness_mm}mm</span>
                        <span className="ml-4 text-sm text-gray-600">
                          価格乗数: {thickness.price_multiplier}x
                        </span>
                        <span className={`ml-4 px-2 py-1 rounded text-xs ${
                          thickness.is_available ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {thickness.is_available ? '利用可能' : '利用不可'}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingThickness(thickness);
                            setShowThicknessModal(true);
                          }}
                          className="px-3 py-1 text-sm text-amber-600 hover:bg-amber-50 rounded"
                        >
                          編集
                        </button>
                        <button
                          onClick={() => handleDeleteThickness(thickness.id)}
                          className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              左側から板材を選択してください
            </div>
          )}
        </div>
      </div>

      {/* Material Modal */}
      {showMaterialModal && (
        <MaterialModal
          material={selectedMaterial}
          onClose={() => {
            setShowMaterialModal(false);
            setSelectedMaterial(null);
          }}
          onSave={selectedMaterial 
            ? (data) => handleUpdateMaterial(selectedMaterial.id, data)
            : handleAddMaterial
          }
          loading={loading}
        />
      )}

      {/* Thickness Modal */}
      {showThicknessModal && selectedMaterial && (
        <ThicknessModal
          material={selectedMaterial}
          thickness={editingThickness}
          onClose={() => {
            setShowThicknessModal(false);
            setEditingThickness(null);
          }}
          onSave={editingThickness
            ? (data) => handleUpdateThickness(editingThickness.id, data)
            : handleAddThickness
          }
          loading={loading}
        />
      )}
    </div>
  );
}






// Material Modal Component
interface MaterialModalProps {
  material: Material | null;
  onClose: () => void;
  onSave: (data: Partial<Material>) => Promise<void>;
  loading: boolean;
}

function MaterialModal({ material, onClose, onSave, loading }: MaterialModalProps) {
  const [formData, setFormData] = useState({
    name: material?.name || '',
    description: material?.description || '',
    image_url: material?.image_url || '',
    base_price: material?.base_price || 0,
    is_active: material?.is_active ?? true,
    sort_order: material?.sort_order || 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900">
            {material ? '板材を編集' : '新規板材を追加'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              板材名 <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              説明
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              画像URL
            </label>
            <input
              type="text"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="./src/img/material/1.jpg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              基本単価 (mm単位) <span className="text-red-600">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.base_price}
              onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              required
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="mr-2 h-4 w-4 text-amber-600 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">有効</span>
            </label>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                表示順序
              </label>
              <input
                type="number"
                min="0"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
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
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
            >
              {loading ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Thickness Modal Component
interface ThicknessModalProps {
  material: Material;
  thickness: MaterialThickness | null;
  onClose: () => void;
  onSave: (data: Partial<MaterialThickness>) => Promise<void>;
  loading: boolean;
}

function ThicknessModal({ material, thickness, onClose, onSave, loading }: ThicknessModalProps) {
  const [formData, setFormData] = useState({
    thickness_mm: thickness?.thickness_mm || 0,
    price_multiplier: thickness?.price_multiplier || 1.0,
    is_available: thickness?.is_available ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900">
            {thickness ? '厚みを編集' : '新規厚みを追加'} - {material.name}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              厚み (mm) <span className="text-red-600">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={formData.thickness_mm}
              onChange={(e) => setFormData({ ...formData, thickness_mm: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              価格乗数 <span className="text-red-600">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.price_multiplier}
              onChange={(e) => setFormData({ ...formData, price_multiplier: parseFloat(e.target.value) || 1.0 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              基本単価 ({material.base_price}/mm) × 価格乗数 = 実際の価格
            </p>
          </div>
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_available}
                onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                className="mr-2 h-4 w-4 text-amber-600 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">利用可能</span>
            </label>
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
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
            >
              {loading ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

