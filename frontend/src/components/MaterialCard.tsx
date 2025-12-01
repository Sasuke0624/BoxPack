import { Material } from '../types/database';
import { ShoppingCart } from 'lucide-react';

interface MaterialCardProps {
  material: Material;
  onSelect: (material: Material) => void;
}

export function MaterialCard({ material, onSelect }: MaterialCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all overflow-hidden h-full flex flex-col">
      <div className="aspect-square bg-gray-100 overflow-hidden">
        {material.image_url ? (
          <img
            src={`.${material.image_url}`}
            alt={material.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
            <span className="text-gray-500">画像なし</span>
          </div>
        )}
      </div>

      <div className="p-6 flex-grow flex flex-col">
        <h3 className="text-lg font-bold text-gray-900 mb-2">{material.name}</h3>

        <p className="text-sm text-gray-600 mb-4 flex-grow leading-relaxed">
          {material.description}
        </p>

        <div className="space-y-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-600 mb-1">基本単価</p>
            <p className="text-xl font-bold text-gray-900">
              ¥{material.base_price.toLocaleString()}/mm
            </p>
          </div>

          <button
            onClick={() => onSelect(material)}
            className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-all"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            選択する
          </button>
        </div>
      </div>
    </div>
  );
}
