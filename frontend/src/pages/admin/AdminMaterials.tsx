import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Material, MaterialThickness } from '../../types/database';
import { materialsApi } from '../../lib/api';

// Material Modal Component
interface MaterialModalProps {
  material: Material | null;
  onClose: () => void;
  onSave: (data: Partial<Material>) => Promise<void>;
  loading: boolean;
}

// Thickness Modal Component
interface ThicknessModalProps {
    material: Material;
    thickness: MaterialThickness | null;
    onClose: () => void;
    onSave: (data: Partial<MaterialThickness>) => Promise<void>;
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

function ThicknessModal({ material, thickness, onClose, onSave, loading }: ThicknessModalProps) {
    const [formData, setFormData] = useState({
      thickness_mm: thickness?.thickness_mm || 0,
      price: thickness?.price || 0,
      size: thickness?.size ?? 0,
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
                価格 (円/mm) <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                この材料の厚みごとの直接価格 (円/mm)
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                板材サイズ <span className="text-red-600">*</span>
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="0"
                    checked={formData.size === 0}
                    onChange={(e) => setFormData({ ...formData, size: parseInt(e.target.value) })}
                    className="mr-2 h-4 w-4 text-amber-600 border-gray-300 focus:ring-amber-500"
                  />
                  <span className="text-sm text-gray-700">3×6 (910×1820mm)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="1"
                    checked={formData.size === 1}
                    onChange={(e) => setFormData({ ...formData, size: parseInt(e.target.value) })}
                    className="mr-2 h-4 w-4 text-amber-600 border-gray-300 focus:ring-amber-500"
                  />
                  <span className="text-sm text-gray-700">4×8 (1220×2440mm)</span>
                </label>
              </div>
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

export function AdminMaterials() {
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
      const { data, error } = await materialsApi.getAll();
      if (error) {
        setError(error);
      } else if (data) {
        setMaterials(data.materials);
      }
      setLoading(false);
    };
  
    const loadThicknesses = async (materialId: string) => {
      const { data, error } = await materialsApi.getThicknesses(materialId);
      if (error) {
        setError(error);
      } else if (data) {
        setThicknesses(data.thicknesses);
      }
    };
  
    const handleAddMaterial = async (materialData: Partial<Material>) => {
      setLoading(true);
      setError(null);
      
      // Get max sort_order
      const maxSort = materials.length > 0 
        ? Math.max(...materials.map(m => m.sort_order)) 
        : 0;
  
      const { data, error } = await materialsApi.create({
        ...materialData,
        sort_order: maxSort + 1,
        is_active: materialData.is_active ?? true,
      });
  
      if (error) {
        setError(error);
      } else if (data) {
        await loadMaterials();
        setShowMaterialModal(false);
      }
      setLoading(false);
    };
  
    const handleUpdateMaterial = async (id: string, materialData: Partial<Material>) => {
      setLoading(true);
      setError(null);
      
      const { error } = await materialsApi.update(id, materialData);
  
      if (error) {
        setError(error);
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
      
      const { error } = await materialsApi.delete(id);
  
      if (error) {
        setError(error);
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
      
      const { data, error } = await materialsApi.createThickness(selectedMaterial.id, {
        ...thicknessData,
        is_available: thicknessData.is_available ?? true,
      });
  
      if (error) {
        setError(error);
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
      
      const { error } = await materialsApi.updateThickness(id, thicknessData);
  
      if (error) {
        setError(error);
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
      
      const { error } = await materialsApi.deleteThickness(id);
  
      if (error) {
        setError(error);
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
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMaterial(material);
                            setShowMaterialModal(true);
                          }}
                          className="px-3 py-1 text-sm text-amber-600 hover:bg-amber-50 rounded w-[52px]"
                        >
                          編集
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMaterial(material.id);
                          }}
                          className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded w-[52px]"
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
                            ¥{thickness.price}/mm
                          </span>
                          <span className="ml-4 px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                            {thickness.size === 0 ? '3×6' : '4×8'}
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
                            className="px-3 py-1 text-sm text-amber-600 hover:bg-amber-50 rounded w-[52px]"
                          >
                            編集
                          </button>
                          <button
                            onClick={() => handleDeleteThickness(thickness.id)}
                            className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded w-[52px]"
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