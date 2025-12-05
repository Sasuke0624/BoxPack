export interface Material {
  id: string;
  name: string;
  description: string;
  image_url: string;
  base_price: number;
  is_active: boolean;
  sort_order: number;
}

export interface MaterialThickness {
  id: string;
  material_id: string;
  thickness_mm: number;
  price: number;
  size: number; // 0 = 3x6, 1 = 4x8
  is_available: boolean;
}

export interface Option {
  id: string;
  name: string;
  description: string;
  price: number;
  option_type: 'handle' | 'buckle' | 'reinforcement' | 'express';
  is_active: boolean;
  sort_order: number;
  unit: string;
}

export interface SavedTemplate {
  id: string;
  user_id: string;
  template_name: string;
  width_mm: number;
  depth_mm: number;
  height_mm: number;
  material_id: string;
  thickness_id: string;
  selected_options: string[];
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  order_number: string;
  status: 'pending' | 'confirmed' | 'manufacturing' | 'shipped' | 'delivered';
  total_amount: number;
  points_used: number;
  shipping_address: {
    postal_code: string;
    prefecture: string;
    city: string;
    address_line: string;
    building?: string;
    recipient_name: string;
    phone: string;
  };
  payment_method: string;
  payment_status: string;
  shipping_eta?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  width_mm: number;
  depth_mm: number;
  height_mm: number;
  material_id: string;
  thickness_id: string;
  selected_options: string[];
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  company_name: string;
  phone: string;
  points: number;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface SelectedOption {
  option: Option;
  quantity: number;
  fittingDistance?: number;
}

export interface QuoteData {
  width_mm: number;
  depth_mm: number;
  height_mm: number;
  material: Material;
  thickness: MaterialThickness;
  selectedOptions: SelectedOption[];
  quantity: number;
  totalPrice: number;
}

export interface CarouselImage {
  id: string;
  image_url: string;
  title: string;
  description: string;
  sort_order: number;
}

export interface CustomerReview {
  id: string;
  name: string;
  company: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface Inventory {
  id: string;
  material_id: string;
  thickness_id: string;
  current_stock: number;
  min_stock_level: number;
  unit: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryHistory {
  id: string;
  inventory_id: string;
  movement_type: 'in' | 'out' | 'adjustment';
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
}
