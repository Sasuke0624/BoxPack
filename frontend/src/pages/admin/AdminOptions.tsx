import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, X } from 'lucide-react';
import { optionsApi } from '../../lib/api';
import { Option } from '../../types/database';

export function AdminOptions() {
  const [options, setOptions] = useState<Option[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingOption, setEditingOption] = useState<Option | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    setLoading(true);
    const { data, error } = await optionsApi.getAll();
    if (error) {
      setError(error);
    } else if (data) {
      setOptions(data.options);
    }
    setLoading(false);
  };

  const handleAdd = () => {
    setEditingOption(null);
    setShowModal(true);
  };

  const handleEdit = (option: Option) => {
    setEditingOption(option);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('このオプションを削除しますか？')) {
      return;
    }

    setLoading(true);
    setError(null);
    
    const { error } = await optionsApi.delete(id);

    if (error) {
      setError(error);
    } else {
      await loadOptions();
    }
    setLoading(false);
  };

  const handleSave = async (data: Partial<Option>) => {
    setLoading(true);
    setError(null);

    if (editingOption) {
      // Update
      const { error } = await optionsApi.update(editingOption.id, data);

      if (error) {
        setError(error);
      } else {
        await loadOptions();
        setShowModal(false);
        setEditingOption(null);
      }
    } else {
      // Insert
      const maxSort = options.length > 0 
        ? Math.max(...options.map(o => o.sort_order)) 
        : 0;

      const { error } = await optionsApi.create({
        ...data,
        sort_order: maxSort + 1,
        is_active: data.is_active ?? true,
      });

      if (error) {
        setError(error);
      } else {
        await loadOptions();
        setShowModal(false);
      }
    }
    setLoading(false);
  };

  return (
    <div className='overflow-auto'>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900">オプション管理</h2>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          新規追加
        </button>
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
                  オプション名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  タイプ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  価格
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  単位
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
              {loading && options.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    読み込み中...
                  </td>
                </tr>
              ) : options.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    オプションが登録されていません
                  </td>
                </tr>
              ) : (
                options.map((option) => (
                  <tr key={option.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{option.name}</div>
                      <div className="text-sm text-gray-500">{option.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        {option.option_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ¥{option.price.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {option.unit || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        option.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {option.is_active ? '有効' : '無効'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(option)}
                          className="text-amber-600 hover:text-amber-900"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(option.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {showModal && (
        <OptionModal
          option={editingOption}
          onClose={() => {
            setShowModal(false);
            setEditingOption(null);
          }}
          onSave={handleSave}
          loading={loading}
        />
      )}
    </div>
  );
}

interface OptionModalProps {
  option: Option | null;
  onClose: () => void;
  onSave: (data: Partial<Option>) => Promise<void>;
  loading: boolean;
}

function OptionModal({ option, onClose, onSave, loading }: OptionModalProps) {
  const [formData, setFormData] = useState({
    name: option?.name || '',
    description: option?.description || '',
    price: option?.price || 0,
    option_type: option?.option_type || 'handle' as Option['option_type'],
    unit: option?.unit || '個',
    is_active: option?.is_active ?? true,
    sort_order: option?.sort_order || 0,
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
            {option ? 'オプションを編集' : '新規オプションを追加'}
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
              オプション名 <span className="text-red-600">*</span>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                価格 <span className="text-red-600">*</span>
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
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                単位
              </label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="個、セットなど"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                オプションタイプ <span className="text-red-600">*</span>
              </label>
              <select
                value={formData.option_type}
                onChange={(e) => setFormData({ ...formData, option_type: e.target.value as Option['option_type'] })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                required
              >
                <option value="handle">ハンドル</option>
                <option value="buckle">バックル</option>
                <option value="reinforcement">補強板</option>
                <option value="express">即納</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                表示順序
              </label>
              <input
                type="number"
                min="0"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="mr-2 h-4 w-4 text-amber-600 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">有効</span>
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

