// Backend types
export interface BackendVendor {
  _id: string;
  userId: string;
  shopName: string;
  category: string;
  landmark: string;
  openingHours?: string;
  operationalStatus?: 'OPEN' | 'CLOSED';
  photoUrl?: string;
  averageRating?: number;
  isOnline?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BackendProduct {
  _id: string;
  vendorId: string;
  name: string;
  description?: string;
  price: number;
  stockQuantity?: number;
  inStock: boolean;
  category?: string;
  imageUrl?: string;
  photoUrl?: string;
  emoji?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BackendOrder {
  _id: string;
  buyerId: string;
  vendorId: string | { _id: string; shopName: string };
  riderId?: string | null;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  deliveryFee?: number;
  deliveryAddress?: string;
  deliveryLocation?: { landmark: string; description: string };
  deliveryPhoneNumber?: string;
  qrCode?: string;
  verificationToken?: string;
  status: 'PENDING_ACCEPTANCE' | 'READY_FOR_PICKUP' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  paymentStatus: 'UNPAID' | 'PENDING_CONFIRMATION' | 'PAID';
  paystackReference?: string | null;
  createdAt: string;
  updatedAt?: string;
}

// Frontend types
export interface Shop {
  _id: string;
  shopName: string;
  category: string;
  landmark: string;
  averageRating?: number;
  isOperational?: boolean;
  isOnline?: boolean;
  photoUrl?: string;
}

export interface Product {
  _id: string;
  name: string;
  price: number;
  emoji?: string;
  description?: string;
  inStock: boolean;
  vendorId: string;
  photoUrl?: string;
  imageUrl?: string;
}

export type OrderStatus =
  | 'PENDING_ACCEPTANCE'
  | 'READY_FOR_PICKUP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export interface Order {
  _id: string;
  vendorId: { _id: string; shopName: string } | string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
  status: OrderStatus;
  totalAmount: number;
  deliveryFee: number;
  deliveryLocation: { landmark: string; description: string };
  paymentStatus: string;
  createdAt: string;
  verificationToken?: string;
}

// Transformation functions
export function transformVendorToShop(vendor: BackendVendor): Shop {
  return {
    _id: vendor._id,
    shopName: vendor.shopName,
    category: vendor.category,
    landmark: vendor.landmark,
    averageRating: vendor.averageRating || 4.8,
    isOperational: vendor.operationalStatus === 'OPEN',
    isOnline: vendor.isOnline || false,
    photoUrl: vendor.photoUrl,
  };
}

export function transformProduct(product: BackendProduct): Product {
  return {
    _id: product._id,
    vendorId: product.vendorId,
    name: product.name,
    price: product.price,
    description: product.description || '',
    inStock: product.inStock ?? (product.stockQuantity ? product.stockQuantity > 0 : true),
    emoji: product.emoji,
    photoUrl: product.photoUrl || product.imageUrl,
    imageUrl: product.imageUrl || product.photoUrl,
  };
}

export function transformOrder(order: BackendOrder): Order {
  return {
    _id: order._id,
    vendorId: order.vendorId,
    items: order.items,
    status: order.status,
    totalAmount: order.totalAmount,
    deliveryFee: order.deliveryFee || 550,
    deliveryLocation: order.deliveryLocation || {
      landmark: order.deliveryAddress || '',
      description: order.deliveryAddress || '',
    },
    paymentStatus: order.paymentStatus,
    createdAt: order.createdAt,
    verificationToken: order.verificationToken || order.qrCode,
  };
}

// Status mapping helpers
export const backendToFrontendStatus: Record<string, OrderStatus> = {
  'PENDING_ACCEPTANCE': 'PENDING_ACCEPTANCE',
  'READY_FOR_PICKUP': 'READY_FOR_PICKUP',
  'OUT_FOR_DELIVERY': 'OUT_FOR_DELIVERY',
  'DELIVERED': 'DELIVERED',
  'CANCELLED': 'CANCELLED',
};

export const frontendToBackendAction: Record<string, string> = {
  'accept': 'accept',
  'assign-rider': 'assign-rider',
  'complete': 'complete',
  'cancel': 'cancel',
};

export function mapBackendStatus(backendStatus: string): OrderStatus {
  return backendToFrontendStatus[backendStatus] as OrderStatus || 'PENDING_ACCEPTANCE';
}

export function mapFrontendAction(frontendAction: string): string {
  return frontendToBackendAction[frontendAction] || frontendAction;
}
