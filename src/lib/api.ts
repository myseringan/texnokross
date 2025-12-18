// API URL - измени на свой домен в продакшене
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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

export async function createOrder(customer: OrderCustomer, items: OrderItem[], total: number) {
  return request('/orders', {
    method: 'POST',
    body: JSON.stringify({ customer, items, total }),
  });
}

export async function getOrders() {
  return request('/orders');
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
}): Promise<Product> {
  return request('/improsoft/create-product', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
export interface PaymentResponse {
  success: boolean;
  payment_url: string;
  order_id: string;
  amount: number;
}

export async function createPayment(orderId: string, amount: number): Promise<PaymentResponse> {
  return request('/create-payment', {
    method: 'POST',
    body: JSON.stringify({ order_id: orderId, amount }),
  });
}
