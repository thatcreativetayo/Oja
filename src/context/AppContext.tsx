import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

import {
  CartItem,
  Order,
  Product,
  Role,
  existingOrders,
  formatNaira,
  products,
  shops,
} from '../constants/mockData';

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
  cart: CartItem[];
  orders: Order[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartSubtotal: number;
  cartCount: number;
  placeOrder: (landmark: string, address: string) => Order;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
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
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>(existingOrders);

  const cartSubtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cart]
  );
  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  const addToCart = (product: Product) => {
    setCart((current) => {
      const found = current.find((item) => item.product.id === product.id);
      if (found) {
        return current.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...current, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((current) =>
      current
        .map((item) =>
          item.product.id === productId ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const placeOrder = (landmark: string, address: string) => {
    const firstItem = cart[0]?.product ?? products[0];
    const shop = shops.find((item) => item.id === firstItem.shopId) ?? shops[0];
    const nextOrder: Order = {
      id: `OJA-2026-${String(42 + orders.length).padStart(4, '0')}`,
      shopId: shop.id,
      shopName: shop.name,
      items: cart.length ? cart : [{ product: products[0], quantity: 1 }],
      status: 'placed',
      subtotal: cartSubtotal || products[0].price,
      deliveryFee: 550,
      address: address || 'Salisu Street',
      landmark,
      buyerName: profile.name,
      riderName: 'Tunde O.',
      riderPhone: '0812 220 0011',
      createdAt: new Date().toISOString(),
    };
    setOrders((current) => [nextOrder, ...current]);
    setCart([]);
    return nextOrder;
  };

  const value = {
    role,
    setRole,
    onboarded,
    completeOnboarding: () => setOnboarded(true),
    profile,
    updateProfile: (nextProfile: Partial<UserProfile>) =>
      setProfile((current) => ({ ...current, ...nextProfile })),
    cart,
    orders,
    addToCart,
    removeFromCart,
    clearCart: () => setCart([]),
    cartSubtotal,
    cartCount,
    placeOrder,
    updateOrderStatus: (orderId: string, status: Order['status']) =>
      setOrders((current) =>
        current.map((order) => (order.id === orderId ? { ...order, status } : order))
      ),
    resetDemo: () => {
      setRole(null);
      setOnboarded(false);
      setCart([]);
      setOrders(existingOrders);
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

export { formatNaira, products, shops };
