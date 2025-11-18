import { Material, MaterialThickness, SelectedOption } from '../types/database';

export interface PriceCalculation {
  materialCost: number;
  optionsCost: number;
  expressCharge: number;
  totalPrice: number;
}

export function calculatePrice(
  width_mm: number,
  depth_mm: number,
  height_mm: number,
  material: Material,
  thickness: MaterialThickness,
  selectedOptions: SelectedOption[],
  quantity: number = 1
): PriceCalculation {
  const volume = width_mm + depth_mm + height_mm;

  const baseMaterialCost = material.base_price * volume;

  let optionsCost = 0;
  let expressCharge = 0;

  selectedOptions.forEach(selected => {
    const option = selected.option;
    if (option.option_type === 'express') {
      const totalMm = width_mm + depth_mm + height_mm;
      expressCharge = totalMm * 3 * selected.quantity;
    } else {
      optionsCost += option.price * selected.quantity;
    }
  });

  const totalPrice = (baseMaterialCost + optionsCost + expressCharge) * quantity;

  return {
    materialCost: baseMaterialCost * quantity,
    optionsCost: optionsCost * quantity,
    expressCharge: expressCharge * quantity,
    totalPrice: Math.round(totalPrice),
  };
}

export function validateDimensions(width: number, depth: number, height: number): string | null {
  if (width <= 0 || depth <= 0 || height <= 0) {
    return 'すべてのサイズは0より大きい値を入力してください';
  }

  if (width > 2400 || depth > 2400 || height > 2400) {
    return 'サイズは3000mm以下で入力してください';
  }

  return null;
}
