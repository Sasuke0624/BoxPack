import { useState, useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Calculator, ShoppingCart, Download, Plus, Trash2, HelpCircle, X } from 'lucide-react';
import { materialsApi, optionsApi } from '../lib/api';
import { Material, MaterialThickness, Option, SelectedOption, BendBuckleConfig, BendBuckleEdgeConfig, BendBuckleGroupConfig } from '../types/database';
import { calculatePrice, validateDimensions } from '../utils/priceCalculator';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import OptionCard from '../components/OptionCard';

const isoX = (x: number, y: number, z: number) => (x - y) * 0.866;
const isoY = (x: number, y: number, z: number) => (x + y) * 0.5 - z;

// 箱のサイズ（正規化）
const boxW = 100;
const boxD = 80;
const boxH = 60;

// 頂点の座標
const boxVertices = {
  topFrontLeft: { x: 0, y: 0, z: boxH },
  topFrontRight: { x: boxW, y: 0, z: boxH },
  topBackRight: { x: boxW, y: boxD, z: boxH },
  topBackLeft: { x: 0, y: boxD, z: boxH },
  bottomFrontLeft: { x: 0, y: 0, z: 0 },
  bottomFrontRight: { x: boxW, y: 0, z: 0 },
  bottomBackRight: { x: boxW, y: boxD, z: 0 },
  bottomBackLeft: { x: 0, y: boxD, z: 0 },
};

// 辺の定義
const boxEdges: { [key: string]: { from: keyof typeof boxVertices; to: keyof typeof boxVertices } } = {
  'top-front': { from: 'topFrontLeft', to: 'topFrontRight' },
  'top-right': { from: 'topFrontRight', to: 'topBackRight' },
  'top-back': { from: 'topBackRight', to: 'topBackLeft' },
  'top-left': { from: 'topBackLeft', to: 'topFrontLeft' },
  'bottom-front': { from: 'bottomFrontLeft', to: 'bottomFrontRight' },
  'bottom-right': { from: 'bottomFrontRight', to: 'bottomBackRight' },
  'bottom-back': { from: 'bottomBackRight', to: 'bottomBackLeft' },
  'bottom-left': { from: 'bottomBackLeft', to: 'bottomFrontLeft' },
  'front-left': { from: 'bottomFrontLeft', to: 'topFrontLeft' },
  'front-right': { from: 'bottomFrontRight', to: 'topFrontRight' },
  'back-left': { from: 'bottomBackLeft', to: 'topBackLeft' },
  'back-right': { from: 'bottomBackRight', to: 'topBackRight' },
};

// 各グループ・各辺に対応する辺IDのマッピング
const getEdgeIds = (group: keyof BendBuckleConfig, edge: 'edge1' | 'edge2' | 'edge3' | 'edge4'): string[] => {
  if (group === 'top') {
    // 上面：edge1=前, edge2=右, edge3=後, edge4=左
    if (edge === 'edge1') return ['top-front'];
    if (edge === 'edge2') return ['top-back'];
    if (edge === 'edge3') return ['bottom-front'];
    return ['bottom-back'];
  } else if (group === 'bottom') {
    // 下面：edge1=前, edge2=右, edge3=後, edge4=左
    if (edge === 'edge1') return ['top-right'];
    if (edge === 'edge2') return ['bottom-right'];
    if (edge === 'edge3') return ['top-left'];
    return ['bottom-left'];
  } else {
    // 側面：edge1=前左, edge2=前右, edge3=後左, edge4=後右
    if (edge === 'edge1') return ['front-left'];
    if (edge === 'edge2') return ['front-right'];
    if (edge === 'edge3') return ['back-left'];
    return ['back-right'];
  }
};

// 六面体の可視化コンポーネント
const BoxVisualization = ({ highlightedEdges }: { highlightedEdges: string[] }) => {
  const centerX = 150;
  const centerY = 110;

  return (
    <div className="mb-3 p-2 bg-white rounded border border-gray-300">
      <div className="flex justify-center">
        <svg width="280" height="200" viewBox="0 0 300 220" className="max-w-full">
          {/* 面を描画（半透明） */}
          <polygon
            points={`
              ${centerX + isoX(boxVertices.topFrontLeft.x, boxVertices.topFrontLeft.y, boxVertices.topFrontLeft.z)},${centerY + isoY(boxVertices.topFrontLeft.x, boxVertices.topFrontLeft.y, boxVertices.topFrontLeft.z)}
              ${centerX + isoX(boxVertices.topFrontRight.x, boxVertices.topFrontRight.y, boxVertices.topFrontRight.z)},${centerY + isoY(boxVertices.topFrontRight.x, boxVertices.topFrontRight.y, boxVertices.topFrontRight.z)}
              ${centerX + isoX(boxVertices.topBackRight.x, boxVertices.topBackRight.y, boxVertices.topBackRight.z)},${centerY + isoY(boxVertices.topBackRight.x, boxVertices.topBackRight.y, boxVertices.topBackRight.z)}
              ${centerX + isoX(boxVertices.topBackLeft.x, boxVertices.topBackLeft.y, boxVertices.topBackLeft.z)},${centerY + isoY(boxVertices.topBackLeft.x, boxVertices.topBackLeft.y, boxVertices.topBackLeft.z)}
            `}
            fill="#e5e7eb"
            stroke="#9ca3af"
            strokeWidth="1"
            opacity="0.3"
          />
          <polygon
            points={`
              ${centerX + isoX(boxVertices.bottomFrontLeft.x, boxVertices.bottomFrontLeft.y, boxVertices.bottomFrontLeft.z)},${centerY + isoY(boxVertices.bottomFrontLeft.x, boxVertices.bottomFrontLeft.y, boxVertices.bottomFrontLeft.z)}
              ${centerX + isoX(boxVertices.bottomFrontRight.x, boxVertices.bottomFrontRight.y, boxVertices.bottomFrontRight.z)},${centerY + isoY(boxVertices.bottomFrontRight.x, boxVertices.bottomFrontRight.y, boxVertices.bottomFrontRight.z)}
              ${centerX + isoX(boxVertices.topFrontRight.x, boxVertices.topFrontRight.y, boxVertices.topFrontRight.z)},${centerY + isoY(boxVertices.topFrontRight.x, boxVertices.topFrontRight.y, boxVertices.topFrontRight.z)}
              ${centerX + isoX(boxVertices.topFrontLeft.x, boxVertices.topFrontLeft.y, boxVertices.topFrontLeft.z)},${centerY + isoY(boxVertices.topFrontLeft.x, boxVertices.topFrontLeft.y, boxVertices.topFrontLeft.z)}
            `}
            fill="#f3f4f6"
            stroke="#9ca3af"
            strokeWidth="1"
            opacity="0.3"
          />
          <polygon
            points={`
              ${centerX + isoX(boxVertices.bottomFrontRight.x, boxVertices.bottomFrontRight.y, boxVertices.bottomFrontRight.z)},${centerY + isoY(boxVertices.bottomFrontRight.x, boxVertices.bottomFrontRight.y, boxVertices.bottomFrontRight.z)}
              ${centerX + isoX(boxVertices.bottomBackRight.x, boxVertices.bottomBackRight.y, boxVertices.bottomBackRight.z)},${centerY + isoY(boxVertices.bottomBackRight.x, boxVertices.bottomBackRight.y, boxVertices.bottomBackRight.z)}
              ${centerX + isoX(boxVertices.topBackRight.x, boxVertices.topBackRight.y, boxVertices.topBackRight.z)},${centerY + isoY(boxVertices.topBackRight.x, boxVertices.topBackRight.y, boxVertices.topBackRight.z)}
              ${centerX + isoX(boxVertices.topFrontRight.x, boxVertices.topFrontRight.y, boxVertices.topFrontRight.z)},${centerY + isoY(boxVertices.topFrontRight.x, boxVertices.topFrontRight.y, boxVertices.topFrontRight.z)}
            `}
            fill="#f9fafb"
            stroke="#9ca3af"
            strokeWidth="1"
            opacity="0.3"
          />

          {/* 辺を描画 */}
          {Object.entries(boxEdges).map(([edgeId, edge]) => {
            const from = boxVertices[edge.from];
            const to = boxVertices[edge.to];
            const isHighlighted = highlightedEdges.includes(edgeId);
            
            return (
              <line
                key={edgeId}
                x1={centerX + isoX(from.x, from.y, from.z)}
                y1={centerY + isoY(from.x, from.y, from.z)}
                x2={centerX + isoX(to.x, to.y, to.z)}
                y2={centerY + isoY(to.x, to.y, to.z)}
                stroke={isHighlighted ? "#ef4444" : "#6b7280"}
                strokeWidth={isHighlighted ? 5 : 2}
                strokeLinecap="round"
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
};

// ベンドバックル辺入力コンポーネント
const BendBuckleEdgeInput = memo(
  ({
    group,
    edge,
    edgeConfig,
    edgeLabel,
    highlightedEdgeIds,
    onUpdate,
  }: {
    group: keyof BendBuckleConfig;
    edge: 'edge1' | 'edge2' | 'edge3' | 'edge4';
    edgeConfig: BendBuckleEdgeConfig;
    edgeLabel: string;
    highlightedEdgeIds: string[];
    onUpdate: (
      field: 'firstDistance' | 'count' | 'positions',
      value: number | number[]
    ) => void;
  }) => {
    const borderColors = {
      edge1: 'border-blue-200 bg-blue-50',
      edge2: 'border-green-200 bg-green-50',
      edge3: 'border-purple-200 bg-purple-50',
      edge4: 'border-amber-200 bg-amber-50',
    };

    const dotColors = {
      edge1: 'bg-blue-600',
      edge2: 'bg-green-600',
      edge3: 'bg-purple-600',
      edge4: 'bg-amber-600',
    };

    return (
      <div className={`space-y-3 border-2 ${borderColors[edge]} rounded-lg p-4`}>
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-3 h-3 ${dotColors[edge]} rounded-full`} />
          <h4 className="text-sm font-semibold text-gray-900">{edgeLabel}</h4>
        </div>

        <BoxVisualization highlightedEdges={highlightedEdgeIds} />

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            最初のフィッティングまでの距離（mm）
          </label>
          <input
            type="number"
            min="40"
            value={edgeConfig.firstDistance || ''}
            onChange={(e) =>
              onUpdate('firstDistance', parseFloat(e.target.value) || 0)
            }
            className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent
            ${edgeConfig.firstDistance > 0 && edgeConfig.firstDistance < 40 ? 'border-red-500' : ''}`}
            placeholder="例: 50"
          />
          {edgeConfig.firstDistance > 0 && edgeConfig.firstDistance < 40 && (
            <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              最小値は40mmです。40以上の値を入力してください。
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            個数
          </label>
          <input
            type="number"
            min="0"
            value={edgeConfig.count || ''}
            onChange={(e) =>
              onUpdate('count', parseInt(e.target.value) || 0)
            }
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            placeholder="例: 3"
          />
        </div>

        {edgeConfig.positions.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              位置（mm）- カンマ区切りで編集可能
            </label>
            <input
              type="text"
              value={edgeConfig.positions
                .map((p) => Math.round(p * 10) / 10)
                .join('、')}
              onChange={(e) => {
                const positions = e.target.value
                  .split('、')
                  .map((s) => parseFloat(s.trim()) || 0)
                  .filter((p) => !isNaN(p));
                onUpdate('positions', positions);
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="例: 50、150、250"
            />
          </div>
        )}
      </div>
    );
  }
);


// ベンドバックルグループコンポーネント
const BendBuckleGroup = memo(({
  group,
  groupConfig,
  groupTitle,
  edgeLabels,
  onGroupEnabledChange,
  onEdgeUpdate,
}: {
  group: keyof BendBuckleConfig;
  groupConfig: BendBuckleGroupConfig;
  groupTitle: string;
  edgeLabels: [string, string, string, string];
  onGroupEnabledChange: (enabled: boolean) => void;
  onEdgeUpdate: (group: keyof BendBuckleConfig, edge: 'edge1' | 'edge2' | 'edge3' | 'edge4', field: 'firstDistance' | 'count' | 'positions', value: number | number[]) => void;
}) => {
  // group is used in updateBendBuckleEdge calls within BendBuckleEdgeInput
  console.log('groupConfig', groupConfig);
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{groupTitle}</h3>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={groupConfig.enabled}
            onChange={(e) => onGroupEnabledChange(e.target.checked)}
            className="w-5 h-5 text-amber-600 border-gray-300 rounded"
          />
          <span className="text-sm text-gray-700">使用する</span>
        </label>
      </div>
      {groupConfig.enabled && (
        <div className="grid md:grid-cols-2 gap-4">
          {(['edge1', 'edge2', 'edge3', 'edge4'] as const).map((edge, index) => (
            <BendBuckleEdgeInput
              key={edge}
              group={group}
              edge={edge}
              edgeConfig={groupConfig[edge]}
              edgeLabel={edgeLabels[index]}
              highlightedEdgeIds={getEdgeIds(group, edge)}
              onUpdate={(field, value) => onEdgeUpdate(group, edge, field, value)}
            />
          ))}
        </div>
      )}
    </div>
  );
});

const QuotePage = () => {
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

  const [bendBuckleConfig, setBendBuckleConfig] = useState<BendBuckleConfig>({
    top: {
      enabled: true,
      edge1: { firstDistance: 0, count: 0, positions: [] },
      edge2: { firstDistance: 0, count: 0, positions: [] },
      edge3: { firstDistance: 0, count: 0, positions: [] },
      edge4: { firstDistance: 0, count: 0, positions: [] },
    },
    sides: {
      enabled: true,
      edge1: { firstDistance: 0, count: 0, positions: [] },
      edge2: { firstDistance: 0, count: 0, positions: [] },
      edge3: { firstDistance: 0, count: 0, positions: [] },
      edge4: { firstDistance: 0, count: 0, positions: [] },
    },
    bottom: {
      enabled: true,
      edge1: { firstDistance: 0, count: 0, positions: [] },
      edge2: { firstDistance: 0, count: 0, positions: [] },
      edge3: { firstDistance: 0, count: 0, positions: [] },
      edge4: { firstDistance: 0, count: 0, positions: [] },
    },
  });

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

      // Recalculate bend buckle positions
      setBendBuckleConfig(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(groupKey => {
          const group = groupKey as keyof BendBuckleConfig;
          const groupConfig = updated[group];
          
          if (group === 'top' || group === 'bottom') {
            // 上面・下面：edge1,edge3=幅, edge2,edge4=奥行
            ['edge1', 'edge2', 'edge3', 'edge4'].forEach((edgeKey) => {
              const edge = edgeKey as 'edge1' | 'edge2' | 'edge3' | 'edge4';
              const dimension = (edge === 'edge1' || edge === 'edge3') ? w : d;
              if (groupConfig[edge].count > 0 && dimension > 0 && groupConfig[edge].firstDistance >= 0) {
                groupConfig[edge].positions = calculateFittingPositions(
                  dimension,
                  groupConfig[edge].firstDistance,
                  groupConfig[edge].count
                );
              }
            });
          } else {
            // 側面：すべて高さ
            ['edge1', 'edge2', 'edge3', 'edge4'].forEach((edgeKey) => {
              const edge = edgeKey as 'edge1' | 'edge2' | 'edge3' | 'edge4';
              if (groupConfig[edge].count > 0 && h > 0 && groupConfig[edge].firstDistance >= 0) {
                groupConfig[edge].positions = calculateFittingPositions(
                  h,
                  groupConfig[edge].firstDistance,
                  groupConfig[edge].count
                );
              }
            });
          }
        });
        return updated;
      });
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
    console.log("loadOptions", data);
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

  // Update bend buckle configuration
  const updateBendBuckleGroupEnabled = (group: keyof BendBuckleConfig, enabled: boolean) => {
    setBendBuckleConfig(prev => ({
      ...prev,
      [group]: {
        ...prev[group],
        enabled,
      },
    }));
  };

  const updateBendBuckleEdge = (
    group: keyof BendBuckleConfig,
    edge: 'edge1' | 'edge2' | 'edge3' | 'edge4',
    field: 'firstDistance' | 'count' | 'positions',
    value: number | number[]
  ) => {
    setBendBuckleConfig(prev => {
      const groupConfig = prev[group];
      const edgeConfig = groupConfig[edge];
      
      let updatedEdge: BendBuckleEdgeConfig = { ...edgeConfig };
      
      if (field === 'firstDistance') {
        updatedEdge.firstDistance = value as number;
        // Recalculate positions if count and dimension are available
        const w = parseInt(width) || 0;
        const d = parseInt(depth) || 0;
        const h = parseInt(height) || 0;
        
        let dimension = 0;
        if (group === 'top' || group === 'bottom') {
          // 上面・下面：edge1=幅, edge2=奥行, edge3=幅, edge4=奥行
          dimension = (edge === 'edge1' || edge === 'edge3') ? w : d;
        } else {
          // 側面：すべて高さ
          dimension = h;
        }
        
        if (updatedEdge.count > 0 && dimension > 0) {
          updatedEdge.positions = calculateFittingPositions(
            dimension,
            updatedEdge.firstDistance,
            updatedEdge.count
          );
        }
      } else if (field === 'count') {
        updatedEdge.count = value as number;
        // Recalculate positions
        const w = parseInt(width) || 0;
        const d = parseInt(depth) || 0;
        const h = parseInt(height) || 0;
        
        let dimension = 0;
        if (group === 'top' || group === 'bottom') {
          dimension = (edge === 'edge1' || edge === 'edge3') ? w : d;
        } else {
          dimension = h;
        }
        
        if (updatedEdge.count > 0 && dimension > 0 && updatedEdge.firstDistance >= 0) {
          updatedEdge.positions = calculateFittingPositions(
            dimension,
            updatedEdge.firstDistance,
            updatedEdge.count
          );
        } else {
          updatedEdge.positions = [];
        }
      } else if (field === 'positions') {
        updatedEdge.positions = value as number[];
      }
      
      return {
        ...prev,
        [group]: {
          ...groupConfig,
          [edge]: updatedEdge,
        },
      };
    });
  };

  // Calculate total bend buckle count
  const calculateTotalBendBuckleCount = (): number => {
    let total = 0;
    Object.values(bendBuckleConfig).forEach(groupConfig => {
      if (groupConfig.enabled) {
        total += groupConfig.edge1.count + groupConfig.edge2.count + groupConfig.edge3.count + groupConfig.edge4.count;
      }
    });
    return total;
  };

  // 六面体の可視化用の関数とコンポーネント
  // 等角投影の座標計算
  

  

  

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
        bendBuckleConfig: bendBuckleConfig,
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
              <h2 className="text-2xl font-bold text-gray-900 mb-6">ベンドバックル</h2>
              <p className="text-sm text-gray-600 mb-6">
                各グループごとにベンドバックルの使用を選択し、各辺の個数と位置を設定できます。
                <br />
                <span className="text-xs text-gray-500">
                  ※ 各グループには4つの辺があります。それぞれの辺にベンドバックルを配置する個数を設定してください。
                  <br />
                  ※ 各辺の設定セクションにある図で、赤色で強調されている辺が現在設定している辺です。
                </span>
              </p>

              <div className="space-y-6">
                {/* 上面 */}
                <BendBuckleGroup
                  group="top"
                  groupConfig={bendBuckleConfig.top}
                  groupTitle="上下面の幅 グループ"
                  edgeLabels={['辺1: 前（幅方向）', '辺2: 右（奥行方向）', '辺3: 後（幅方向）', '辺4: 左（奥行方向）']}
                  onGroupEnabledChange={(enabled) => updateBendBuckleGroupEnabled('top', enabled)}
                  onEdgeUpdate={updateBendBuckleEdge}
                />

                {/* 側面 */}
                <BendBuckleGroup
                  group="sides"
                  groupConfig={bendBuckleConfig.sides}
                  groupTitle="上下面の深さ グループ"
                  edgeLabels={['辺1: 前左', '辺2: 前右', '辺3: 後左', '辺4: 後右']}
                  onGroupEnabledChange={(enabled) => updateBendBuckleGroupEnabled('sides', enabled)}
                  onEdgeUpdate={updateBendBuckleEdge}
                />

                {/* 下面 */}
                <BendBuckleGroup
                  group="bottom"
                  groupConfig={bendBuckleConfig.bottom}
                  groupTitle="上下面の高さ グループ"
                  edgeLabels={['辺1: 前（幅方向）', '辺2: 右（奥行方向）', '辺3: 後（幅方向）', '辺4: 左（奥行方向）']}
                  onGroupEnabledChange={(enabled) => updateBendBuckleGroupEnabled('bottom', enabled)}
                  onEdgeUpdate={updateBendBuckleEdge}
                />

                {/* 総個数表示 */}
                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="text-sm text-gray-700">
                    <div className="font-semibold text-gray-900 mb-1">
                      ベンドバックル総個数: {calculateTotalBendBuckleCount()}個
                    </div>
                    <p className="text-xs text-gray-600">
                      この情報は管理部に送信され、見積計算には含まれません。
                    </p>
                  </div>
                </div>
              </div>
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
                
                {/* <div className="flex gap-2">
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
                </div> */}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {options.map((option) => {
                    const isSelected = selectedOptions.some(so => so.option.id === option.id);
                    const selectedItem = selectedOptions.find(so => so.option.id === option.id);
                    
                    return (
                      <OptionCard
                        key={option.id}
                        option={option}
                        isSelected={isSelected}
                        selectedQuantity={selectedItem?.quantity}
                        onAdd={(option) => {
                          const existingIndex = selectedOptions.findIndex(o => o.option.id === option.id);
                          if (existingIndex >= 0) {
                            const updated = [...selectedOptions];
                            updated[existingIndex].quantity += 1;
                            setSelectedOptions(updated);
                          } else {
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
                          setError(null);
                        }}
                      />
                    );
                  })}
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

                        <div className = "flex gap-2 mb-2 flex-wrap">
                          {selected.option.option_type === "screw" && (
                            ["M5-10mm", "M5-14mm", "M5-15mm", "M5-18mm", "M5-22mm"].map((screw) => (
                              <button
                                key={screw}
                                onClick={() => console.log(screw)}
                                className="px-2 py-1 border border-gray-300 rounded-lg hover:bg-amber-200 transition-colors"
                              >
                                {screw}
                              </button>
                          )))}
                          {selected.option.option_type === "reinforcement" && (
                            ["針葉樹9mm", "針葉樹12mm", "OSB9mm", "OSB11mm", "ラワン9mm", "ラワン12mm"].map((reinforcement) => (
                              <button
                                key={reinforcement}
                                onClick={() => console.log(reinforcement)}
                                className="px-2 py-1 border border-gray-300 rounded-lg hover:bg-amber-200 transition-colors"
                              >
                                {reinforcement}
                              </button>
                          )))}
                          {selected.option.option_type === "buckle" && (
                            ["100kg", "500kg", "1000kg"].map((buckle) => (
                              <button
                                key={buckle}
                                onClick={() => console.log(buckle)}
                                className="px-2 py-1 border border-gray-300 rounded-lg hover:bg-amber-200 transition-colors"
                              >
                                {buckle}
                              </button>
                          )))}
                          {selected.option.option_type === "Skids" && (
                            ["35×35mm", "35×105mm", "45×105mm", "90×90mm"].map((Skids) => (
                              <button
                                key={Skids}
                                onClick={() => console.log(Skids)}
                                className="px-2 py-1 border border-gray-300 rounded-lg hover:bg-amber-200 transition-colors"
                              >
                                {Skids}
                              </button>
                          )))}
                        </div>

                        <div className="space-y-3">
                          {selected.option.option_type !== 'reinforcement' && (
                              
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
                            <div className="text-xs text-gray-600">
                              数量 ({selected.quantity} {selected.option.unit}) × 単価 ¥
                              {selected.option.price.toLocaleString()} ={' '}
                              <span className="font-semibold text-gray-900">
                                ¥{(selected.option.price * selected.quantity).toLocaleString()}
                              </span>
                            </div>
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
                              <div className="flex gap-3 flex-col md:flex-row">
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
                    材料: {selectedMaterial?.name} - {selectedThickness?.thickness_mm}mm
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
    </div>
  );
}

export default memo(QuotePage);