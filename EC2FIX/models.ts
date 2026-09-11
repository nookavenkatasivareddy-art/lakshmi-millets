export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: Category | string;
  description: string;
  image: string;
  price: number;
  mrp: number;
  weight: string;
  stock: number;
  isPopular: boolean;
}

export interface DeliveryLocation {
  id?: string;
  _id?: string;
  city: string;
  state: string;
  deliveryCharge: number;
  freeDeliveryAbove: number;
  estimatedDays: string;
}

export interface CartItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface Address {
  id?: string;
  _id?: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  addresses: Address[];
}
