import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../lib/api';
import { useAuthStore } from '../../stores/AuthStore';
import { connectSocket, disconnectSocket, getSocket } from '../lib/socket';
import {
  transformVendorToShop,
  transformProduct,
  transformOrder,
  BackendVendor,
  BackendProduct,
  BackendOrder,
  Shop,
  Product,
  Order,
  OrderStatus,
} from '../utils/dataTransformers';

export type { Shop, Product, Order, OrderStatus };

export interface CartItem {
  product: Product;
  quantity: number;
}

type Role = 'buyer' | 'vendor' | 'rider';

type UserProfile = {
  name: string;
  phone: string;
  community: string;
};

type AppContextValue = {
  role: Role | null;
  setRole: (role: Role | null) => void;
  onboarded: boolean;
  completeOnboarding: () => void;
  profile: UserProfile;
  updateProfile: (profile: Partial<UserProfile>) => void;
  
  // API data
  shops: Shop[];
  products: Product[];
  orders: Order[];
  
  // Cart (local state)
  cart: CartItem[];
  cartSubtotal: number;
  cartCount: number;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  
  // API methods
  fetchShops: () => Promise<void>;
  fetchProducts: (vendorId: string) => Promise<void>;
  fetchOrders: () => Promise<void>;
  placeOrder: (landmark: string, address: string) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  
  // Loading states
  isLoading: boolean;
  
  // Legacy methods
  resetDemo: () => void;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(null);
  const [onboarded, setOnboarded] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    name: 'Tunde O.',
    phone: '0812 220 0011',
    community: 'Redemption City, Ogun',
  });
  
  // API data state
  const [shops, setShops] = useState<Shop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Cart state (local only)
  const [cart, setCart] = useState<CartItem[]>([]);

  const { user } = useAuthStore();

  const cartSubtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cart]
  );
  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  // API methods
  const fetchShops = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get<BackendVendor[]>('/api/vendors');
      setShops(data.map(transformVendorToShop));
    } catch (error) {
      console.error('Failed to fetch shops:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchProducts = useCallback(async (vendorId: string) => {
    setIsLoading(true);
    try {
      const data = await api.get<BackendProduct[]>(`/api/products?vendorId=${vendorId}`);
      setProducts(data.map(transformProduct));
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get<BackendOrder[]>('/api/orders');
      setOrders(data.map(transformOrder));
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const placeOrder = async (landmark: string, address: string): Promise<Order> => {
    const vendorId =
      typeof cart[0]?.product.vendorId === 'string'
        ? cart[0].product.vendorId
        : cart[0]?.product.vendorId;

    const order = await api.post<BackendOrder>('/api/orders', {
      vendorId,
      items: cart.map((item) => ({
        productId: item.product._id,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
      })),
      totalAmount: cartSubtotal,
      deliveryLocation: { landmark, description: address },
    });

    const transformedOrder = transformOrder(order);
    setOrders((current) => [transformedOrder, ...current]);
    setCart([]);
    return transformedOrder;
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    const endpointMap: Record<string, string> = {
      READY_FOR_PICKUP: `/api/orders/${orderId}/accept`,
      OUT_FOR_DELIVERY: `/api/orders/${orderId}/assign-rider`,
      DELIVERED: `/api/orders/${orderId}/complete`,
      CANCELLED: `/api/orders/${orderId}/cancel`,
    };

    const endpoint = endpointMap[status];
    if (endpoint) {
      const updated = await api.patch<BackendOrder>(endpoint);
      const transformedOrder = transformOrder(updated);
      setOrders((current) =>
        current.map((order) => (order._id === orderId ? transformedOrder : order))
      );
    }
  };

  // Cart operations (local state only, no API calls)
  const addToCart = (product: Product) => {
    setCart((current) => {
      const found = current.find((item) => item.product._id === product._id);
      if (found) {
        return current.map((item) =>
          item.product._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...current, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((current) =>
      current
        .map((item) =>
          item.product._id === productId ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  // Fetch data when user logs in
  useEffect(() => {
    if (user) {
      fetchShops();
      fetchOrders();
    }
  }, [user, fetchShops, fetchOrders]);

  // Socket.IO integration for real-time updates
  useEffect(() => {
    if (user) {
      connectSocket().then((socket) => {
        // Order events
        socket.on('order:new', () => {
          console.log('New order received');
          fetchOrders();
        });

        socket.on('order:accepted', () => {
          console.log('Order accepted');
          fetchOrders();
        });

        socket.on('order:pickedup', () => {
          console.log('Order picked up');
          fetchOrders();
        });

        socket.on('order:delivered', () => {
          console.log('Order delivered');
          fetchOrders();
        });

        socket.on('kyc:verified', () => {
          console.log('KYC verified');
        });
      });

      return () => {
        const socket = getSocket();
        if (socket) {
          socket.off('order:new');
          socket.off('order:accepted');
          socket.off('order:pickedup');
          socket.off('order:delivered');
          socket.off('kyc:verified');
        }
        disconnectSocket();
      };
    }
  }, [user, fetchOrders]);

  const value: AppContextValue = {
    role,
    setRole,
    onboarded,
    completeOnboarding: () => setOnboarded(true),
    profile,
    updateProfile: (nextProfile: Partial<UserProfile>) =>
      setProfile((current) => ({ ...current, ...nextProfile })),
    
    // API data
    shops,
    products,
    orders,
    
    // Cart
    cart,
    cartSubtotal,
    cartCount,
    addToCart,
    removeFromCart,
    clearCart: () => setCart([]),
    
    // API methods
    fetchShops,
    fetchProducts,
    fetchOrders,
    placeOrder,
    updateOrderStatus,
    
    // Loading
    isLoading,
    
    // Legacy
    resetDemo: () => {
      setRole(null);
      setOnboarded(false);
      setCart([]);
      setOrders([]);
    },
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used inside AppProvider');
  }
  return context;
}

export const formatNaira = (value: number) => `₦${value.toLocaleString('en-NG')}`;

