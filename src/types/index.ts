export interface Category {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Product {
  id: string;
  category_id: string | null;
  name: string;
  description: string;
  price: number;
  image_url: string;
  images?: string[]; // Массив фото (до 4 штук)
  specifications: Record<string, string>;
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
