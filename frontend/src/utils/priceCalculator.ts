import { Material, MaterialThickness, SelectedOption } from '../types/database';

export interface PriceCalculation {
  materialCost: number;
  optionsCost: number;
  expressCharge: number;
  subtotal: number;
  vat: number;
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

  // Use the direct price from MaterialThickness
  const baseMaterialCost = thickness.price * volume;

  let optionsCost = 0;
  let expressCharge = 0;

  selectedOptions.forEach(selected => {
    const option = selected.option;
    if (option.option_type === 'express') {
      const totalMm = width_mm + depth_mm + height_mm;
      expressCharge = totalMm * 5 * selected.quantity;
    } else if (option.option_type === 'reinforcement') {
      // For reinforcement: price is per square meter
      // Calculate: (length_mm × width_mm / 1,000,000) × base_price × quantity
      if (selected.reinforcementLength && selected.reinforcementWidth) {
        const area_m2 = (selected.reinforcementLength * selected.reinforcementWidth) / 1000000;
        const reinforcementPrice = area_m2 * option.price + 300;
        optionsCost += reinforcementPrice * selected.quantity;
      }
    } else {
      optionsCost += option.price * selected.quantity;
    }
  });

  const subtotal = (baseMaterialCost + optionsCost) * quantity + expressCharge;
  const vat = Math.round(subtotal * 0.1); // 10% VAT
  const totalPrice = subtotal + vat;

  return {
    materialCost: baseMaterialCost * quantity,
    optionsCost: optionsCost * quantity,
    expressCharge: expressCharge,
    subtotal: Math.round(subtotal),
    vat,
    totalPrice: Math.round(totalPrice),
  };
}

export function validateDimensions(width: number, depth: number, height: number): string | null {
  if (width <= 0 || depth <= 0 || height <= 0) {
    return 'すべてのサイズは0より大きい値を入力してください';
  }

  if (width > 2440 || depth > 2440 || height > 2440) {
    return 'サイズは2440mm以下で入力してください';
  }

  return null;
}
