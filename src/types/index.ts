export interface Category {
  id: string;
  name: string;
  name_ru?: string; // Русское название
  slug: string;
  created_at: string;
}

export interface Product {
  id: string;
  category_id: string | null;
  name: string;
  name_ru?: string; // Русское название
  description: string;
  description_ru?: string; // Русское описание
  price: number;
  image_url: string;
  images?: string[]; // Массив фото (до 4 штук)
  specifications: Record<string, string>;
  specifications_ru?: Record<string, string>; // Русские характеристики
  in_stock: boolean;
  created_at: string;
}

export interface CartItem {
  id: string;
  session_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  product?: Product;
}
