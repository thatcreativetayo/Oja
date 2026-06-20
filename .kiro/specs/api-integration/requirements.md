# Requirements Document: Oja Frontend-Backend API Integration

## Introduction

This feature connects the Oja React Native frontend application to its Express/TypeScript/MongoDB backend API. Currently, the frontend uses mock data from `src/constants/mockData.ts` and local state management in `src/context/AppContext.tsx`. This integration will replace all mock data with real API calls, implement proper authentication with token management, add real-time Socket.IO updates for order tracking, and enable file uploads for profile photos and product images.

The integration spans authentication flows, shop and product browsing, order placement and tracking, vendor inventory management, rider job assignment, and real-time notifications across all user roles (buyer, vendor, rider).

## Glossary

- **Frontend**: The Oja React Native mobile application built with Expo and TypeScript
- **Backend**: The Express/TypeScript/MongoDB REST API server
- **API_Client**: The HTTP client module that handles all API communication with authentication
- **Auth_Store**: Zustand state management store for user authentication and session persistence
- **App_Context**: React Context providing application state and data fetching functions
- **Mock_Data**: Static data currently used in `src/constants/mockData.ts`
- **Token**: JWT authentication token stored in AsyncStorage
- **Socket_Client**: Socket.IO client for real-time order and KYC updates
- **Order_Status**: Enum values for order lifecycle (PENDING_ACCEPTANCE, READY_FOR_PICKUP, OUT_FOR_DELIVERY, DELIVERED, CANCELLED)
- **User_Role**: Enum values for user types (buyer, vendor, rider)
- **AsyncStorage**: React Native's persistent key-value storage system
- **Zustand**: Lightweight state management library
- **QR_Token**: Verification token encoded in QR codes for order pickup/delivery verification

## Requirements

### Requirement 1: API Client with Token Management

**User Story:** As a developer, I want a typed API client with automatic token management, so that all API requests include authentication headers and handle errors consistently.

#### Acceptance Criteria

1. THE API_Client SHALL provide typed request methods for GET, POST, PATCH, and DELETE operations
2. WHEN a request is made, THE API_Client SHALL automatically attach the JWT token from AsyncStorage as an Authorization header
3. THE API_Client SHALL use the base URL from EXPO_PUBLIC_API_URL environment variable
4. WHEN a 401 Unauthorized response is received, THE API_Client SHALL clear the stored token and redirect to login
5. WHEN a network error occurs, THE API_Client SHALL return a user-friendly error message
6. THE API_Client SHALL support request timeout configuration with a default of 10 seconds

### Requirement 2: Authentication Store with OTP Flow

**User Story:** As a user, I want to authenticate using my phone number and OTP, so that I can securely access the app without managing passwords.

#### Acceptance Criteria

1. THE Auth_Store SHALL provide a sendOtp method that calls POST /api/auth/send-otp with a phone number
2. THE Auth_Store SHALL provide a verifyOtp method that calls POST /api/auth/verify-otp with phone number and OTP code
3. WHEN OTP verification succeeds, THE Auth_Store SHALL store the returned JWT token in AsyncStorage
4. WHEN OTP verification succeeds, THE Auth_Store SHALL store the user object (id, name, role, phone) in the store state
5. THE Auth_Store SHALL provide a logout method that clears the token from AsyncStorage and resets user state
6. THE Auth_Store SHALL provide a loadSession method that retrieves the stored token on app launch
7. WHEN loadSession finds a valid token, THE Auth_Store SHALL call GET /api/auth/me to restore user data
8. THE Auth_Store SHALL persist authentication state between app restarts

### Requirement 3: Replace Mock Data with Real API Calls

**User Story:** As a developer, I want to replace all mock data with real API calls, so that the app displays live data from the backend.

#### Acceptance Criteria

1. THE App_Context SHALL provide a fetchShops method that calls GET /api/vendors and returns an array of vendor profiles
2. THE App_Context SHALL provide a fetchProducts method that calls GET /api/products?vendorId={id} and returns products for a specific vendor
3. THE App_Context SHALL provide a fetchOrders method that calls GET /api/orders filtered by user role
4. THE App_Context SHALL provide a placeOrder method that calls POST /api/orders with items, delivery location, and landmark
5. THE App_Context SHALL provide an updateOrderStatus method that calls the appropriate PATCH endpoint based on status transition
6. THE App_Context SHALL automatically call fetchShops and fetchOrders when a user successfully logs in
7. THE App_Context SHALL remove all references to mockData.ts constants for shops, products, and orders
8. THE App_Context SHALL maintain local cart state (not synchronized with backend)

### Requirement 4: Buyer Screen API Integration

**User Story:** As a buyer, I want to browse shops, view products, place orders, and track deliveries using real data from the backend.

#### Acceptance Criteria

1. WHEN BuyerHomeScreen mounts, THE Frontend SHALL call fetchShops from App_Context
2. WHEN a buyer taps a shop, THE BuyerStorefrontScreen SHALL call fetchProducts with the shop's vendorId
3. WHEN a buyer completes checkout, THE BuyerCheckoutScreen SHALL call placeOrder asynchronously
4. WHEN placeOrder succeeds, THE Frontend SHALL navigate to BuyerOrderPlacedScreen with the returned order object
5. THE BuyerTrackingScreen SHALL use order._id instead of order.id for API calls
6. THE BuyerTrackingScreen SHALL map backend Order_Status values to display strings
7. THE BuyerHistoryScreen SHALL display orders from fetchOrders filtered by buyer role

### Requirement 5: Vendor Screen API Integration

**User Story:** As a vendor, I want to manage incoming orders, update inventory, and scan QR codes using real backend data.

#### Acceptance Criteria

1. WHEN VendorDashboardScreen mounts, THE Frontend SHALL call fetchOrders and filter by status tabs
2. WHEN a vendor accepts an order, THE VendorDashboardScreen SHALL call updateOrderStatus with "accept" action
3. WHEN a vendor scans a QR code, THE VendorScannerScreen SHALL call POST /api/orders/verify-qr with the scanned token
4. THE VendorInventoryScreen SHALL call fetchProducts to display the vendor's product list
5. WHEN a vendor toggles product availability, THE VendorInventoryScreen SHALL call PATCH /api/products/{id} with inStock boolean
6. WHEN a vendor adds a product, THE AddProductForm SHALL call POST /api/products with name, price, description, and photoUrl
7. THE VendorDashboardScreen SHALL update order statistics based on real order data from the backend

### Requirement 6: Rider Screen API Integration

**User Story:** As a rider, I want to view available jobs, accept deliveries, and complete orders using real backend data.

#### Acceptance Criteria

1. WHEN RiderJobBoardScreen mounts, THE Frontend SHALL call fetchOrders and filter for status READY_FOR_PICKUP
2. WHEN a rider accepts a job, THE RiderJobBoardScreen SHALL call updateOrderStatus with "assign-rider" action
3. THE RiderQRCodeScreen SHALL display the real verificationToken from the order object
4. WHEN a rider completes dropoff, THE RiderDropoffScreen SHALL call updateOrderStatus with status "complete"
5. THE RiderEarningsScreen SHALL call GET /api/earnings/me to display rider earnings history
6. THE Frontend SHALL display rider statistics from GET /api/earnings/me response

### Requirement 7: Onboarding Flow API Integration

**User Story:** As a new user, I want to complete onboarding with phone verification and role-specific registration, so that my account is created in the backend.

#### Acceptance Criteria

1. THE Vendor/Rider/Buyer phone input screens SHALL call sendOtp from Auth_Store
2. THE OTP verification screen SHALL call verifyOtp from Auth_Store
3. WHEN a rider completes KYC, THE Frontend SHALL call POST /api/kyc with idType, documentUrl, and guarantor details
4. WHEN a vendor completes registration, THE Frontend SHALL call POST /api/vendors/register with shopName, category, landmark, and photoUrl
5. WHEN uploading photos, THE Frontend SHALL first call POST /api/upload to get a URL, then include that URL in subsequent registration calls
6. THE Frontend SHALL handle upload failures with user-friendly error messages
7. WHEN registration succeeds, THE Frontend SHALL store the returned user object in Auth_Store

### Requirement 8: Socket.IO Real-Time Updates

**User Story:** As a user, I want to receive real-time notifications when order status changes, so that I stay informed without refreshing.

#### Acceptance Criteria

1. THE Socket_Client SHALL connect to the backend Socket.IO server with authentication token
2. WHEN connected, THE Socket_Client SHALL listen for "order:accepted", "order:pickedup", "order:delivered", and "order:new" events
3. WHEN an order event is received, THE App_Context SHALL update the local orders array to reflect the new status
4. THE BuyerTrackingScreen SHALL listen for order status events and update the UI in real-time
5. THE VendorDashboardScreen SHALL listen for "order:new" events and refresh the pending orders list
6. THE RiderJobBoardScreen SHALL listen for "order:accepted" events to update the available jobs list
7. WHEN the app is backgrounded, THE Socket_Client SHALL disconnect
8. WHEN the app returns to foreground, THE Socket_Client SHALL reconnect with the current authentication token

### Requirement 9: Environment Configuration and Build Setup

**User Story:** As a developer, I want environment-specific configuration, so that the app connects to the correct backend in development and production.

#### Acceptance Criteria

1. THE Frontend SHALL read the backend URL from the EXPO_PUBLIC_API_URL environment variable
2. THE Frontend SHALL include a .env file with EXPO_PUBLIC_API_URL set to the local development server IP
3. THE .env file SHALL use the machine's local network IP address (not localhost or 127.0.0.1)
4. THE Frontend SHALL include a .env.example file with placeholder values
5. THE package.json SHALL include dependencies: @react-native-async-storage/async-storage, zustand, socket.io-client
6. THE Frontend SHALL handle cases where EXPO_PUBLIC_API_URL is not set with a clear error message

### Requirement 10: Backend Seed Data for Testing

**User Story:** As a developer, I want realistic seed data in the backend, so that I can test the full integration with Redemption City-themed vendors and products.

#### Acceptance Criteria

1. THE Backend SHALL include a seed script that creates 10 vendor profiles with Redemption City-themed names
2. THE Backend SHALL seed vendors: Mama Titi Provision Store, Uncle Bayo Drinks & More, Iya Risi Canteen, Omo Igbo Store, Iya Fatima Fruit Stand, Olayinka Frozen Food, Mallam Salisu Spices, Pastor Gbenga Bread, Auntie Ngozi Electronics, Redemption Pharmacy
3. THE Backend SHALL create 3 buyer user accounts with verified phone numbers
4. THE Backend SHALL create 2 rider user accounts with verified KYC status
5. THE Backend SHALL create at least 20 products distributed across all vendors with realistic Nigerian food and grocery items
6. THE Backend SHALL create 6 sample orders across different Order_Status values (PENDING_ACCEPTANCE, READY_FOR_PICKUP, OUT_FOR_DELIVERY, DELIVERED)
7. THE Backend SHALL create earnings records for riders linked to DELIVERED orders
8. THE Backend SHALL upload seed images to Cloudinary and reference the returned URLs in vendor photoUrl and product photoUrl fields
9. THE seed script SHALL be idempotent (can be run multiple times without creating duplicates)
10. THE seed script SHALL log progress and success/failure for each entity created

### Requirement 11: File Upload Integration

**User Story:** As a vendor or rider, I want to upload profile photos and documents, so that my account has visual identification and KYC verification.

#### Acceptance Criteria

1. WHEN a user selects an image, THE Frontend SHALL create a FormData object with the file
2. THE Frontend SHALL call POST /api/upload with the FormData and Authorization header
3. WHEN the upload succeeds, THE Backend SHALL return a JSON object with a "url" field containing the Cloudinary URL
4. THE Frontend SHALL use the returned URL in subsequent API calls (vendor registration, product creation, KYC submission)
5. WHEN the upload fails, THE Frontend SHALL display an error message to the user
6. THE Frontend SHALL show a loading indicator during upload
7. THE Frontend SHALL validate file size (max 5MB) before upload
