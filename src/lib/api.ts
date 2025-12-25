// Хелпер для запросов
async function request(endpoint: string, options?: RequestInit) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}

// ==================== PRODUCTS ====================

export async function getProducts() {
  return request('/products');
}

export async function getProduct(id: string) {
  return request(`/products/${id}`);
}

export async function createProduct(product: any) {
  return request('/products', {
    method: 'POST',
    body: JSON.stringify(product),
  });
}

export async function updateProduct(id: string, product: any) {
  return request(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(product),
  });
}

export async function deleteProduct(id: string) {
  return request(`/products/${id}`, {
    method: 'DELETE',
  });
}

// ==================== CATEGORIES ====================

export async function getCategories() {
  return request('/categories');
}

export async function createCategory(category: any) {
  return request('/categories', {
    method: 'POST',
    body: JSON.stringify(category),
  });
}

export async function updateCategory(id: string, category: any) {
  return request(`/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(category),
  });
}

export async function deleteCategory(id: string) {
  return request(`/categories/${id}`, {
    method: 'DELETE',
  });
}

// ==================== BANNERS ====================

export async function getBanners() {
  return request('/banners');
}

export async function createBanner(banner: any) {
  return request('/banners', {
    method: 'POST',
    body: JSON.stringify(banner),
  });
}

export async function updateBanner(id: string, banner: any) {
  return request(`/banners/${id}`, {
    method: 'PUT',
    body: JSON.stringify(banner),
  });
}

export async function deleteBanner(id: string) {
  return request(`/banners/${id}`, {
    method: 'DELETE',
  });
}

// ==================== ORDERS ====================

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string;
}

export interface OrderCustomer {
  name: string;
  phone: string;
  address?: string;
  comment?: string;
  deliveryType?: 'free' | 'paid';
  deliveryCost?: number;
  city?: string;
}

export interface Order {
  id: string;
  customer: OrderCustomer;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'paid' | 'cancelled' | 'delivered';
  payment_status: 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled';
  created_at: string;
  expire_at: string;
  paid_at?: string;
  cancelled_at?: string;
  transaction_id?: string;
}

export interface CreateOrderResponse {
  success: boolean;
  order: Order;
}

export async function createOrder(
  customer: OrderCustomer,
  items: OrderItem[],
  total: number
): Promise<CreateOrderResponse> {
  return request('/orders', {
    method: 'POST',
    body: JSON.stringify({ customer, items, total }),
  });
}

export async function getOrders(): Promise<Order[]> {
  return request('/orders');
}

export async function updateOrder(id: string, data: Partial<Order>): Promise<Order> {
  return request(`/orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ==================== SETTINGS ====================

export interface Settings {
  deliveryPrice: number;
  freeDeliveryRadius: number;
  freeDeliveryCity: string;
}

export async function getSettings(): Promise<Settings> {
  return request('/settings');
}

export async function updateSettings(settings: Partial<Settings>): Promise<Settings> {
  return request('/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
}

// ==================== CITIES ====================

export interface City {
  id: string;
  name: string;
  name_ru: string;
  price: number;
}

export async function getCities(): Promise<City[]> {
  return request('/cities');
}

export async function createCity(city: Omit<City, 'id'>): Promise<City> {
  return request('/cities', {
    method: 'POST',
    body: JSON.stringify(city),
  });
}

export async function updateCity(id: string, city: Partial<City>): Promise<City> {
  return request(`/cities/${id}`, {
    method: 'PUT',
    body: JSON.stringify(city),
  });
}

export async function deleteCity(id: string): Promise<void> {
  return request(`/cities/${id}`, {
    method: 'DELETE',
  });
}

// ==================== IMPROSOFT ====================

export interface ImprosoftProduct {
  id: string;
  name: string;
  barcode: string;
  price: number;
  created_at: string;
  updated_at?: string;
  inCatalog: boolean;
}

export interface ImprosoftStatus {
  total: number;
  fromImprosoft: number;
  rawTotal: number;
  notAdded: number;
  lastSync: string | null;
}

export async function getImprosoftProducts(): Promise<ImprosoftProduct[]> {
  return request('/improsoft/products');
}

export async function getImprosoftStatus(): Promise<ImprosoftStatus> {
  return request('/improsoft/status');
}

export async function createProductFromImprosoft(data: {
  barcode: string;
  name: string;
  name_ru?: string;
  price: number;
  category_id?: string;
  image_url?: string;
  description?: string;
  description_ru?: string;
}): Promise<any> {
  return request('/improsoft/create-product', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ==================== PAYME PAYMENT ====================

export interface PaymentResponse {
  success: boolean;
  payment_url: string;
  order_id: string;
  amount: number;
  amount_tiyin: number;
}

/**
 * Создание ссылки на оплату через Payme
 * @param orderId - ID заказа
 * @param amount - Сумма в сумах
 * @param returnUrl - URL для возврата после оплаты (опционально)
 */
export async function createPayment(
  orderId: string,
  amount: number,
  returnUrl?: string
): Promise<PaymentResponse> {
  return request('/create-payment', {
    method: 'POST',
    body: JSON.stringify({
      order_id: orderId,
      amount,
      return_url: returnUrl,
    }),
  });
}

/**
 * Получение статуса заказа после оплаты
 */
export async function getOrderStatus(orderId: string): Promise<Order | null> {
  try {
    const orders = await getOrders();
    return orders.find(o => o.id === orderId) || null;
  } catch {
    return null;
  }
}

// ==================== TYPES ====================

export interface Product {
  id: string;
  category_id: string | null;
  name: string;
  name_ru?: string;
  description: string;
  description_ru?: string;
  price: number;
  image_url: string;
  images?: string[];
  specifications: Record<string, string>;
  specifications_ru?: Record<string, string>;
  in_stock: boolean;
  barcode?: string;
  source?: string;
  created_at: string;
}
