  import type { Product, User } from '../types';

const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  try {
    const headers = new Headers(options.headers ?? {});

    if (options.body !== undefined && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    const contentType = response.headers.get('content-type') ?? '';
    const rawBody = await response.text();
    let data: any = null;

    if (rawBody && contentType.includes('application/json')) {
      try {
        data = JSON.parse(rawBody);
      } catch {
        data = null;
      }
    }

    if (!response.ok) {
      const message = data && typeof data.message === 'string' ? data.message : 'Request failed.';
      throw new Error(message);
    }

    if (!rawBody && response.status !== 204) {
      return null as T;
    }

    if (!rawBody) {
      return null as T;
    }

    if (contentType.includes('application/json')) {
      return (data ?? null) as T;
    }

    throw new Error('Unexpected server response. Please check that the backend API is running correctly.');
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
