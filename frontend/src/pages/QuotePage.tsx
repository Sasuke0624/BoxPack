import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Calculator, ShoppingCart, Download, Plus, Trash2, HelpCircle, X } from 'lucide-react';
import { materialsApi, optionsApi } from '../lib/api';
import { Material, MaterialThickness, Option, SelectedOption } from '../types/database';
import { calculatePrice, validateDimensions } from '../utils/priceCalculator';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

export function QuotePage() {
  const navigate = useNavigate();
  const [width, setWidth] = useState('');
  const [depth, setDepth] = useState('');
  const [height, setHeight] = useState('');
  const [quantity, setQuantity] = useState(1);
  // const [boardSize, setBoardSize] = useState<'3x6' | '4x8'>('3x6');
  const [specialRequests, setSpecialRequests] = useState('');
  const [showFittingImageModal, setShowFittingImageModal] = useState(false);
  const [dimensionWarning, setDimensionWarning] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAddToCart, setPendingAddToCart] = useState<(() => void) | null>(null);

  const [materials, setMaterials] = useState<Material[]>([]);
  const [thicknesses, setThicknesses] = useState<MaterialThickness[]>([]);
  const [options, setOptions] = useState<Option[]>([]);

  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [selectedThickness, setSelectedThickness] = useState<MaterialThickness | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<SelectedOption[]>([]);
  const [selectedOptionDropdown, setSelectedOptionDropdown] = useState<string>('');
  const [expressOption, setExpressOption] = useState<Option | null>(null);
  const [expressSelected, setExpressSelected] = useState(false);
  const handleMaterialChange = (materialId: string) => {
    const material = materials.find((m) => m.id === materialId) || null;
    setSelectedMaterial(material);
    setSelectedThickness(null);
  };


  const [error, setError] = useState<string | null>(null);

  const { addToCart } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    loadMaterials();
    loadOptions();
  }, []);

  useEffect(() => {
    if (selectedMaterial) {
      loadThicknesses(selectedMaterial.id);
    }
  }, [selectedMaterial]);

  // Real-time dimension validation and board size auto-selection
  useEffect(() => {
    const w = parseInt(width) || 0;
    const d = parseInt(depth) || 0;
    const h = parseInt(height) || 0;

    const isLauan = selectedMaterial?.name === "ラワン合板";

    // Check for dimension warning (>= 2440mm)
    if (isLauan) {
      if(w > 2440 || d > 2440 || h > 2440) {
        setDimensionWarning('ラワン合板の最大サイズは2440mmです。');
        return;
      }

      const countOver1220 = [w, d, h].filter(size => size > 1220).length;
      if(countOver1220 > 1) {
        setDimensionWarning('ラワン合板の場合、一つの次元が1220mm以上の場合、他の二つの次元は1220mm未満である必要があります。');
        return;
      }

      setDimensionWarning(null);
    } else {
      if(w > 1820 || d > 1820 || h > 1820) {
        setDimensionWarning('針葉樹構造用合板とOSB合板の最大サイズは1820mmです。');
        return;
      }

      const countOver910 = [w, d, h].filter(size => size > 910).length;
      if(countOver910 > 1) {
        setDimensionWarning('針葉樹構造用合板とOSB合板の場合、一つの次元が910mm以上の場合、他の二つの次元は910mm未満である必要があります。');
        return;
      }

      setDimensionWarning(null);
    }

    // Auto-select board size based on dimensions
    // if (w > 1820 || d > 1820 || h > 1820) {
    //   setBoardSize('4x8');
    // } else if (w > 0 && d > 0 && h > 0 && w <= 1820 && d <= 1820 && h <= 1820) {
    //   setBoardSize('3x6');
    // }
  }, [width, depth, height, selectedMaterial]);

  // Recalculate fitting positions when dimensions change
  useEffect(() => {
    const w = parseInt(width) || 0;
    const d = parseInt(depth) || 0;
    const h = parseInt(height) || 0;

    if (w > 0 && d > 0 && h > 0) {
      setSelectedOptions(prevOptions =>
        prevOptions.map(o => {
          if (o.option.option_type === 'reinforcement') return o;
          
          const updated = { ...o };
          
          // Recalculate width positions
          if (updated.fittingCountWidth && updated.fittingDistanceWidth !== undefined) {
            updated.fittingPositionsWidth = calculateFittingPositions(
              w,
              updated.fittingDistanceWidth,
              updated.fittingCountWidth
            );
          }
          
          // Recalculate depth positions
          if (updated.fittingCountDepth && updated.fittingDistanceDepth !== undefined) {
            updated.fittingPositionsDepth = calculateFittingPositions(
              d,
              updated.fittingDistanceDepth,
              updated.fittingCountDepth
            );
          }
          
          // Recalculate height positions
          if (updated.fittingCountHeight && updated.fittingDistanceHeight !== undefined) {
            updated.fittingPositionsHeight = calculateFittingPositions(
              h,
              updated.fittingDistanceHeight,
              updated.fittingCountHeight
            );
          }
          
          return updated;
        })
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, depth, height]);

  const loadMaterials = async () => {
    const { data, error } = await materialsApi.getAll(true);
    if (!error && data) {
      setMaterials(data.materials);
      if (!selectedMaterial && data.materials.length > 0) {
        setSelectedMaterial(data.materials[0]);
      }
    }
  };

  const loadThicknesses = async (materialId: string) => {
    const { data, error } = await materialsApi.getThicknesses(materialId, true);
    if (!error && data) {
      // Filter thicknesses based on current board size
      // const filteredThicknesses = data.thicknesses.filter(
      //   (t: MaterialThickness) => t.size === (boardSize === '3x6' ? 0 : 1)
      // );
      setThicknesses(data.thicknesses);
      if (data.thicknesses.length > 0) {
        setSelectedThickness(data.thicknesses[0]);
      } else {
        setSelectedThickness(null);
      }  
    }
  };

  const loadOptions = async () => {
    const { data, error } = await optionsApi.getAll(true);
    if (!error && data) {
      const express = data.options.find((o) => o.option_type === 'express') || null;
      const normalOptions = data.options.filter((o) => o.option_type !== 'express');
      setExpressOption(express);
      setOptions(normalOptions);
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
      // Initialize reinforcement dimensions if it's a reinforcement option
      const newOption: SelectedOption = {
        option,
        quantity: 1,
        ...(option.option_type === 'reinforcement' && {
          reinforcementLength: 0,
          reinforcementWidth: 0,
        }),
      };
      setSelectedOptions([...selectedOptions, newOption]);
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

  const updateReinforcementLength = (optionId: string, length: number) => {
    setSelectedOptions(
      selectedOptions.map(o =>
        o.option.id === optionId ? { ...o, reinforcementLength: length } : o
      )
    );
  };

  const updateReinforcementWidth = (optionId: string, width: number) => {
    setSelectedOptions(
      selectedOptions.map(o =>
        o.option.id === optionId ? { ...o, reinforcementWidth: width } : o
      )
    );
  };

  // Calculate equal spacing positions
  const calculateFittingPositions = (
    dimension: number,
    firstDistance: number,
    count: number
  ): number[] => {
    if (count <= 0 || dimension <= 0 || firstDistance < 0) return [];
    if (count === 1) return [firstDistance];
    
    const remainingSpace = dimension - firstDistance * 2;
    if (remainingSpace <= 0) return [firstDistance];
    
    // Calculate spacing: remaining space divided by (count - 1) because first position is already at firstDistance
    const spacing = remainingSpace / (count - 1);
    const positions: number[] = [];
    for (let i = 0; i < count; i++) {
      positions.push(firstDistance + spacing * i);
    }
    return positions;
  };

  const updateFittingDistance = (
    optionId: string,
    dimension: 'width' | 'depth' | 'height',
    distance: number
  ) => {
    setSelectedOptions(
      selectedOptions.map(o => {
        if (o.option.id !== optionId) return o;
        const w = parseInt(width) || 0;
        const d = parseInt(depth) || 0;
        const h = parseInt(height) || 0;
        
        const updated = { ...o };
        if (dimension === 'width') {
          updated.fittingDistanceWidth = distance;
          if (updated.fittingCountWidth && w > 0) {
            updated.fittingPositionsWidth = calculateFittingPositions(
              w,
              distance,
              updated.fittingCountWidth
            );
          }
        } else if (dimension === 'depth') {
          updated.fittingDistanceDepth = distance;
          if (updated.fittingCountDepth && d > 0) {
            updated.fittingPositionsDepth = calculateFittingPositions(
              d,
              distance,
              updated.fittingCountDepth
            );
          }
        } else if (dimension === 'height') {
          updated.fittingDistanceHeight = distance;
          if (updated.fittingCountHeight && h > 0) {
            updated.fittingPositionsHeight = calculateFittingPositions(
              h,
              distance,
              updated.fittingCountHeight
            );
          }
        }
        return updated;
      })
    );
  };

  const updateFittingCount = (
    optionId: string,
    dimension: 'width' | 'depth' | 'height',
    count: number
  ) => {
    setSelectedOptions(
      selectedOptions.map(o => {
        if (o.option.id !== optionId) return o;
        const w = parseInt(width) || 0;
        const d = parseInt(depth) || 0;
        const h = parseInt(height) || 0;
        
        const updated = { ...o };
        if (dimension === 'width') {
          updated.fittingCountWidth = count;
          if (updated.fittingDistanceWidth !== undefined && w > 0) {
            updated.fittingPositionsWidth = calculateFittingPositions(
              w,
              updated.fittingDistanceWidth,
              count
            );
          } else {
            updated.fittingPositionsWidth = [];
          }
        } else if (dimension === 'depth') {
          updated.fittingCountDepth = count;
          if (updated.fittingDistanceDepth !== undefined && d > 0) {
            updated.fittingPositionsDepth = calculateFittingPositions(
              d,
              updated.fittingDistanceDepth,
              count
            );
          } else {
            updated.fittingPositionsDepth = [];
          }
        } else if (dimension === 'height') {
          updated.fittingCountHeight = count;
          if (updated.fittingDistanceHeight !== undefined && h > 0) {
            updated.fittingPositionsHeight = calculateFittingPositions(
              h,
              updated.fittingDistanceHeight,
              count
            );
          } else {
            updated.fittingPositionsHeight = [];
          }
        }
        return updated;
      })
    );
  };

  const updateFittingPositions = (
    optionId: string,
    dimension: 'width' | 'depth' | 'height',
    positions: number[]
  ) => {
    setSelectedOptions(
      selectedOptions.map(o =>
        o.option.id === optionId
          ? {
              ...o,
              ...(dimension === 'width' && { fittingPositionsWidth: positions }),
              ...(dimension === 'depth' && { fittingPositionsDepth: positions }),
              ...(dimension === 'height' && { fittingPositionsHeight: positions }),
            }
          : o
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

    const allOptions: SelectedOption[] = [...selectedOptions];
    if (expressSelected && expressOption) {
      allOptions.push({ option: expressOption, quantity: 1 });
    }

    return calculatePrice(w, d, h, selectedMaterial, selectedThickness, allOptions, quantity);
  };

  const handleAddToCart = () => {
    // Check if user is logged in
    if (!user) {
      navigate('/login');
      return;
    }

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

    // Validate reinforcement options have dimensions
    const invalidReinforcement = selectedOptions.find(
      o => o.option.option_type === 'reinforcement' && 
      (!o.reinforcementLength || !o.reinforcementWidth || o.reinforcementLength <= 0 || o.reinforcementWidth <= 0)
    );
    if (invalidReinforcement) {
      setError('補強板オプションには長さと幅を入力してください');
      return;
    }

    // Show confirmation modal
    setPendingAddToCart(() => () => {
      const calc = calculation();
      if (!calc) return;

      const allOptionsForCart: SelectedOption[] = [...selectedOptions];
      if (expressSelected && expressOption) {
        allOptionsForCart.push({ option: expressOption, quantity: 1 });
      }

      addToCart({
        width_mm: w,
        depth_mm: d,
        height_mm: h,
        material: selectedMaterial,
        thickness: selectedThickness,
        selectedOptions: allOptionsForCart,
        quantity,
        totalPrice: calc.totalPrice,
      });

      navigate('/cart');
    });
    setShowConfirmModal(true);
  };

  const handleConfirmAddToCart = () => {
    if (pendingAddToCart) {
      pendingAddToCart();
      setPendingAddToCart(null);
      setShowConfirmModal(false);
    }
  };

  const handleCancelAddToCart = () => {
    setPendingAddToCart(null);
    setShowConfirmModal(false);
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
                  <strong>重要:</strong> 入力は内寸法での入力でお願いします。
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

              {/* <div className="mt-6">
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
              </div> */}

              {dimensionWarning && (
                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-yellow-800 text-sm">{dimensionWarning}</p>
                </div>
              )}
{/* 
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  板材サイズ
                  <span className="text-xs text-red-700 ml-2">※一辺が1820mmを超えると、自動的に4×8サイズが選択され、単価が上がります。</span>
                </label>
                <div className="flex gap-4 items-center">
                    <span className={`text-sm text-gray-700 px-2 py-1 rounded-md border-2 ${boardSize === '3x6' ? 'border-amber-600' : 'border-gray-200'}`}>{'3×6 (910×1820mm)'}</span>
                    <span className={`text-sm text-gray-700 px-2 py-1 rounded-md border-2 ${boardSize === '4x8' ? 'border-amber-600' : 'border-gray-200'}`}>{'4×8 (1220×2440mm)'}</span>
                </div>
              </div> */}
            </div>

            <div className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">材料選択</h2>
              {materials.length > 0 ? (
                <div className="space-y-4">
                  <select
                    value={selectedMaterial?.id || ''}
                    onChange={(e) => handleMaterialChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  >
                    {materials.map((material) => (
                      <option key={material.id} value={material.id}>
                        {material.name}
                      </option>
                    ))}
                  </select>
                  {selectedMaterial && (
                    <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 leading-relaxed">
                      <p className="font-semibold text-gray-900 mb-1">
                        {selectedMaterial.name}
                      </p>
                      <p className="mb-2">{selectedMaterial.description}</p>
                      <p className="text-gray-600">
                        基本単価: ¥{selectedThickness?.price.toLocaleString() || 0}/mm
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-600">利用可能な材料を読み込み中です...</p>
              )}
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
              <h2 className="text-2xl font-bold text-gray-900 mb-6">納期オプション</h2>

              {expressOption ? (
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">
                      即納オプション
                    </p>
                    <p className="text-sm text-gray-600">
                      通常より早くお届けするオプションです。サイズに応じて即納料金が自動計算されます。<br />
                      優先生産で納期短縮（+5円/mm）
                    </p>
                  </div>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-amber-600 border-gray-300 rounded"
                      checked={expressSelected}
                      onChange={(e) => setExpressSelected(e.target.checked)}
                    />
                    <span className="text-sm text-gray-700">即納を希望する</span>
                  </label>
                </div>
              ) : (
                <p className="text-sm text-gray-600">
                  即納オプションは現在ご利用いただけません。
                </p>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="flex gap-2 items-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">オプション</h2>
              <button
                type="button"
                onClick={() => setShowFittingImageModal(true)}
                className="ml-2 mb-6 inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 hover:text-gray-900 transition-colors"
                aria-label="ヘルプ"
              >
                <HelpCircle className="w-8 h-8" />
              </button>
              </div>

              <div className="space-y-4">
                {/* <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    端から最初の金具までの距離（mm）
                    <button
                      type="button"
                      onClick={() => setShowFittingImageModal(true)}
                      className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 hover:text-gray-900 transition-colors"
                      aria-label="ヘルプ"
                    >
                      <HelpCircle className="w-4 h-4" />
                    </button>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={fittingDistance}
                    onChange={(e) => setFittingDistance(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="例: 50"
                  />
                  
                </div> */}

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
                          {selected.option.option_type !== 'reinforcement' && (
                              <div className="space-y-4 mt-4">
                                {/* 横（幅）の設定 */}
                                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                                  <h4 className="text-sm font-semibold text-gray-900 mb-3">横（幅）</h4>
                                  <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">
                                        最初のフィッティングまでの距離（mm）
                                      </label>
                                      <input
                                        type="number"
                                        min="0"
                                        value={selected.fittingDistanceWidth || ''}
                                        onChange={(e) =>
                                          updateFittingDistance(
                                            selected.option.id,
                                            'width',
                                            parseFloat(e.target.value) || 0
                                          )
                                        }
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                                        placeholder="例: 50"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">
                                        金具の個数
                                      </label>
                                      <input
                                        type="number"
                                        min="0"
                                        value={selected.fittingCountWidth || ''}
                                        onChange={(e) =>
                                          updateFittingCount(
                                            selected.option.id,
                                            'width',
                                            parseInt(e.target.value) || 0
                                          )
                                        }
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                                        placeholder="例: 3"
                                      />
                                    </div>
                                  </div>
                                  {selected.fittingPositionsWidth && selected.fittingPositionsWidth.length > 0 && (
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">
                                        位置（mm）- カンマ区切りで編集可能
                                      </label>
                                      <input
                                        type="text"
                                        value={selected.fittingPositionsWidth.map(p => Math.round(p * 10) / 10).join(', ')}
                                        onChange={(e) => {
                                          const positions = e.target.value
                                            .split(',')
                                            .map(s => parseFloat(s.trim()) || 0)
                                            .filter(p => !isNaN(p));
                                          updateFittingPositions(selected.option.id, 'width', positions);
                                        }}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                                        placeholder="例: 50, 150, 250"
                                      />
                                    </div>
                                  )}
                                </div>

                                {/* 縦（奥行）の設定 */}
                                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                                  <h4 className="text-sm font-semibold text-gray-900 mb-3">縦（奥行）</h4>
                                  <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">
                                        最初のフィッティングまでの距離（mm）
                                      </label>
                                      <input
                                        type="number"
                                        min="0"
                                        value={selected.fittingDistanceDepth || ''}
                                        onChange={(e) =>
                                          updateFittingDistance(
                                            selected.option.id,
                                            'depth',
                                            parseFloat(e.target.value) || 0
                                          )
                                        }
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                                        placeholder="例: 50"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">
                                        金具の個数
                                      </label>
                                      <input
                                        type="number"
                                        min="0"
                                        value={selected.fittingCountDepth || ''}
                                        onChange={(e) =>
                                          updateFittingCount(
                                            selected.option.id,
                                            'depth',
                                            parseInt(e.target.value) || 0
                                          )
                                        }
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                                        placeholder="例: 3"
                                      />
                                    </div>
                                  </div>
                                  {selected.fittingPositionsDepth && selected.fittingPositionsDepth.length > 0 && (
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">
                                        位置（mm）- カンマ区切りで編集可能
                                      </label>
                                      <input
                                        type="text"
                                        value={selected.fittingPositionsDepth.map(p => Math.round(p * 10) / 10).join(', ')}
                                        onChange={(e) => {
                                          const positions = e.target.value
                                            .split(',')
                                            .map(s => parseFloat(s.trim()) || 0)
                                            .filter(p => !isNaN(p));
                                          updateFittingPositions(selected.option.id, 'depth', positions);
                                        }}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                                        placeholder="例: 50, 150, 250"
                                      />
                                    </div>
                                  )}
                                </div>

                                {/* 高さの設定 */}
                                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                                  <h4 className="text-sm font-semibold text-gray-900 mb-3">高さ</h4>
                                  <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">
                                        最初のフィッティングまでの距離（mm）
                                      </label>
                                      <input
                                        type="number"
                                        min="0"
                                        value={selected.fittingDistanceHeight || ''}
                                        onChange={(e) =>
                                          updateFittingDistance(
                                            selected.option.id,
                                            'height',
                                            parseFloat(e.target.value) || 0
                                          )
                                        }
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                                        placeholder="例: 50"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">
                                        金具の個数
                                      </label>
                                      <input
                                        type="number"
                                        min="0"
                                        value={selected.fittingCountHeight || ''}
                                        onChange={(e) =>
                                          updateFittingCount(
                                            selected.option.id,
                                            'height',
                                            parseInt(e.target.value) || 0
                                          )
                                        }
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                                        placeholder="例: 3"
                                      />
                                    </div>
                                  </div>
                                  {selected.fittingPositionsHeight && selected.fittingPositionsHeight.length > 0 && (
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">
                                        位置（mm）- カンマ区切りで編集可能
                                      </label>
                                      <input
                                        type="text"
                                        value={selected.fittingPositionsHeight.map(p => Math.round(p * 10) / 10).join(', ')}
                                        onChange={(e) => {
                                          const positions = e.target.value
                                            .split('、')
                                            .map(s => parseFloat(s.trim()) || 0)
                                            .filter(p => !isNaN(p));
                                          updateFittingPositions(selected.option.id, 'height', positions);
                                        }}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                                        placeholder="例: 50、150、250"
                                      />
                                    </div>
                                  )}
                                </div>

                                {/* 総個数と見積もりの表示 */}
                                {(() => {
                                  const totalCount =
                                    ((selected.fittingCountWidth || 0) +
                                    (selected.fittingCountDepth || 0) +
                                    (selected.fittingCountHeight || 0)) * 4;
                                  const totalPrice = selected.option.price * totalCount;
                                  return totalCount > 0 ? (
                                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                      <div className="text-sm text-gray-700">
                                        <div className="mb-1">
                                          金属部品の総個数: <span className="font-semibold text-gray-900">{totalCount} {selected.option.unit}</span>
                                        </div>
                                        <div>
                                          見積もり: <span className="font-semibold text-gray-900">¥{totalPrice.toLocaleString()}</span>
                                          <span className="text-xs text-gray-600 ml-2">
                                            ({totalCount} {selected.option.unit} × ¥{selected.option.price.toLocaleString()})
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  ) : null;
                                })()}
                              </div>
                          )}
                          {selected.option.option_type === 'reinforcement' && (
                            <div className="space-y-3">
                              <div className="space-y-1">
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
                                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                                  />
                                  <span className="text-sm text-gray-700">{selected.option.unit}</span>
                                </div>
                              </div>
                              <div className="flex gap-3">
                                <div className="flex items-center gap-3">
                                  <label className="text-sm font-medium text-gray-700">
                                    長さ（mm）:
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={selected.reinforcementLength || ''}
                                    onChange={(e) => updateReinforcementLength(selected.option.id, parseInt(e.target.value) || 0)}
                                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                                    placeholder="0"
                                  />
                                </div>
                                <div className="flex items-center gap-3">
                                  <label className="text-sm font-medium text-gray-700">
                                    幅（mm）:
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={selected.reinforcementWidth || ''}
                                    onChange={(e) => updateReinforcementWidth(selected.option.id, parseInt(e.target.value) || 0)}
                                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                                    placeholder="0"
                                  />
                                </div>
                              </div>
                              {selected.reinforcementLength && selected.reinforcementWidth && (
                                <div className="text-xs text-gray-600">
                                  (面積: {((selected.reinforcementLength * selected.reinforcementWidth) / 1000000).toFixed(4)} m² × 
                                  単価 ¥{selected.option.price.toLocaleString()}/m² + ¥300) × 
                                  数量 {selected.quantity} ={' '}
                                  <span className="font-semibold text-gray-900">
                                    ¥{Math.round((((selected.reinforcementLength * selected.reinforcementWidth) / 1000000) * selected.option.price + 300) * selected.quantity).toLocaleString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">特記事項・注文詳細</h2>
              <textarea
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent min-h-[120px] resize-y"
                placeholder="ご要望や特記事項があればご記入ください"
              />
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
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex justify-between text-gray-600">
                      <span>小計</span>
                      <span>¥{calc.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-gray-600 mt-2">
                      <span>消費税 (10%)</span>
                      <span>¥{calc.vat.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="pt-4 border-t-2 border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900">合計金額 (税込)</span>
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

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={handleCancelAddToCart}>
          <div className="bg-white rounded-xl max-w-md w-full shadow-xl relative" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-amber-100 rounded-full">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                確認
              </h3>
              <p className="text-gray-700 text-center mb-6">
                注文は内寸法で行います。このサイズで間違いありませんか？
              </p>
              {selectedMaterial && selectedThickness && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-600 mb-2">注文内容:</p>
                  <p className="text-sm font-medium text-gray-900">
                    サイズ: {width}mm × {depth}mm × {height}mm
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    材料: {selectedMaterial.name} - {selectedThickness.thickness_mm}mm
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    数量: {quantity}個
                  </p>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={handleCancelAddToCart}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleConfirmAddToCart}
                  className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
                >
                  確認
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fitting Distance Image Modal */}
      {showFittingImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowFittingImageModal(false)}>
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto relative" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">組み立て箱 概要説明</h3>
              <button
                onClick={() => setShowFittingImageModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="閉じる"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>
            <div className="p-6">
              {/* <p className="text-gray-700 mb-4">
                この距離は、箱の端から最初のベンドバックルまでの距離を指します。
              </p> */}
              <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center min-h-[300px]">
                <img src="http://162.43.33.101/api/img/option.webp" alt="端から最初の金具までの距離の説明図" className="max-w-full h-auto rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
