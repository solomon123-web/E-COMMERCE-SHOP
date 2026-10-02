  import type { Product, User } from '../types';

const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers ?? {}),
      },
      ...options,
    });

    const body = await response.text();
    const data = body ? JSON.parse(body) : null;

    if (!response.ok) {
      throw new Error((data && typeof data.message === 'string' ? data.message : 'Request failed.') || 'Request failed.');
    }

    return data as T;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Unable to connect to the API server. Please ensure the backend is running on http://localhost:4000.');
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error('Unexpected API error.');
  }
}

export async function fetchProducts(): Promise<Product[]> {
  const result = await apiFetch<{ products: Product[] }>('/products');
  return result.products;
}

export async function fetchProduct(productId: number): Promise<Product> {
  const result = await apiFetch<{ product: Product }>(`/products/${productId}`);
  return result.product;
}

export async function fetchOrders(token: string): Promise<Order[]> {
  const result = await apiFetch<{ orders: Order[] }>('/orders', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return result.orders;
}

export async function getAuthenticatedUser(token: string): Promise<User> {
  const result = await apiFetch<{ user: User }>('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return result.user;
}

export type Order = {
  id: string;
  orderNumber: string;
  email: string;
  total: number;
  orderStatus: string;
  paymentStatus: string;
  createdAt: string;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
};
