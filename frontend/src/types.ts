export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  stockQuantity: number;
  categoryId: number;
  image: string;
  status?: string;
  featured?: boolean;
  rating?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  avatarUrl?: string;
}

export interface CartProduct {
  productId: number;
  quantity: number;
  name: string;
  price: number;
  image: string;
  stockQuantity: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  email: string;
  total: number;
  orderStatus: string;
  paymentStatus: string;
  paymentReference?: string;
  createdAt: string;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}
