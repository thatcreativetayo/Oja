# Technical Design Document: Oja Frontend-Backend API Integration

## Overview

### Purpose

This design document specifies the integration architecture between the Oja React Native frontend and its Express/MongoDB backend API. The integration replaces mock data with real API calls, implements secure authentication with token management, enables real-time order tracking via Socket.IO, and adds file upload capabilities for photos and documents.

### Core Capabilities

- **Typed API Client**: Centralized HTTP client with automatic token management and error handling
- **Authentication Store**: Zustand-based state management for OTP-based login and session persistence
- **Real-time Updates**: Socket.IO integration for order status notifications across all user roles
- **File Upload**: Cloudinary integration for profile photos, product images, and KYC documents
- **Screen Integration**: Role-specific API integration patterns for buyer, vendor, and rider flows
- **Environment Configuration**: Multi-environment setup for development and production deployments
- **Seed Data**: Comprehensive test data with Redemption City-themed vendors and products

### Technology Stack

- **State Management**: Zustand for authentication, React Context for application state
- **HTTP Client**: Fetch API with TypeScript wrappers
- **WebSocket**: Socket.IO client for real-time communication
- **Storage**: AsyncStorage for token and session persistence
- **Environment**: Expo environment variables (EXPO_PUBLIC_API_URL)
- **Image Handling**: Expo Image Picker for file selection

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                React Native Frontend (Expo)                   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              User Interface Layer                     │   │
│  │    BuyerScreens │ VendorScreens │ RiderScreens       │   │
│  └─────────────────────┬────────────────────────────────┘   │
│                        │                                      │
│  ┌─────────────────────▼────────────────────────────────┐   │
│  │         State Management Layer                        │   │
│  │  ┌─────────────┐           ┌──────────────┐         │   │
│  │  │  Auth Store │           │  App Context │         │   │
│  │  │  (Zustand)  │           │  (React)     │         │   │
│  │  └─────────────┘           └──────────────┘         │   │
│  └─────────────────────┬────────────────────────────────┘   │
│                        │                                      │
│  ┌─────────────────────▼────────────────────────────────┐   │
│  │            Integration Layer                          │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐       │   │
│  │  │API Client│  │Socket.IO │  │Upload Service│       │   │
│  │  └──────────┘  └──────────┘  └──────────────┘       │   │
│  └─────────────────────┬────────────────────────────────┘   │
└────────────────────────┼─────────────────────────────────────┘
                         │ HTTPS / WSS
┌────────────────────────▼─────────────────────────────────────┐
│                   Backend API Server                          │
│         (Express + MongoDB + Socket.IO + Cloudinary)          │
└───────────────────────────────────────────────────────────────┘
```



## Architecture

### System Components

#### 1. API Client Module (`src/services/apiClient.ts`)

**Purpose**: Centralized HTTP communication layer with automatic token injection and error handling

**Responsibilities**:
- Execute typed HTTP requests (GET, POST, PATCH, DELETE)
- Automatically attach JWT token from AsyncStorage to Authorization header
- Parse JSON responses and handle HTTP errors
- Implement request timeout logic
- Handle 401 errors by clearing session and redirecting to login
- Provide user-friendly error messages for network failures

**Configuration**:
- Base URL from `EXPO_PUBLIC_API_URL` environment variable
- Default timeout: 10 seconds
- Content-Type: application/json

**Key Methods**:
```typescript
interface ApiClient {
  get<T>(path: string): Promise<T>;
  post<T>(path: string, body: any): Promise<T>;
  patch<T>(path: string, body: any): Promise<T>;
  delete<T>(path: string): Promise<T>;
}
```

**Error Handling Strategy**:
- 401 → Clear token, redirect to login, throw AuthError
- 400-499 → Parse error message from response, throw ValidationError
- 500-599 → Throw ServerError with generic message
- Network failure → Throw NetworkError with retry suggestion
- Timeout → Throw TimeoutError with user message

#### 2. Authentication Store (`src/stores/authStore.ts`)

**Purpose**: Global authentication state management using Zustand

**State**:
```typescript
interface AuthState {
  user: User | null;           // { id, name, role, phone }
  token: string | null;
  isLoading: boolean;
  error: string | null;
}
```

**Actions**:
```typescript
interface AuthActions {
  sendOtp: (phoneNumber: string) => Promise<void>;
  verifyOtp: (phoneNumber: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  loadSession: () => Promise<void>;
  clearError: () => void;
}
```

**Persistence**:
- Token stored in AsyncStorage under key `@oja/auth_token`
- User object stored in AsyncStorage under key `@oja/user`
- Session restored on app launch via `loadSession()`

**Flow Diagram**:
```
App Launch
    ↓
loadSession()
    ↓
AsyncStorage.getItem('@oja/auth_token')
    ↓
token exists? ─No→ Navigate to Login
    ↓ Yes
GET /api/auth/me (with token)
    ↓
Success? ─No→ Clear session, Navigate to Login
    ↓ Yes
Set user state → Navigate to Role Screen
```

#### 3. App Context (`src/context/AppContext.tsx`)

**Purpose**: Application-level state and data fetching for shops, products, orders, and cart

**State**:
```typescript
interface AppContextValue {
  // Role & Profile (keeping existing)
  role: Role | null;
  setRole: (role: Role | null) => void;
  profile: UserProfile;
  updateProfile: (profile: Partial<UserProfile>) => void;
  
  // Cart (local state, not synced with backend)
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartSubtotal: number;
  cartCount: number;
  
  // API Data
  shops: Shop[];
  products: Product[];
  orders: Order[];
  
  // API Methods
  fetchShops: () => Promise<void>;
  fetchProducts: (vendorId: string) => Promise<void>;
  fetchOrders: () => Promise<void>;
  placeOrder: (landmark: string, address: string) => Promise<Order>;
  updateOrderStatus: (orderId: string, action: string) => Promise<void>;
  
  // Loading States
  isLoadingShops: boolean;
  isLoadingProducts: boolean;
  isLoadingOrders: boolean;
}
```

**Data Transformation**:
- Backend `_id` → Frontend `id` for consistency with existing mock data structure
- Backend enum values → Frontend display strings
- Backend timestamps (ISO 8601) → Formatted date strings using date-fns

**Integration Points**:
- Called by screens on mount (useEffect hooks)
- Triggered by user actions (button presses, form submissions)
- Updated by Socket.IO events for real-time sync

#### 4. Socket.IO Client (`src/services/socketClient.ts`)

**Purpose**: Real-time bidirectional communication for order status updates

**Connection Lifecycle**:
```typescript
interface SocketClient {
  connect: (token: string) => void;
  disconnect: () => void;
  on: (event: string, handler: Function) => void;
  off: (event: string) => void;
}
```

**Connection Flow**:
```
User Login Success
    ↓
socketClient.connect(token)
    ↓
Socket.IO handshake with auth: { token }
    ↓
Server validates token → Join user room
    ↓
Listen for events:
  - orderCreated (vendors)
  - orderReadyForPickup (riders)
  - orderStatusChanged (buyers)
  - paymentConfirmed (vendors)
    ↓
Event received → Update App Context state → UI re-renders
```

**Event Handlers**:
- Register handlers in App Context on mount
- Remove handlers on unmount to prevent memory leaks
- Handle disconnections with automatic reconnection

**Connection Management**:
- Connect on successful login
- Disconnect on logout
- Disconnect when app backgrounded (AppState listener)
- Reconnect when app foregrounded

#### 5. Upload Service (`src/services/uploadService.ts`)

**Purpose**: File upload handling for photos and documents

**Flow**:
```typescript
interface UploadService {
  uploadImage: (uri: string) => Promise<string>; // Returns Cloudinary URL
}
```

**Upload Process**:
```
User selects image (Expo Image Picker)
    ↓
Get file URI and metadata
    ↓
Create FormData with file
    ↓
POST /api/upload (multipart/form-data)
    ↓
Backend uploads to Cloudinary
    ↓
Return { url: "https://cloudinary.com/..." }
    ↓
Use URL in subsequent API calls (vendor registration, product creation, KYC)
```

**Validation**:
- Max file size: 5MB (checked before upload)
- Supported formats: JPEG, PNG (enforced by ImagePicker)
- Show loading indicator during upload
- Handle errors with user-friendly messages

### Data Flow Patterns

#### Pattern 1: OTP Authentication Flow

```
┌─────────────┐                 ┌──────────────┐                 ┌──────────┐
│ User enters │    sendOtp()    │              │  POST /auth/   │          │
│ phone number├────────────────►│  Auth Store  ├───send-otp────►│  Backend │
└─────────────┘                 │              │                 │          │
                                └──────┬───────┘                 └────┬─────┘
                                       │                              │
                                       │         SMS with OTP         │
                                       │◄─────────────────────────────┘
                                       │
┌─────────────┐                 ┌──────▼───────┐                 ┌──────────┐
│ User enters │  verifyOtp()    │              │  POST /auth/   │          │
│  OTP code   ├────────────────►│  Auth Store  ├───verify-otp──►│  Backend │
└─────────────┘                 │              │                 │          │
                                └──────┬───────┘                 └────┬─────┘
                                       │                              │
                                       │     { token, user }          │
                                       │◄─────────────────────────────┘
                                       │
                                       ▼
                           AsyncStorage.setItem('@oja/auth_token')
                           AsyncStorage.setItem('@oja/user')
                                       │
                                       ▼
                           Navigate to Role Dashboard
```

#### Pattern 2: Order Creation with Real-time Notification

```
┌──────────────┐               ┌─────────────┐               ┌──────────┐
│Buyer submits │  placeOrder() │             │ POST /orders  │          │
│checkout form ├──────────────►│ App Context ├──────────────►│  Backend │
└──────────────┘               │             │               │          │
                               └──────┬──────┘               └────┬─────┘
                                      │                           │
                                      │    { order: {...} }       │
                                      │◄──────────────────────────┘
                                      │
                                      ├─► Update local orders array
                                      ├─► Clear cart
                                      └─► Navigate to OrderPlacedScreen
                                      
                                                    ┌──────────────────┐
                                                    │Socket.IO emits   │
                                                    │"orderCreated" to │
                                                    │vendor's room     │
                                                    └────────┬─────────┘
                                                             │
                               ┌─────────────┐              │
                               │Vendor's App │◄─────────────┘
                               │receives     │
                               │notification │
                               └──────┬──────┘
                                      │
                                      └─► Update pending orders UI
```

#### Pattern 3: Product Catalog Loading

```
┌──────────────────┐          ┌─────────────┐          ┌──────────┐
│BuyerHomeScreen   │fetchShops│             │GET /     │          │
│useEffect() mount ├─────────►│ App Context ├──vendors►│  Backend │
└──────────────────┘          │             │          │          │
                              └──────┬──────┘          └────┬─────┘
                                     │                      │
                                     │  [vendors array]     │
                                     │◄─────────────────────┘
                                     │
                                     ├─► Transform _id → id
                                     ├─► Store in shops state
                                     └─► Trigger UI re-render
                                     
┌──────────────────┐          ┌─────────────┐          ┌──────────┐
│User taps shop    │fetchProd │             │GET /prod │          │
│navigate to       ├─────────►│ App Context ├──ucts?   │  Backend │
│StorefrontScreen  │  ucts()  │             │vendorId  │          │
└──────────────────┘          │             │          │          │
                              └──────┬──────┘          └────┬─────┘
                                     │                      │
                                     │  [products array]    │
                                     │◄─────────────────────┘
                                     │
                                     ├─► Store in products state
                                     └─► Display in product grid
```

#### Pattern 4: Order Status Updates with State Machine

```
┌─────────────────────────────────────────────────────────────────┐
│                      Order Status Lifecycle                      │
└─────────────────────────────────────────────────────────────────┘

PENDING_ACCEPTANCE
         │
         │ Vendor accepts (PATCH /orders/:id/accept)
         ▼
READY_FOR_PICKUP ──► Socket.IO: Broadcast to all approved riders
         │
         │ Rider scans QR (PATCH /orders/:id/pickup + qrCode)
         ▼
OUT_FOR_DELIVERY ──► Socket.IO: Notify buyer
         │
         │ Rider completes delivery (PATCH /orders/:id/deliver)
         ▼
   DELIVERED ──────► Socket.IO: Notify buyer and vendor

Guards:
- Accept: paymentStatus must be "PAID"
- Pickup: Rider KYC must be "APPROVED", QR must match
- Deliver: Rider must be assigned to order
```

### Security Architecture

#### Token Management

**Storage**:
- JWT token stored in AsyncStorage (encrypted by iOS/Android OS)
- Token extracted and attached to every API request as `Authorization: Bearer <token>`

**Token Lifecycle**:
1. **Issuance**: Received from `POST /auth/verify-otp` after successful OTP verification
2. **Storage**: Immediately saved to AsyncStorage
3. **Usage**: Attached to all authenticated API requests
4. **Expiration**: Backend enforces 7-day expiration
5. **Invalidation**: Cleared on logout or 401 response

**Session Recovery**:
```typescript
// On app launch
async function loadSession() {
  const token = await AsyncStorage.getItem('@oja/auth_token');
  if (!token) return;
  
  try {
    // Validate token with backend
    const user = await apiClient.get('/auth/me');
    authStore.setState({ user, token });
  } catch (error) {
    // Token invalid/expired - clear session
    await AsyncStorage.multiRemove(['@oja/auth_token', '@oja/user']);
  }
}
```

#### Error Handling for Auth Failures

**401 Response Handler**:
```typescript
// In apiClient.ts
if (response.status === 401) {
  // Clear stored credentials
  await AsyncStorage.multiRemove(['@oja/auth_token', '@oja/user']);
  
  // Reset auth store
  authStore.getState().logout();
  
  // Navigate to login (using navigation ref)
  navigationRef.current?.navigate('Login');
  
  throw new AuthError('Session expired. Please login again.');
}
```

#### Secure Data Transmission

- All API requests use HTTPS in production
- Token transmitted only via Authorization header (not URL params)
- No sensitive data logged to console in production
- Cloudinary upload URLs expire after upload



## Components and Interfaces

### API Client Interface

**Module**: `src/services/apiClient.ts`

**Type Definitions**:
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  headers: Record<string, string>;
}

class ApiClient {
  private config: ApiClientConfig;
  
  constructor(config: ApiClientConfig);
  
  async get<T>(path: string): Promise<T>;
  async post<T>(path: string, body: any): Promise<T>;
  async patch<T>(path: string, body: any): Promise<T>;
  async delete<T>(path: string): Promise<T>;
  
  private async request<T>(
    method: string,
    path: string,
    body?: any
  ): Promise<T>;
  
  private async getToken(): Promise<string | null>;
  private async handleResponse<T>(response: Response): Promise<T>;
  private handleError(error: any): never;
}
```

**Implementation Details**:

```typescript
// Initialization
const baseURL = Constants.expoConfig?.extra?.apiUrl || 'http://192.168.1.100:3000';

export const apiClient = new ApiClient({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request method with token injection
private async request<T>(
  method: string,
  path: string,
  body?: any
): Promise<T> {
  const token = await this.getToken();
  const headers = { ...this.config.headers };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
  
  try {
    const response = await fetch(`${this.config.baseURL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return await this.handleResponse<T>(response);
  } catch (error) {
    clearTimeout(timeoutId);
    return this.handleError(error);
  }
}

// Error handling
private handleError(error: any): never {
  if (error.name === 'AbortError') {
    throw new TimeoutError('Request timed out. Please try again.');
  }
  
  if (!navigator.onLine) {
    throw new NetworkError('No internet connection. Please check your network.');
  }
  
  throw new NetworkError('Network request failed. Please try again.');
}
```

### Authentication Store Interface

**Module**: `src/stores/authStore.ts`

**Type Definitions**:
```typescript
interface User {
  id: string;
  name: string;
  role: 'buyer' | 'vendor' | 'rider';
  phone: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  sendOtp: (phoneNumber: string) => Promise<void>;
  verifyOtp: (phoneNumber: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  loadSession: () => Promise<void>;
  clearError: () => void;
}

type AuthStore = AuthState & AuthActions;
```

**Zustand Store Implementation**:
```typescript
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,

  sendOtp: async (phoneNumber: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.post('/auth/send-otp', { phoneNumber });
      set({ isLoading: false });
    } catch (error: any) {
      set({ isLoading: false, error: error.message });
    }
  },

  verifyOtp: async (phoneNumber: string, otp: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post<{ token: string; user: User }>(
        '/auth/verify-otp',
        { phoneNumber, otp }
      );
      
      // Store token and user
      await AsyncStorage.setItem('@oja/auth_token', response.token);
      await AsyncStorage.setItem('@oja/user', JSON.stringify(response.user));
      
      set({
        user: response.user,
        token: response.token,
        isLoading: false,
      });
    } catch (error: any) {
      set({ isLoading: false, error: error.message });
    }
  },

  logout: async () => {
    await AsyncStorage.multiRemove(['@oja/auth_token', '@oja/user']);
    set({ user: null, token: null });
  },

  loadSession: async () => {
    set({ isLoading: true });
    try {
      const token = await AsyncStorage.getItem('@oja/auth_token');
      if (!token) {
        set({ isLoading: false });
        return;
      }
      
      // Validate token with backend
      const user = await apiClient.get<User>('/auth/me');
      
      set({
        user,
        token,
        isLoading: false,
      });
    } catch (error) {
      // Token invalid - clear session
      await AsyncStorage.multiRemove(['@oja/auth_token', '@oja/user']);
      set({ user: null, token: null, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
```

### App Context Interface

**Module**: `src/context/AppContext.tsx`

**Type Definitions**:
```typescript
// Backend types (with _id)
interface BackendProduct {
  _id: string;
  vendorId: string;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  category: string;
  imageUrl: string;
}

interface BackendOrder {
  _id: string;
  buyerId: string;
  vendorId: string;
  riderId: string | null;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  deliveryAddress: string;
  deliveryPhoneNumber: string;
  qrCode: string;
  orderStatus: 'PENDING_ACCEPTANCE' | 'READY_FOR_PICKUP' | 'OUT_FOR_DELIVERY' | 'DELIVERED';
  paymentStatus: 'UNPAID' | 'PENDING_CONFIRMATION' | 'PAID';
  createdAt: string;
}

// Frontend types (matching existing mockData structure)
interface Product {
  id: string;
  shopId: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  emoji: string;
  inStock: boolean;
  description: string;
}

interface Shop {
  id: string;
  name: string;
  category: string;
  distance: string;
  eta: string;
  rating: number;
  landmark: string;
  hero: string;
  accent: string;
}

interface Order {
  id: string;
  shopId: string;
  shopName: string;
  items: CartItem[];
  status: 'placed' | 'accepted' | 'packed' | 'with-rider' | 'arrived' | 'paid' | 'delivered';
  subtotal: number;
  deliveryFee: number;
  address: string;
  landmark: string;
  buyerName: string;
  riderName: string;
  riderPhone: string;
  createdAt: string;
}
```

**Data Transformation Functions**:
```typescript
// Transform backend vendor to frontend shop
function transformVendorToShop(vendor: BackendVendor): Shop {
  return {
    id: vendor._id,
    name: vendor.shopName,
    category: vendor.category,
    distance: '0.5km', // TODO: Calculate from coordinates
    eta: '5-10 mins',  // TODO: Calculate from distance
    rating: 4.8,       // TODO: Get from reviews system
    landmark: vendor.landmark,
    hero: vendor.shopName.toUpperCase(),
    accent: getCategoryAccentColor(vendor.category),
  };
}

// Transform backend product to frontend product
function transformProduct(product: BackendProduct): Product {
  return {
    id: product._id,
    shopId: product.vendorId,
    name: product.name,
    category: product.category,
    price: product.price,
    unit: '1 piece', // TODO: Add unit field to backend
    emoji: getCategoryEmoji(product.category),
    inStock: product.stockQuantity > 0,
    description: product.description,
  };
}

// Transform backend order to frontend order
function transformOrder(order: BackendOrder): Order {
  const statusMap = {
    'PENDING_ACCEPTANCE': 'placed',
    'READY_FOR_PICKUP': 'accepted',
    'OUT_FOR_DELIVERY': 'with-rider',
    'DELIVERED': 'delivered',
  };
  
  return {
    id: order._id,
    shopId: order.vendorId,
    shopName: '', // TODO: Include vendor name in backend response
    items: order.items.map(item => ({
      product: { /* transformed product */ },
      quantity: item.quantity,
    })),
    status: statusMap[order.orderStatus],
    subtotal: order.totalAmount - 550, // Assuming fixed delivery fee
    deliveryFee: 550,
    address: order.deliveryAddress,
    landmark: '', // TODO: Add landmark to backend
    buyerName: '', // TODO: Include buyer name in backend response
    riderName: '', // TODO: Include rider name in backend response
    riderPhone: '', // TODO: Include rider phone in backend response
    createdAt: order.createdAt,
  };
}
```

**App Context Methods**:
```typescript
const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [shops, setShops] = useState<Shop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingShops, setIsLoadingShops] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  const fetchShops = async () => {
    setIsLoadingShops(true);
    try {
      const vendors = await apiClient.get<BackendVendor[]>('/vendors/search');
      const transformedShops = vendors.map(transformVendorToShop);
      setShops(transformedShops);
    } catch (error) {
      console.error('Failed to fetch shops:', error);
    } finally {
      setIsLoadingShops(false);
    }
  };

  const fetchProducts = async (vendorId: string) => {
    setIsLoadingProducts(true);
    try {
      const backendProducts = await apiClient.get<BackendProduct[]>(
        `/products?vendorId=${vendorId}`
      );
      const transformedProducts = backendProducts.map(transformProduct);
      setProducts(transformedProducts);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const fetchOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const backendOrders = await apiClient.get<BackendOrder[]>('/orders');
      const transformedOrders = backendOrders.map(transformOrder);
      setOrders(transformedOrders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const placeOrder = async (landmark: string, address: string): Promise<Order> => {
    const { user } = useAuthStore.getState();
    const items = cart.map(item => ({
      productId: item.product.id,
      quantity: item.quantity,
    }));
    
    const backendOrder = await apiClient.post<BackendOrder>('/orders', {
      vendorId: cart[0].product.shopId,
      items,
      deliveryAddress: address,
      deliveryPhoneNumber: user?.phone || '',
    });
    
    const transformedOrder = transformOrder(backendOrder);
    setOrders(prev => [transformedOrder, ...prev]);
    clearCart();
    
    return transformedOrder;
  };

  const updateOrderStatus = async (orderId: string, action: string) => {
    const endpoint = getStatusEndpoint(action);
    await apiClient.patch(`/orders/${orderId}/${endpoint}`, {});
    await fetchOrders(); // Refresh orders
  };

  // ... cart methods remain unchanged (local state)

  return (
    <AppContext.Provider value={{ /* ... */ }}>
      {children}
    </AppContext.Provider>
  );
}
```

### Socket.IO Client Interface

**Module**: `src/services/socketClient.ts`

**Type Definitions**:
```typescript
interface SocketClient {
  connect: (token: string) => void;
  disconnect: () => void;
  on: (event: string, handler: (data: any) => void) => void;
  off: (event: string) => void;
  isConnected: () => boolean;
}
```

**Implementation**:
```typescript
import { io, Socket } from 'socket.io-client';

class SocketClientImpl implements SocketClient {
  private socket: Socket | null = null;
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  connect(token: string) {
    if (this.socket?.connected) return;

    this.socket = io(this.baseURL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('Socket.IO connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket.IO disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
    });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  on(event: string, handler: (data: any) => void) {
    this.socket?.on(event, handler);
  }

  off(event: string) {
    this.socket?.off(event);
  }

  isConnected() {
    return this.socket?.connected ?? false;
  }
}

export const socketClient = new SocketClientImpl(
  Constants.expoConfig?.extra?.apiUrl || 'http://192.168.1.100:3000'
);
```

**Socket Event Handlers in App Context**:
```typescript
// In AppProvider
useEffect(() => {
  const { token, user } = useAuthStore.getState();
  
  if (token && user) {
    socketClient.connect(token);
    
    // Register event handlers based on role
    if (user.role === 'vendor') {
      socketClient.on('orderCreated', (data) => {
        console.log('New order received:', data);
        fetchOrders(); // Refresh orders list
        // Show local notification
      });
      
      socketClient.on('paymentConfirmed', (data) => {
        console.log('Payment confirmed:', data);
        fetchOrders();
      });
    }
    
    if (user.role === 'buyer') {
      socketClient.on('orderStatusChanged', (data) => {
        console.log('Order status changed:', data);
        // Update specific order in state
        setOrders(prev => 
          prev.map(order => 
            order.id === data.orderId 
              ? { ...order, status: mapBackendStatus(data.newStatus) }
              : order
          )
        );
      });
    }
    
    if (user.role === 'rider') {
      socketClient.on('orderReadyForPickup', (data) => {
        console.log('New order ready for pickup:', data);
        fetchOrders();
      });
    }
  }
  
  return () => {
    socketClient.disconnect();
  };
}, []);
```

### Upload Service Interface

**Module**: `src/services/uploadService.ts`

**Type Definitions**:
```typescript
interface UploadResponse {
  url: string;
}

interface UploadService {
  uploadImage: (uri: string) => Promise<string>;
}
```

**Implementation**:
```typescript
export const uploadService: UploadService = {
  uploadImage: async (uri: string): Promise<string> => {
    // Validate file size
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (fileInfo.size && fileInfo.size > 5 * 1024 * 1024) {
      throw new Error('File size must be less than 5MB');
    }

    // Create form data
    const formData = new FormData();
    formData.append('file', {
      uri,
      type: 'image/jpeg',
      name: 'upload.jpg',
    } as any);

    // Get token
    const token = await AsyncStorage.getItem('@oja/auth_token');
    if (!token) {
      throw new Error('Authentication required');
    }

    // Upload to backend
    const response = await fetch(`${apiClient.config.baseURL}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data: UploadResponse = await response.json();
    return data.url;
  },
};
```

### Screen Integration Patterns

#### Buyer Screen Integration

**BuyerHomeScreen.tsx**:
```typescript
export function BuyerHomeScreen() {
  const { shops, isLoadingShops, fetchShops } = useApp();
  
  useEffect(() => {
    fetchShops();
  }, []);
  
  return (
    <View>
      {isLoadingShops ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={shops}
          renderItem={({ item }) => <ShopCard shop={item} />}
        />
      )}
    </View>
  );
}
```

**BuyerStorefrontScreen.tsx**:
```typescript
export function BuyerStorefrontScreen({ route }: Props) {
  const { shopId } = route.params;
  const { products, isLoadingProducts, fetchProducts } = useApp();
  
  useEffect(() => {
    fetchProducts(shopId);
  }, [shopId]);
  
  return (
    <View>
      {isLoadingProducts ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={products}
          renderItem={({ item }) => <ProductCard product={item} />}
        />
      )}
    </View>
  );
}
```

**BuyerCheckoutScreen.tsx**:
```typescript
export function BuyerCheckoutScreen({ navigation }: Props) {
  const { placeOrder } = useApp();
  const [landmark, setLandmark] = useState('');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleCheckout = async () => {
    setIsSubmitting(true);
    try {
      const order = await placeOrder(landmark, address);
      navigation.navigate('BuyerOrderPlaced', { order });
    } catch (error) {
      Alert.alert('Error', 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <View>
      <TextInput value={landmark} onChangeText={setLandmark} />
      <TextInput value={address} onChangeText={setAddress} />
      <Button 
        title="Place Order" 
        onPress={handleCheckout}
        disabled={isSubmitting}
      />
    </View>
  );
}
```

#### Vendor Screen Integration

**VendorDashboardScreen.tsx**:
```typescript
export function VendorDashboardScreen() {
  const { orders, fetchOrders, updateOrderStatus } = useApp();
  const [selectedTab, setSelectedTab] = useState('pending');
  
  useEffect(() => {
    fetchOrders();
  }, []);
  
  const filteredOrders = orders.filter(order => {
    if (selectedTab === 'pending') return order.status === 'placed';
    if (selectedTab === 'ready') return order.status === 'accepted';
    return false;
  });
  
  const handleAcceptOrder = async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, 'accept');
      Alert.alert('Success', 'Order accepted and ready for pickup');
    } catch (error) {
      Alert.alert('Error', 'Failed to accept order');
    }
  };
  
  return (
    <View>
      <Tabs selected={selectedTab} onChange={setSelectedTab} />
      <FlatList
        data={filteredOrders}
        renderItem={({ item }) => (
          <OrderCard 
            order={item}
            onAccept={() => handleAcceptOrder(item.id)}
          />
        )}
      />
    </View>
  );
}
```

**VendorInventoryScreen.tsx**:
```typescript
export function VendorInventoryScreen() {
  const { products, fetchProducts } = useApp();
  const { user } = useAuthStore();
  
  useEffect(() => {
    if (user) {
      fetchProducts(user.id); // Assuming vendorId = userId
    }
  }, [user]);
  
  const handleToggleStock = async (productId: string, inStock: boolean) => {
    try {
      await apiClient.patch(`/products/${productId}`, { 
        stockQuantity: inStock ? 10 : 0 
      });
      fetchProducts(user!.id);
    } catch (error) {
      Alert.alert('Error', 'Failed to update product');
    }
  };
  
  return (
    <FlatList
      data={products}
      renderItem={({ item }) => (
        <ProductRow
          product={item}
          onToggleStock={() => handleToggleStock(item.id, !item.inStock)}
        />
      )}
    />
  );
}
```

#### Rider Screen Integration

**RiderJobBoardScreen.tsx**:
```typescript
export function RiderJobBoardScreen() {
  const { orders, fetchOrders, updateOrderStatus } = useApp();
  
  useEffect(() => {
    fetchOrders();
  }, []);
  
  const availableJobs = orders.filter(
    order => order.status === 'accepted' // READY_FOR_PICKUP
  );
  
  const handleAcceptJob = async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, 'assign-rider');
      Alert.alert('Success', 'Job accepted! Navigate to pickup location');
    } catch (error) {
      Alert.alert('Error', 'Failed to accept job');
    }
  };
  
  return (
    <FlatList
      data={availableJobs}
      renderItem={({ item }) => (
        <JobCard
          order={item}
          onAccept={() => handleAcceptJob(item.id)}
        />
      )}
    />
  );
}
```

#### Onboarding Screen Integration

**VendorSetupScreen.tsx**:
```typescript
export function VendorSetupScreen({ navigation }: Props) {
  const [shopName, setShopName] = useState('');
  const [category, setCategory] = useState('');
  const [landmark, setLandmark] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSelectPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };
  
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Upload photo first
      let photoUrl = '';
      if (photoUri) {
        photoUrl = await uploadService.uploadImage(photoUri);
      }
      
      // Register vendor profile
      await apiClient.post('/vendors/register', {
        shopName,
        category,
        landmark,
        openingHours: '9:00 AM - 5:00 PM',
        photoUrl,
      });
      
      navigation.navigate('VendorDashboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to register vendor profile');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <ScrollView>
      <TextInput value={shopName} onChangeText={setShopName} />
      <Picker selectedValue={category} onValueChange={setCategory}>
        <Picker.Item label="Groceries" value="Groceries" />
        <Picker.Item label="Food" value="Food" />
        {/* ... */}
      </Picker>
      <TextInput value={landmark} onChangeText={setLandmark} />
      <Button title="Select Photo" onPress={handleSelectPhoto} />
      {photoUri && <Image source={{ uri: photoUri }} />}
      <Button 
        title="Complete Setup"
        onPress={handleSubmit}
        disabled={isSubmitting}
      />
    </ScrollView>
  );
}
```

### Environment Configuration

**Configuration File**: `app.config.js`

```javascript
export default {
  expo: {
    name: 'Oja',
    slug: 'oja',
    version: '1.0.0',
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.100:3000',
    },
    // ... other config
  },
};
```

**Environment Files**:

`.env` (development):
```
EXPO_PUBLIC_API_URL=http://192.168.1.100:3000
```

`.env.production`:
```
EXPO_PUBLIC_API_URL=https://api.oja.ng
```

`.env.example`:
```
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:3000
```

**Usage in Code**:
```typescript
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000';
```



## Data Models

### Frontend Data Models

These models maintain compatibility with the existing mock data structure to minimize changes to screens.

#### Product Model

```typescript
interface Product {
  id: string;              // Transformed from backend _id
  shopId: string;          // Transformed from backend vendorId
  name: string;
  category: string;
  price: number;           // In Naira
  unit: string;            // "1 piece", "1kg", etc. (derived or default)
  emoji: string;           // Derived from category mapping
  inStock: boolean;        // Computed from stockQuantity > 0
  description: string;
}
```

**Transformation Logic**:
- `_id` → `id`
- `vendorId` → `shopId`
- `stockQuantity > 0` → `inStock = true`
- Category string → emoji mapping via `getCategoryEmoji()` helper

#### Shop Model

```typescript
interface Shop {
  id: string;              // Transformed from backend vendor._id
  name: string;            // From vendor.shopName
  category: string;
  distance: string;        // "0.5km" (TODO: calculate from coordinates)
  eta: string;             // "5-10 mins" (TODO: calculate from distance)
  rating: number;          // 4.8 (TODO: integrate reviews system)
  landmark: string;
  hero: string;            // shopName.toUpperCase()
  accent: string;          // Color based on category
}
```

**Transformation Logic**:
- `_id` → `id`
- `shopName` → `name`
- `shopName` → `hero` (uppercase)
- `category` → `accent` (color mapping)

#### Order Model

```typescript
interface Order {
  id: string;              // Transformed from backend _id
  shopId: string;          // From vendorId
  shopName: string;        // TODO: Include in backend response or fetch separately
  items: CartItem[];       // Transformed from backend items array
  status: OrderStatus;     // Mapped from backend orderStatus
  subtotal: number;        // totalAmount - deliveryFee
  deliveryFee: number;     // Fixed at 550 for now
  address: string;         // From deliveryAddress
  landmark: string;        // TODO: Add to backend order model
  buyerName: string;       // TODO: Include in backend response
  riderName: string;       // TODO: Include in backend response
  riderPhone: string;      // TODO: Include in backend response
  createdAt: string;       // ISO 8601 timestamp
}

type OrderStatus = 
  | 'placed'           // Maps to PENDING_ACCEPTANCE
  | 'accepted'         // Maps to READY_FOR_PICKUP
  | 'packed'           // Not used in backend (legacy)
  | 'with-rider'       // Maps to OUT_FOR_DELIVERY
  | 'arrived'          // Not used in backend (legacy)
  | 'paid'             // Not used as status (legacy)
  | 'delivered';       // Maps to DELIVERED
```

**Status Mapping**:
```typescript
const backendToFrontendStatus = {
  'PENDING_ACCEPTANCE': 'placed',
  'READY_FOR_PICKUP': 'accepted',
  'OUT_FOR_DELIVERY': 'with-rider',
  'DELIVERED': 'delivered',
};

const frontendToBackendAction = {
  'accept': 'accept',           // PENDING_ACCEPTANCE → READY_FOR_PICKUP
  'assign-rider': 'pickup',     // READY_FOR_PICKUP → OUT_FOR_DELIVERY
  'complete': 'deliver',        // OUT_FOR_DELIVERY → DELIVERED
};
```

#### CartItem Model

```typescript
interface CartItem {
  product: Product;
  quantity: number;
}
```

**Note**: Cart is managed entirely in frontend state and not synchronized with backend.

#### User Model

```typescript
interface User {
  id: string;              // From backend _id
  name: string;
  role: 'buyer' | 'vendor' | 'rider';
  phone: string;           // Format: +234XXXXXXXXXX
}
```

### Backend Integration Models

These types represent the data structures returned by the backend API.

#### Backend Vendor Response

```typescript
interface BackendVendor {
  _id: string;
  userId: string;
  shopName: string;
  category: 'Groceries' | 'Food' | 'Electronics' | 'Fashion' | 'Health' | 'Services';
  landmark: string;
  openingHours: string;
  operationalStatus: 'OPEN' | 'CLOSED';
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
}
```

#### Backend Product Response

```typescript
interface BackendProduct {
  _id: string;
  vendorId: string;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  category: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}
```

#### Backend Order Response

```typescript
interface BackendOrder {
  _id: string;
  buyerId: string;
  vendorId: string;
  riderId: string | null;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  deliveryAddress: string;
  deliveryPhoneNumber: string;
  qrCode: string;
  orderStatus: 'PENDING_ACCEPTANCE' | 'READY_FOR_PICKUP' | 'OUT_FOR_DELIVERY' | 'DELIVERED';
  paymentStatus: 'UNPAID' | 'PENDING_CONFIRMATION' | 'PAID';
  paystackReference: string | null;
  createdAt: string;
  updatedAt: string;
}
```

### Data Consistency Rules

#### Token-User Consistency

- Token and user must be stored/cleared atomically in AsyncStorage
- If token exists but GET /auth/me fails, both must be cleared
- User role in token payload must match user role in state

#### Cart-Order Consistency

- Cart cleared immediately after successful order placement
- Order not created if any product has insufficient stock
- Cart remains intact if order placement fails

#### Order Status Consistency

- Frontend status updates only after successful API response
- Socket.IO events update state optimistically (can be out of sync briefly)
- Fetch orders on screen focus to ensure latest state

#### Product Stock Consistency

- Stock status derived from backend stockQuantity
- Products with stockQuantity = 0 shown as "Out of Stock"
- Cart validation on checkout to prevent ordering out-of-stock items



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all 77 acceptance criteria, I've identified the following areas where properties can be consolidated:

**Consolidated Areas:**
1. **API Call Verification**: Many criteria test that specific screens call specific API endpoints - these are examples, not properties that need universal quantification
2. **Error Handling**: Multiple criteria test error message display - consolidated into properties about error handling patterns
3. **Data Transformation**: Several criteria test backend-to-frontend data mapping - consolidated into transformation properties
4. **Authentication Flow**: Multiple OTP and session criteria - consolidated into auth lifecycle properties
5. **Real-time Updates**: Multiple socket event criteria - consolidated into event handling properties

The properties below eliminate redundancy while ensuring comprehensive coverage of the API integration behavior.

### Authentication Properties

#### Property 1: Token Injection

*For any* authenticated API request made through the API client, if a valid token exists in AsyncStorage, the request SHALL include an `Authorization: Bearer <token>` header.

**Validates: Requirements 1.2**

#### Property 2: OTP Verification Storage

*For any* successful OTP verification response, the frontend SHALL atomically store both the JWT token in AsyncStorage under `@oja/auth_token` AND the user object in AsyncStorage under `@oja/user`.

**Validates: Requirements 2.3, 2.4**

#### Property 3: Session Persistence

*For any* app launch, if a token exists in AsyncStorage and GET /auth/me returns a valid user object, the auth store SHALL restore the user state with the matching user data.

**Validates: Requirements 2.6, 2.7**

### Error Handling Properties

#### Property 4: Network Error Messages

*For any* network error encountered during an API request (timeout, connection failure, no internet), the API client SHALL return an error with a user-friendly message that does not expose technical implementation details.

**Validates: Requirements 1.5, 7.6, 11.5**

#### Property 5: 401 Session Clearing

*For any* API request that receives a 401 Unauthorized response, the API client SHALL clear both `@oja/auth_token` and `@oja/user` from AsyncStorage and reset the auth store to logged-out state.

**Validates: Requirements 1.4**

### Data Transformation Properties

#### Property 6: Backend ID Transformation

*For any* backend entity with an `_id` field (vendor, product, order), when transformed to a frontend entity, the `_id` SHALL be mapped to the `id` field.

**Validates: Requirements 4.5**

#### Property 7: Order Status Mapping

*For any* backend order status value (`PENDING_ACCEPTANCE`, `READY_FOR_PICKUP`, `OUT_FOR_DELIVERY`, `DELIVERED`), the frontend SHALL map it to the corresponding frontend status string (`placed`, `accepted`, `with-rider`, `delivered`).

**Validates: Requirements 4.6**

#### Property 8: Status Action Mapping

*For any* frontend order status transition action (`accept`, `assign-rider`, `complete`), the App Context SHALL call the corresponding backend API endpoint (`/orders/:id/accept`, `/orders/:id/pickup`, `/orders/:id/deliver`).

**Validates: Requirements 3.5**

### Cart and Order Properties

#### Property 9: Cart Locality

*For any* cart operation (add, remove, clear), the frontend SHALL NOT make any API calls to the backend - all cart state SHALL be managed purely in local React state.

**Validates: Requirements 3.8**

#### Property 10: Order Placement Side Effects

*For any* successful order placement, the frontend SHALL perform all of the following atomically: (1) add the returned order to the local orders array, (2) clear the cart state, (3) navigate to the OrderPlacedScreen with the order object.

**Validates: Requirements 4.3, 4.4**

### Socket.IO Properties

#### Property 11: Socket Event State Updates

*For any* Socket.IO order event received (`orderCreated`, `orderStatusChanged`, `orderReadyForPickup`, `paymentConfirmed`), the App Context SHALL update the corresponding local state (orders array, order status) to reflect the event data.

**Validates: Requirements 8.3**

#### Property 12: App State Socket Lifecycle

*For any* app state transition to background, the Socket.IO client SHALL disconnect. *For any* app state transition to foreground with a valid authentication token, the Socket.IO client SHALL reconnect using that token.

**Validates: Requirements 8.7, 8.8**

### File Upload Properties

#### Property 13: File Size Validation

*For any* file selected for upload, if the file size exceeds 5MB, the frontend SHALL reject the upload with an error message BEFORE making any API request.

**Validates: Requirements 11.7**

#### Property 14: Upload URL Usage

*For any* successful file upload that returns a URL, any subsequent API call that requires an image URL (vendor registration, product creation, KYC submission) SHALL use the exact URL returned from the upload endpoint.

**Validates: Requirements 11.4**

### Integration Testing Properties

These properties validate the integration between screens and services:

#### Property 15: Screen Mount Data Fetching

*For any* screen that displays backend data (BuyerHomeScreen, VendorDashboardScreen, RiderJobBoardScreen), mounting the screen SHALL trigger the appropriate data fetching method from App Context (fetchShops, fetchOrders, etc.).

**Validates: Requirements 4.1, 5.1, 6.1**

#### Property 16: API Response Data Display

*For any* API response containing a list of entities (shops, products, orders), after successful fetch, the screen SHALL display all entities from the response that match the current filter criteria (if any).

**Validates: Requirements 4.7, 5.1, 6.1**



## Error Handling

### Error Categories and Handling Strategy

#### 1. Network Errors

**Types**:
- Connection timeout (request exceeds 10 seconds)
- No internet connection (device offline)
- DNS resolution failure
- Connection refused (server not running)

**Handling**:
```typescript
try {
  const response = await apiClient.get('/orders');
} catch (error) {
  if (error instanceof TimeoutError) {
    Alert.alert('Timeout', 'Request took too long. Please try again.');
  } else if (error instanceof NetworkError) {
    Alert.alert('Connection Error', error.message);
  }
}
```

**User Experience**:
- Show clear error message without technical jargon
- Provide retry button for failed requests
- Show offline indicator in UI when no connection
- Cache critical data for offline viewing

#### 2. Authentication Errors (401)

**Scenarios**:
- Token expired (after 7 days)
- Token invalid (corrupted or revoked)
- Token missing (cleared by user or system)

**Handling Strategy**:
```typescript
// In apiClient.ts
if (response.status === 401) {
  // Clear all auth data
  await AsyncStorage.multiRemove(['@oja/auth_token', '@oja/user']);
  
  // Reset auth store
  useAuthStore.getState().logout();
  
  // Navigate to login (or show modal)
  Alert.alert(
    'Session Expired',
    'Please login again to continue.',
    [
      {
        text: 'Login',
        onPress: () => navigationRef.current?.navigate('Login')
      }
    ]
  );
  
  throw new AuthError('Authentication required');
}
```

**User Experience**:
- Show session expired modal with clear message
- Provide immediate path to login screen
- Preserve user's intended action to resume after re-auth
- Don't show technical error details

#### 3. Validation Errors (400)

**Scenarios**:
- Missing required fields
- Invalid data format (phone number, price)
- Business rule violations (insufficient stock)
- Cart items from different vendors

**Handling Strategy**:
```typescript
try {
  await apiClient.post('/orders', orderData);
} catch (error) {
  if (error instanceof ValidationError) {
    // Show field-specific errors
    Alert.alert('Invalid Data', error.message);
    
    // If detailed errors available, show inline on form
    if (error.details) {
      Object.entries(error.details).forEach(([field, message]) => {
        setFieldError(field, message);
      });
    }
  }
}
```

**User Experience**:
- Show inline validation errors on forms
- Highlight invalid fields with red border
- Provide specific guidance on how to fix errors
- Prevent submission until all errors resolved

#### 4. Server Errors (500)

**Scenarios**:
- Unexpected backend exceptions
- Database connection failures
- Third-party service failures (Cloudinary, Paystack)

**Handling Strategy**:
```typescript
try {
  await apiClient.post('/orders', orderData);
} catch (error) {
  if (error instanceof ServerError) {
    // Log for debugging but show generic message to user
    console.error('Server error:', error);
    
    Alert.alert(
      'Something Went Wrong',
      'We're having trouble processing your request. Please try again later.',
      [
        { text: 'OK' },
        { text: 'Retry', onPress: () => retryRequest() }
      ]
    );
  }
}
```

**User Experience**:
- Show generic error message (no technical details)
- Provide retry option
- Log errors for debugging
- Consider exponential backoff for retries

#### 5. Upload Errors

**Scenarios**:
- File too large (> 5MB)
- Unsupported file format
- Network failure during upload
- Cloudinary service error

**Handling Strategy**:
```typescript
// Pre-upload validation
const validateFile = async (uri: string): Promise<void> => {
  const fileInfo = await FileSystem.getInfoAsync(uri);
  
  if (!fileInfo.exists) {
    throw new Error('File not found');
  }
  
  if (fileInfo.size && fileInfo.size > 5 * 1024 * 1024) {
    throw new Error('File size must be less than 5MB');
  }
};

// Upload with error handling
try {
  await validateFile(photoUri);
  const url = await uploadService.uploadImage(photoUri);
  setPhotoUrl(url);
} catch (error) {
  if (error.message.includes('5MB')) {
    Alert.alert('File Too Large', 'Please select an image smaller than 5MB');
  } else {
    Alert.alert('Upload Failed', 'Failed to upload image. Please try again.');
  }
}
```

**User Experience**:
- Validate file size BEFORE uploading (save bandwidth)
- Show upload progress bar
- Clear error messages for common issues
- Allow retry without re-selecting file

#### 6. Socket.IO Errors

**Scenarios**:
- Connection failure
- Authentication error on handshake
- Event handler exceptions
- Unexpected disconnection

**Handling Strategy**:
```typescript
// Connection error handling
socket.on('connect_error', (error) => {
  console.error('Socket connection error:', error);
  // Don't show alert - will auto-retry
  // Show offline indicator in UI
});

socket.on('error', (error) => {
  console.error('Socket error:', error);
  // Log but don't alert user
});

// Reconnection handling
socket.io.on('reconnect', (attempt) => {
  console.log('Socket reconnected after', attempt, 'attempts');
  // Fetch latest data to sync state
  fetchOrders();
});
```

**User Experience**:
- Auto-reconnect silently (don't alert user)
- Show subtle connectivity indicator
- Refresh data on reconnection
- Don't interrupt user flow for socket errors

### Error Recovery Strategies

#### Retry Logic

**Exponential Backoff**:
```typescript
async function retryRequest<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}
```

#### Offline Queue

For critical operations (order placement):
```typescript
// Queue failed operations
const offlineQueue: Array<{ operation: string; data: any }> = [];

async function placeOrderWithOfflineSupport(orderData: any) {
  try {
    return await apiClient.post('/orders', orderData);
  } catch (error) {
    if (error instanceof NetworkError) {
      // Queue for later
      offlineQueue.push({ operation: 'placeOrder', data: orderData });
      
      Alert.alert(
        'Offline',
        'Your order has been saved and will be submitted when connection is restored.'
      );
    } else {
      throw error;
    }
  }
}

// Process queue when connection restored
NetInfo.addEventListener(state => {
  if (state.isConnected && offlineQueue.length > 0) {
    processOfflineQueue();
  }
});
```

### Error Logging

**Development**:
- Console.log all errors with full details
- Show error details in debug modal

**Production**:
- Send errors to error tracking service (e.g., Sentry)
- Log user ID, timestamp, error type, API endpoint
- Don't log sensitive data (tokens, passwords)

```typescript
function logError(error: Error, context: any) {
  if (__DEV__) {
    console.error('Error:', error);
    console.error('Context:', context);
  } else {
    // Send to error tracking service
    Sentry.captureException(error, {
      contexts: { api: context },
    });
  }
}
```



## Testing Strategy

### Overview

The API integration requires a dual testing approach combining unit tests for specific examples and property-based tests for universal correctness properties. Both testing approaches are complementary and necessary for comprehensive coverage.

**Testing Philosophy**:
- **Unit tests** verify specific examples, edge cases, and error conditions
- **Property-based tests** verify universal properties across randomized inputs
- **Integration tests** verify correct interaction between screens and services
- Together they provide comprehensive coverage without redundancy

### Property-Based Testing

#### Framework Selection

**React Native / TypeScript**: Use **fast-check** library
```bash
npm install --save-dev fast-check @types/fast-check
```

**Why fast-check**:
- Native TypeScript support with excellent type inference
- Shrinking capability to find minimal failing cases
- Configurable number of test iterations
- Built-in generators for common types
- Works seamlessly with Jest

#### Configuration

Each property-based test MUST:
- Run minimum **100 iterations** (due to randomization)
- Include a comment tag referencing the design document property
- Use descriptive test names that match the property title
- Generate realistic test data that matches production constraints

**Example Configuration**:
```typescript
import fc from 'fast-check';

describe('API Integration Properties', () => {
  it('Property 1: Token Injection', () => {
    /**
     * Feature: api-integration
     * Property 1: For any authenticated API request made through the API client, 
     * if a valid token exists in AsyncStorage, the request SHALL include an 
     * Authorization: Bearer <token> header.
     */
    fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 20, maxLength: 200 }), // JWT token
        fc.constantFrom('GET', 'POST', 'PATCH', 'DELETE'), // HTTP method
        fc.webPath(), // API path
        async (token, method, path) => {
          // Test implementation
          await AsyncStorage.setItem('@oja/auth_token', token);
          
          // Make request and capture headers
          const capturedHeaders = await captureRequestHeaders(() =>
            apiClient[method.toLowerCase()](path, {})
          );
          
          // Verify Authorization header exists and matches
          expect(capturedHeaders['Authorization']).toBe(`Bearer ${token}`);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

#### Test Data Generators

**Custom Generators for Domain Types**:
```typescript
// Generator for backend order status
const orderStatusGen = fc.constantFrom(
  'PENDING_ACCEPTANCE',
  'READY_FOR_PICKUP',
  'OUT_FOR_DELIVERY',
  'DELIVERED'
);

// Generator for user role
const userRoleGen = fc.constantFrom('buyer', 'vendor', 'rider');

// Generator for phone number
const phoneNumberGen = fc.string({ minLength: 10, maxLength: 10 })
  .map(digits => `+234${digits}`);

// Generator for MongoDB ObjectId
const objectIdGen = fc.hexaString({ minLength: 24, maxLength: 24 });

// Generator for product
const productGen = fc.record({
  _id: objectIdGen,
  vendorId: objectIdGen,
  name: fc.string({ minLength: 3, maxLength: 50 }),
  description: fc.string({ minLength: 10, maxLength: 200 }),
  price: fc.integer({ min: 100, max: 50000 }),
  stockQuantity: fc.integer({ min: 0, max: 100 }),
  category: fc.constantFrom('Groceries', 'Food', 'Electronics', 'Fashion'),
  imageUrl: fc.webUrl(),
});

// Generator for order
const orderGen = fc.record({
  _id: objectIdGen,
  buyerId: objectIdGen,
  vendorId: objectIdGen,
  riderId: fc.option(objectIdGen, { nil: null }),
  items: fc.array(
    fc.record({
      productId: objectIdGen,
      quantity: fc.integer({ min: 1, max: 10 }),
      price: fc.integer({ min: 100, max: 10000 }),
    }),
    { minLength: 1, maxLength: 5 }
  ),
  totalAmount: fc.integer({ min: 500, max: 100000 }),
  deliveryAddress: fc.string({ minLength: 10, maxLength: 100 }),
  deliveryPhoneNumber: phoneNumberGen,
  qrCode: fc.uuid(),
  orderStatus: orderStatusGen,
  paymentStatus: fc.constantFrom('UNPAID', 'PENDING_CONFIRMATION', 'PAID'),
  createdAt: fc.date().map(d => d.toISOString()),
});
```

#### Property Test Implementation Examples

**Property 6: Backend ID Transformation**
```typescript
it('Property 6: Backend ID Transformation', () => {
  /**
   * Feature: api-integration
   * Property 6: For any backend entity with an _id field (vendor, product, order), 
   * when transformed to a frontend entity, the _id SHALL be mapped to the id field.
   */
  fc.assert(
    fc.property(productGen, (backendProduct) => {
      const frontendProduct = transformProduct(backendProduct);
      
      // Verify _id transformed to id
      expect(frontendProduct.id).toBe(backendProduct._id);
      expect(frontendProduct).not.toHaveProperty('_id');
    }),
    { numRuns: 100 }
  );
});
```

**Property 7: Order Status Mapping**
```typescript
it('Property 7: Order Status Mapping', () => {
  /**
   * Feature: api-integration
   * Property 7: For any backend order status value, the frontend SHALL map it 
   * to the corresponding frontend status string.
   */
  fc.assert(
    fc.property(orderStatusGen, (backendStatus) => {
      const frontendStatus = mapBackendStatus(backendStatus);
      
      const expectedMapping = {
        'PENDING_ACCEPTANCE': 'placed',
        'READY_FOR_PICKUP': 'accepted',
        'OUT_FOR_DELIVERY': 'with-rider',
        'DELIVERED': 'delivered',
      };
      
      expect(frontendStatus).toBe(expectedMapping[backendStatus]);
    }),
    { numRuns: 100 }
  );
});
```

**Property 9: Cart Locality**
```typescript
it('Property 9: Cart Locality', () => {
  /**
   * Feature: api-integration
   * Property 9: For any cart operation (add, remove, clear), the frontend 
   * SHALL NOT make any API calls to the backend.
   */
  fc.assert(
    fc.property(
      productGen,
      fc.integer({ min: 1, max: 10 }), // quantity
      async (product, quantity) => {
        // Mock API client to track calls
        const apiCallsMade: string[] = [];
        jest.spyOn(apiClient, 'post').mockImplementation(async (path) => {
          apiCallsMade.push(path);
          return {};
        });
        
        const { addToCart, removeFromCart, clearCart } = useApp.getState();
        const frontendProduct = transformProduct(product);
        
        // Perform cart operations
        addToCart(frontendProduct);
        removeFromCart(frontendProduct.id);
        clearCart();
        
        // Verify no API calls were made
        expect(apiCallsMade).toHaveLength(0);
      }
    ),
    { numRuns: 100 }
  );
});
```

**Property 13: File Size Validation**
```typescript
it('Property 13: File Size Validation', () => {
  /**
   * Feature: api-integration
   * Property 13: For any file selected for upload, if the file size exceeds 5MB, 
   * the frontend SHALL reject the upload with an error message BEFORE making any API request.
   */
  fc.assert(
    fc.asyncProperty(
      fc.integer({ min: 5_242_881, max: 50_000_000 }), // > 5MB in bytes
      fc.webUrl(), // file URI
      async (fileSize, fileUri) => {
        // Mock file info
        jest.spyOn(FileSystem, 'getInfoAsync').mockResolvedValue({
          exists: true,
          size: fileSize,
          isDirectory: false,
          uri: fileUri,
          modificationTime: Date.now(),
        });
        
        // Mock fetch to track if API was called
        const fetchSpy = jest.spyOn(global, 'fetch');
        
        // Attempt upload
        await expect(uploadService.uploadImage(fileUri)).rejects.toThrow('5MB');
        
        // Verify no API call was made
        expect(fetchSpy).not.toHaveBeenCalled();
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Testing

#### Test Organization

```
src/
  services/
    __tests__/
      apiClient.test.ts
      socketClient.test.ts
      uploadService.test.ts
  stores/
    __tests__/
      authStore.test.ts
  context/
    __tests__/
      AppContext.test.ts
  screens/
    __tests__/
      BuyerHomeScreen.test.tsx
      VendorDashboardScreen.test.tsx
      RiderJobBoardScreen.test.tsx
```

#### Unit Test Examples

**API Client Error Handling**
```typescript
describe('ApiClient', () => {
  describe('Error Handling', () => {
    it('should handle 401 by clearing auth and navigating to login', async () => {
      // Mock 401 response
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      });
      
      // Set up auth data
      await AsyncStorage.setItem('@oja/auth_token', 'expired-token');
      await AsyncStorage.setItem('@oja/user', JSON.stringify({ id: '123' }));
      
      // Make request
      await expect(apiClient.get('/orders')).rejects.toThrow('Authentication required');
      
      // Verify auth cleared
      const token = await AsyncStorage.getItem('@oja/auth_token');
      const user = await AsyncStorage.getItem('@oja/user');
      expect(token).toBeNull();
      expect(user).toBeNull();
    });
    
    it('should provide user-friendly message for network errors', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network request failed'));
      
      await expect(apiClient.get('/orders')).rejects.toThrow('Please check your network');
    });
    
    it('should timeout requests after 10 seconds', async () => {
      global.fetch = jest.fn().mockImplementation(() => 
        new Promise((resolve) => setTimeout(resolve, 15000))
      );
      
      const start = Date.now();
      await expect(apiClient.get('/orders')).rejects.toThrow('timed out');
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(11000); // Should timeout around 10 seconds
    });
  });
});
```

**Auth Store OTP Flow**
```typescript
describe('AuthStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useAuthStore.getState().logout();
  });
  
  describe('sendOtp', () => {
    it('should call POST /auth/send-otp with phone number', async () => {
      const postSpy = jest.spyOn(apiClient, 'post').mockResolvedValue({});
      
      await useAuthStore.getState().sendOtp('+2348012345678');
      
      expect(postSpy).toHaveBeenCalledWith('/auth/send-otp', {
        phoneNumber: '+2348012345678',
      });
    });
    
    it('should set error state on failure', async () => {
      jest.spyOn(apiClient, 'post').mockRejectedValue(new Error('Network error'));
      
      await useAuthStore.getState().sendOtp('+2348012345678');
      
      expect(useAuthStore.getState().error).toBe('Network error');
    });
  });
  
  describe('verifyOtp', () => {
    it('should store token and user on success', async () => {
      const mockResponse = {
        token: 'jwt-token-123',
        user: { id: 'user-1', name: 'John', role: 'buyer', phone: '+2348012345678' },
      };
      
      jest.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);
      
      await useAuthStore.getState().verifyOtp('+2348012345678', '123456');
      
      // Verify AsyncStorage
      const token = await AsyncStorage.getItem('@oja/auth_token');
      const user = await AsyncStorage.getItem('@oja/user');
      expect(token).toBe('jwt-token-123');
      expect(JSON.parse(user!)).toEqual(mockResponse.user);
      
      // Verify store state
      expect(useAuthStore.getState().token).toBe('jwt-token-123');
      expect(useAuthStore.getState().user).toEqual(mockResponse.user);
    });
  });
  
  describe('loadSession', () => {
    it('should restore user from valid token', async () => {
      const mockUser = { id: 'user-1', name: 'John', role: 'buyer', phone: '+2348012345678' };
      
      await AsyncStorage.setItem('@oja/auth_token', 'valid-token');
      jest.spyOn(apiClient, 'get').mockResolvedValue(mockUser);
      
      await useAuthStore.getState().loadSession();
      
      expect(useAuthStore.getState().user).toEqual(mockUser);
      expect(useAuthStore.getState().token).toBe('valid-token');
    });
    
    it('should clear session on invalid token', async () => {
      await AsyncStorage.setItem('@oja/auth_token', 'invalid-token');
      jest.spyOn(apiClient, 'get').mockRejectedValue(new Error('Unauthorized'));
      
      await useAuthStore.getState().loadSession();
      
      const token = await AsyncStorage.getItem('@oja/auth_token');
      expect(token).toBeNull();
      expect(useAuthStore.getState().user).toBeNull();
    });
  });
});
```

**Socket.IO Integration**
```typescript
describe('SocketClient', () => {
  let mockSocket: any;
  
  beforeEach(() => {
    mockSocket = {
      connected: false,
      on: jest.fn(),
      off: jest.fn(),
      disconnect: jest.fn(),
    };
    
    (io as jest.Mock).mockReturnValue(mockSocket);
  });
  
  it('should connect with authentication token', () => {
    socketClient.connect('jwt-token-123');
    
    expect(io).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        auth: { token: 'jwt-token-123' },
        transports: ['websocket'],
      })
    );
  });
  
  it('should register event handlers', () => {
    socketClient.connect('token');
    
    const handler = jest.fn();
    socketClient.on('orderCreated', handler);
    
    expect(mockSocket.on).toHaveBeenCalledWith('orderCreated', handler);
  });
  
  it('should disconnect socket', () => {
    socketClient.connect('token');
    socketClient.disconnect();
    
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });
});
```

**Data Transformation**
```typescript
describe('Data Transformation', () => {
  describe('transformProduct', () => {
    it('should map _id to id', () => {
      const backendProduct = {
        _id: '507f1f77bcf86cd799439011',
        vendorId: '507f1f77bcf86cd799439012',
        name: 'Rice',
        description: 'Long grain rice',
        price: 5000,
        stockQuantity: 50,
        category: 'Groceries',
        imageUrl: 'https://example.com/rice.jpg',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };
      
      const frontend = transformProduct(backendProduct);
      
      expect(frontend.id).toBe('507f1f77bcf86cd799439011');
      expect(frontend.shopId).toBe('507f1f77bcf86cd799439012');
      expect(frontend).not.toHaveProperty('_id');
      expect(frontend).not.toHaveProperty('vendorId');
    });
    
    it('should compute inStock from stockQuantity', () => {
      const inStock = transformProduct({ ...baseProduct, stockQuantity: 10 });
      const outOfStock = transformProduct({ ...baseProduct, stockQuantity: 0 });
      
      expect(inStock.inStock).toBe(true);
      expect(outOfStock.inStock).toBe(false);
    });
  });
});
```

**Screen Integration**
```typescript
describe('BuyerHomeScreen', () => {
  it('should fetch shops on mount', () => {
    const fetchShops = jest.fn();
    jest.spyOn(AppContext, 'useApp').mockReturnValue({
      fetchShops,
      shops: [],
      isLoadingShops: false,
    } as any);
    
    render(<BuyerHomeScreen />);
    
    expect(fetchShops).toHaveBeenCalledTimes(1);
  });
  
  it('should display loading indicator while fetching', () => {
    jest.spyOn(AppContext, 'useApp').mockReturnValue({
      fetchShops: jest.fn(),
      shops: [],
      isLoadingShops: true,
    } as any);
    
    const { getByTestId } = render(<BuyerHomeScreen />);
    
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });
  
  it('should render shop list after fetch', () => {
    const mockShops = [
      { id: '1', name: 'Shop A', category: 'Groceries', landmark: 'Near gate' },
      { id: '2', name: 'Shop B', category: 'Food', landmark: 'Main road' },
    ];
    
    jest.spyOn(AppContext, 'useApp').mockReturnValue({
      fetchShops: jest.fn(),
      shops: mockShops,
      isLoadingShops: false,
    } as any);
    
    const { getByText } = render(<BuyerHomeScreen />);
    
    expect(getByText('Shop A')).toBeTruthy();
    expect(getByText('Shop B')).toBeTruthy();
  });
});
```

### Integration Testing

#### Test Scope

Integration tests verify the interaction between multiple components:
- API Client → Auth Store → Screens
- App Context → Socket Client → UI Updates
- Upload Service → Form Screens → API

**Example: End-to-End Order Placement**
```typescript
describe('Order Placement Integration', () => {
  beforeEach(async () => {
    // Set up authenticated user
    await AsyncStorage.setItem('@oja/auth_token', 'test-token');
    useAuthStore.setState({
      user: { id: 'buyer-1', name: 'John', role: 'buyer', phone: '+2348012345678' },
      token: 'test-token',
    });
    
    // Mock API responses
    jest.spyOn(apiClient, 'post').mockResolvedValue({
      _id: 'order-123',
      buyerId: 'buyer-1',
      vendorId: 'vendor-1',
      items: [{ productId: 'product-1', quantity: 2, price: 1000 }],
      totalAmount: 2550,
      deliveryAddress: '123 Main St',
      orderStatus: 'PENDING_ACCEPTANCE',
      createdAt: new Date().toISOString(),
    });
  });
  
  it('should place order, clear cart, and navigate', async () => {
    const { placeOrder, cart, clearCart } = useApp.getState();
    const navigation = { navigate: jest.fn() };
    
    // Add items to cart
    addToCart({ id: 'product-1', name: 'Rice', price: 1000 });
    
    // Place order
    const order = await placeOrder('Near gate', '123 Main St');
    
    // Verify API call
    expect(apiClient.post).toHaveBeenCalledWith('/orders', expect.objectContaining({
      vendorId: 'vendor-1',
      items: expect.arrayContaining([
        expect.objectContaining({ productId: 'product-1', quantity: 1 }),
      ]),
    }));
    
    // Verify cart cleared
    expect(useApp.getState().cart).toHaveLength(0);
    
    // Verify order added to state
    expect(useApp.getState().orders).toContainEqual(
      expect.objectContaining({ id: 'order-123' })
    );
  });
});
```

### Test Coverage Goals

**Target Coverage**:
- **API Client**: 90% line coverage (focus on error paths)
- **Auth Store**: 95% line coverage (critical for security)
- **App Context**: 85% line coverage
- **Screen Integration**: 70% line coverage (focus on data fetching and state updates)
- **Data Transformations**: 100% line coverage (critical for data consistency)

**Critical Paths to Test**:
1. Authentication flow (OTP → token → session restore)
2. Order creation and status transitions
3. Error handling (network, 401, validation)
4. Data transformation (backend ↔ frontend)
5. Socket.IO event handling
6. File upload with validation

### Testing Tools and Setup

**Dependencies**:
```json
{
  "devDependencies": {
    "@testing-library/react-native": "^12.0.0",
    "@testing-library/jest-native": "^5.4.0",
    "jest": "^29.0.0",
    "fast-check": "^3.15.0",
    "@types/fast-check": "^3.15.0",
    "react-test-renderer": "^18.2.0",
    "@react-native-async-storage/async-storage": "^1.21.0"
  }
}
```

**Jest Configuration** (`jest.config.js`):
```javascript
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo|@react-navigation)/)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/__tests__/**',
  ],
  coverageThresholds: {
    global: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80,
    },
  },
};
```

**Test Setup** (`jest.setup.js`):
```javascript
import '@testing-library/jest-native/extend-expect';
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      apiUrl: 'http://localhost:3000',
    },
  },
}));

// Mock fetch
global.fetch = jest.fn();

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
```

### Running Tests

**Commands**:
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run only property-based tests
npm test -- --testNamePattern="Property"

# Run only unit tests
npm test -- --testPathPattern="__tests__"

# Run specific test file
npm test -- apiClient.test.ts
```

**CI/CD Integration**:
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```
