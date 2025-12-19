import { useState } from 'react';
import { Option } from '../types/database';
import { Plus, ZoomIn, X } from 'lucide-react';

interface OptionCardProps {
  option: Option;
  isSelected: boolean;
  selectedQuantity?: number;
  onAdd: (option: Option) => void;
}

const OptionCard = ({option, isSelected, selectedQuantity, onAdd}: OptionCardProps) => {
    const [showImageModal, setShowImageModal] = useState(false);
    return (
        <>
        <div
          className={`bg-white border-2 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all ${
            isSelected ? 'border-amber-500 bg-amber-50' : 'border-gray-200'
          }`}
        >
          {/* Image Section */}
          <div className="h-48 flex items-center justify-center overflow-hidden">
            <div className="w-full h-full flex items-center justify-center p-1">
              <div className="w-full h-full text-center text-gray-400 relative" onClick={(e) => {
                    e.stopPropagation();
                    setShowImageModal(true);
                  }}>
                <img src={`${import.meta.env.VITE_API_URL}/${option.img_url}`} alt={option.name} className="w-full h-full object-contain hover:scale-105 hover:transition-all hover:duration-300 hover:cursor-pointer" />
                {/* <ZoomIn className="w-32 h-32 text-gray-400 hover:text-gray-500 hover:scale-130? absolute top-2 right-2" /> */}
              </div>
              
            </div>
          </div>
    
          {/* Content Section */}
          <div className="p-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-bold text-gray-900 flex-1">
                {option.name}
              </h3>
              {isSelected && (
                <span className="ml-2 px-2 py-1 bg-amber-500 text-white text-xs font-semibold rounded-full whitespace-nowrap">
                  追加済み
                </span>
              )}
            </div>
    
            <p className="text-sm text-gray-600 mb-3 line-clamp-2 min-h-[2.5rem]">
              {option.description}
            </p>
    
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-2xl font-bold text-gray-900">
                  ¥{option.price.toLocaleString()}
                </span>
                {option.unit && (
                  <span className="text-sm text-gray-500 ml-1">
                    /{option.unit}
                  </span>
                )}
              </div>
              {isSelected && selectedQuantity !== undefined && (
                <div className="text-sm text-gray-600 font-medium">
                  数量: {selectedQuantity}
                </div>
              )}
            </div>
    
            {/* Add Button */}
            <button
              onClick={() => onAdd(option)}
              className={`w-full py-2.5 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                isSelected
                  ? 'bg-amber-600 text-white hover:bg-amber-700'
                  : 'bg-red-400 text-white hover:bg-red-300'
              }`}
            >
              <Plus className="w-4 h-4" />
              {isSelected ? '数量を追加' : '追加'}
            </button>
          </div>
        </div>
        {showImageModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setShowImageModal(false)}
        >
          <div 
            className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all z-10"
              aria-label="閉じる"
            >
              <X className="w-6 h-6 text-gray-700" />
            </button>

            {/* Enlarged Image */}
            <img
              src={`${import.meta.env.VITE_API_URL}/${option.img_url}`}
              alt={option.name}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
        </>
      );
};

export default OptionCard;