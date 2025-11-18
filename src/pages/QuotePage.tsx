import { useState, useEffect } from 'react';
import { AlertCircle, Calculator, ShoppingCart, Download, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Material, MaterialThickness, Option, SelectedOption } from '../types/database';
import { calculatePrice, validateDimensions } from '../utils/priceCalculator';
import { useCart } from '../contexts/CartContext';

interface QuotePageProps {
  onNavigate: (page: string) => void;
}

export function QuotePage({ onNavigate }: QuotePageProps) {
  const [width, setWidth] = useState('');
  const [depth, setDepth] = useState('');
  const [height, setHeight] = useState('');
  const [quantity, setQuantity] = useState(1);

  const [thicknesses, setThicknesses] = useState<MaterialThickness[]>([]);
  const [options, setOptions] = useState<Option[]>([]);

  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [selectedThickness, setSelectedThickness] = useState<MaterialThickness | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<SelectedOption[]>([]);
  const [selectedOptionDropdown, setSelectedOptionDropdown] = useState<string>('');

  const [error, setError] = useState<string | null>(null);

  const { addToCart } = useCart();

  useEffect(() => {
    loadOptions();
  }, []);

  useEffect(() => {
    if (selectedMaterial) {
      loadThicknesses(selectedMaterial.id);
    }
  }, [selectedMaterial]);

  const loadThicknesses = async (materialId: string) => {
    const { data } = await supabase
      .from('material_thicknesses')
      .select('*')
      .eq('material_id', materialId)
      .eq('is_available', true)
      .order('thickness_mm');
    if (data) {
      setThicknesses(data);
      if (data.length > 0) {
        setSelectedThickness(data[0]);
      }
    }
  };

  const loadOptions = async () => {
    const { data } = await supabase
      .from('options')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
    if (data) {
      setOptions(data);
    }
  };

  const addOption = () => {
    if (!selectedOptionDropdown) {
      setError('オプションを選択してください');
      return;
    }

    const option = options.find(o => o.id === selectedOptionDropdown);
    if (!option) return;

    const existingIndex = selectedOptions.findIndex(o => o.option.id === option.id);
    if (existingIndex >= 0) {
      const updated = [...selectedOptions];
      updated[existingIndex].quantity += 1;
      setSelectedOptions(updated);
    } else {
      setSelectedOptions([...selectedOptions, { option, quantity: 1 }]);
    }
    setSelectedOptionDropdown('');
    setError(null);
  };

  const updateOptionQuantity = (optionId: string, quantity: number) => {
    if (quantity <= 0) {
      removeOption(optionId);
      return;
    }
    setSelectedOptions(
      selectedOptions.map(o =>
        o.option.id === optionId ? { ...o, quantity } : o
      )
    );
  };

  const updateFittingDistance = (optionId: string, distance: number) => {
    setSelectedOptions(
      selectedOptions.map(o =>
        o.option.id === optionId ? { ...o, fittingDistance: distance } : o
      )
    );
  };

  const removeOption = (optionId: string) => {
    setSelectedOptions(selectedOptions.filter(o => o.option.id !== optionId));
  };

  const calculation = () => {
    const w = parseInt(width);
    const d = parseInt(depth);
    const h = parseInt(height);

    if (!selectedMaterial || !selectedThickness || !w || !d || !h) {
      return null;
    }

    return calculatePrice(w, d, h, selectedMaterial, selectedThickness, selectedOptions, quantity);
  };

  const handleAddToCart = () => {
    const w = parseInt(width);
    const d = parseInt(depth);
    const h = parseInt(height);

    const validationError = validateDimensions(w, d, h);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!selectedMaterial || !selectedThickness) {
      setError('材料と厚みを選択してください');
      return;
    }

    const calc = calculation();
    if (!calc) return;

    addToCart({
      width_mm: w,
      depth_mm: d,
      height_mm: h,
      material: selectedMaterial,
      thickness: selectedThickness,
      selectedOptions,
      quantity,
      totalPrice: calc.totalPrice,
    });

    onNavigate('cart');
  };

  const calc = calculation();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">見積もり作成</h1>
          <p className="text-lg text-gray-600">
            サイズを入力するだけで、すぐに価格が表示されます
          </p>
        </div>

        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Calculator className="w-6 h-6 mr-2" />
                サイズ入力（内寸）
              </h2>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-900">
                  <strong>重要:</strong> 入力するのは内寸（製品を入れるスペース）です。
                  外寸で入力すると、製品が入らなくなる可能性があります。
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    幅（mm）
                  </label>
                  <input
                    type="number"
                    value={width}
                    onChange={(e) => {
                      setWidth(e.target.value);
                      setError(null);
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="例: 500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    奥行（mm）
                  </label>
                  <input
                    type="number"
                    value={depth}
                    onChange={(e) => {
                      setDepth(e.target.value);
                      setError(null);
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="例: 400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    高さ（mm）
                  </label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => {
                      setHeight(e.target.value);
                      setError(null);
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="例: 300"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  数量
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">板厚選択</h2>

              {selectedMaterial ? (
                <div>
                  <p className="text-sm text-gray-600 mb-3">
                    選択済み: <strong>{selectedMaterial.name}</strong>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {thicknesses.map((thickness) => (
                      <button
                        key={thickness.id}
                        onClick={() => setSelectedThickness(thickness)}
                        className={`px-6 py-3 border-2 rounded-lg font-medium transition-all ${
                          selectedThickness?.id === thickness.id
                            ? 'border-gray-900 bg-amber-600 text-white'
                            : 'border-gray-300 text-gray-700 hover:border-gray-900'
                        }`}
                      >
                        {thickness.thickness_mm}mm
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">先にホームページから板材を選択してください</p>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">オプション</h2>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <select
                    value={selectedOptionDropdown}
                    onChange={(e) => setSelectedOptionDropdown(e.target.value)}
                    className="flex-grow px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  >
                    <option value="">オプションを選択...</option>
                    {options.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name} {option.option_type !== 'express' && `(¥${option.price})`}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={addOption}
                    className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all flex items-center"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                {selectedOptions.length > 0 && (
                  <div className="space-y-3 mt-4 pt-4 border-t border-gray-200">
                    {selectedOptions.map((selected) => (
                      <div key={selected.option.id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-bold text-gray-900">{selected.option.name}</h3>
                            <p className="text-sm text-gray-600">{selected.option.description}</p>
                          </div>
                          <button
                            onClick={() => removeOption(selected.option.id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <label className="text-sm font-medium text-gray-700">
                              数量:
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={selected.quantity}
                              onChange={(e) =>
                                updateOptionQuantity(
                                  selected.option.id,
                                  Math.max(1, parseInt(e.target.value) || 1)
                                )
                              }
                              className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                            />
                          </div>

                          {selected.option.option_type === 'buckle' && (
                            <div className="flex items-center gap-3">
                              <label className="text-sm font-medium text-gray-700">
                                端から距離（mm）:
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={selected.fittingDistance || ''}
                                onChange={(e) =>
                                  updateFittingDistance(
                                    selected.option.id,
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                                placeholder="50"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-8 sticky top-24">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">見積もり</h2>

              {calc ? (
                <div className="space-y-4">
                  <div className="flex justify-between text-gray-600">
                    <span>材料費</span>
                    <span>¥{calc.materialCost.toLocaleString()}</span>
                  </div>
                  {calc.optionsCost > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>オプション</span>
                      <span>¥{calc.optionsCost.toLocaleString()}</span>
                    </div>
                  )}
                  {calc.expressCharge > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>即納料金</span>
                      <span>¥{calc.expressCharge.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="pt-4 border-t-2 border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900">合計金額</span>
                      <span className="text-2xl font-bold text-gray-900">
                        ¥{calc.totalPrice.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-200 space-y-4">
                    <button
                      onClick={handleAddToCart}
                      className="w-full flex items-center justify-center px-6 py-4 text-lg font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-all"
                    >
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      カートに追加
                    </button>

                    <button className="w-full flex items-center justify-center px-6 py-4 text-lg font-medium text-gray-900 bg-white border-2 border-gray-900 rounded-lg hover:bg-gray-50 transition-all">
                      <Download className="w-5 h-5 mr-2" />
                      PDF見積書
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  サイズを入力すると見積もりが表示されます
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
