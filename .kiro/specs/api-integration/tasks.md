# Implementation Plan: Oja Frontend-Backend API Integration

## Overview

This implementation plan converts the API integration design into actionable coding tasks. The integration replaces mock data with real API calls, implements OTP-based authentication with Zustand, adds Socket.IO real-time updates, and integrates file upload capabilities across buyer, vendor, and rider flows.

**Key Integration Points:**
- API Client with automatic token management and error handling
- Zustand-based authentication store for OTP flow and session persistence
- React Context for application state (shops, products, orders, cart)
- Socket.IO client for real-time order status notifications
- File upload service for photos and documents
- Screen updates for all user roles (buyer, vendor, rider, onboarding)

## Tasks

- [x] 1. Set up environment configuration and dependencies
  - Create `.env` file with `EXPO_PUBLIC_API_URL` pointing to local network IP (e.g., `http://192.168.1.100:3000`)
  - Create `.env.example` with placeholder `EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:3000`
  - Update `app.config.js` to read API URL from `process.env.EXPO_PUBLIC_API_URL`
  - Install required dependencies: `@react-native-async-storage/async-storage`, `zustand`, `socket.io-client`, `expo-file-system`, `expo-image-picker`
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 2. Implement API Client with token management
  - [x] 2.1 Create API client module with typed HTTP methods
    - Create `src/services/apiClient.ts` with `ApiClient` class
    - Implement `get<T>()`, `post<T>()`, `patch<T>()`, `delete<T>()` methods
    - Add automatic token injection from AsyncStorage to Authorization header
    - Configure base URL from `Constants.expoConfig.extra.apiUrl`
    - Set default timeout to 10 seconds with AbortController
    - _Requirements: 1.1, 1.2, 1.3, 1.6_
  
  - [ ]* 2.2 Write property test for token injection
    - **Property 1: Token Injection**
    - **Validates: Requirements 1.2**
    - Test that any authenticated request includes `Authorization: Bearer <token>` header
    - Use fast-check with 100 iterations
  
  - [x] 2.3 Implement comprehensive error handling
    - Handle 401 responses by clearing AsyncStorage tokens and resetting auth store
    - Handle 400-499 errors with ValidationError containing user-friendly messages
    - Handle 500-599 errors with ServerError and generic message
    - Handle network errors (timeout, no connection) with NetworkError and retry suggestion
    - _Requirements: 1.4, 1.5_
  
  - [ ]* 2.4 Write unit tests for error handling
    - Test 401 clears auth data and navigates to login
    - Test network errors return user-friendly messages
    - Test timeout after 10 seconds
    - _Requirements: 1.4, 1.5_

- [x] 3. Implement Authentication Store (Zustand)
  - [x] 3.1 Create auth store with OTP flow
    - Create `src/stores/authStore.ts` with Zustand
    - Define `AuthState` interface: `user`, `token`, `isLoading`, `error`
    - Implement `sendOtp(phoneNumber)` calling POST /api/auth/send-otp
    - Implement `verifyOtp(phoneNumber, otp)` calling POST /api/auth/verify-otp
    - Implement `logout()` clearing AsyncStorage and resetting state
    - Implement `loadSession()` restoring token and validating with GET /api/auth/me
    - Implement `clearError()` to reset error state
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_
  
  - [ ]* 3.2 Write property test for OTP verification storage
    - **Property 2: OTP Verification Storage**
    - **Validates: Requirements 2.3, 2.4**
    - Test that successful OTP verification atomically stores both token and user
    - Use fast-check with 100 iterations
  
  - [ ]* 3.3 Write property test for session persistence
    - **Property 3: Session Persistence**
    - **Validates: Requirements 2.6, 2.7**
    - Test that app launch with valid token restores user state
    - Use fast-check with 100 iterations
  
  - [ ]* 3.4 Write unit tests for auth store
    - Test sendOtp calls correct endpoint with phone number
    - Test verifyOtp stores token and user on success
    - Test loadSession restores user from valid token
    - Test loadSession clears session on invalid token
    - Test logout clears AsyncStorage
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.6, 2.7_

- [x] 4. Implement data transformation utilities
  - [x] 4.1 Create transformation functions for backend-to-frontend mapping
    - Create `src/utils/dataTransformers.ts`
    - Implement `transformVendorToShop()` mapping backend vendor to frontend Shop
    - Implement `transformProduct()` mapping backend product to frontend Product
    - Implement `transformOrder()` mapping backend order to frontend Order
    - Map `_id` → `id`, `vendorId` → `shopId`, `stockQuantity > 0` → `inStock`
    - Map backend order statuses to frontend status strings
    - _Requirements: 3.7, 4.5, 4.6_
  
  - [ ]* 4.2 Write property test for backend ID transformation
    - **Property 6: Backend ID Transformation**
    - **Validates: Requirements 4.5**
    - Test that _id is always mapped to id for all entity types
    - Use fast-check with 100 iterations
  
  - [ ]* 4.3 Write property test for order status mapping
    - **Property 7: Order Status Mapping**
    - **Validates: Requirements 4.6**
    - Test that all backend statuses map correctly to frontend statuses
    - Use fast-check with 100 iterations
  
  - [ ]* 4.4 Write unit tests for data transformations
    - Test transformProduct maps _id to id
    - Test transformProduct computes inStock from stockQuantity
    - Test transformOrder maps status correctly
    - _Requirements: 3.7, 4.5, 4.6_

- [x] 5. Update App Context with API integration
  - [x] 5.1 Replace mock data with API calls
    - Update `src/context/AppContext.tsx`
    - Implement `fetchShops()` calling GET /api/vendors/search
    - Implement `fetchProducts(vendorId)` calling GET /api/products?vendorId={id}
    - Implement `fetchOrders()` calling GET /api/orders (filtered by role)
    - Implement `placeOrder(landmark, address)` calling POST /api/orders
    - Implement `updateOrderStatus(orderId, action)` calling appropriate PATCH endpoint
    - Remove all references to `src/constants/mockData.ts`
    - Add loading states: `isLoadingShops`, `isLoadingProducts`, `isLoadingOrders`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_
  
  - [ ]* 5.2 Write property test for status action mapping
    - **Property 8: Status Action Mapping**
    - **Validates: Requirements 3.5**
    - Test that frontend actions map to correct backend endpoints
    - Use fast-check with 100 iterations
  
  - [ ]* 5.3 Write property test for cart locality
    - **Property 9: Cart Locality**
    - **Validates: Requirements 3.8**
    - Test that cart operations never make API calls
    - Use fast-check with 100 iterations
  
  - [ ]* 5.4 Write property test for order placement side effects
    - **Property 10: Order Placement Side Effects**
    - **Validates: Requirements 4.3, 4.4**
    - Test that successful order placement atomically updates orders, clears cart, and navigates
    - Use fast-check with 100 iterations
  
  - [ ]* 5.5 Write unit tests for App Context methods
    - Test fetchShops transforms and stores vendors
    - Test placeOrder clears cart and adds order to state
    - Test cart operations don't call API
    - _Requirements: 3.1, 3.4, 3.8_

- [ ] 6. Checkpoint - Ensure API client, auth store, and app context are working
  - Verify API client can make authenticated requests
  - Verify auth store handles OTP flow
  - Verify app context fetches and transforms data correctly
  - Ask user if questions arise

- [-] 7. Implement Socket.IO client for real-time updates
  - [ ] 7.1 Create Socket.IO client module
    - Create `src/services/socketClient.ts`
    - Implement `SocketClient` class with `connect(token)`, `disconnect()`, `on()`, `off()`, `isConnected()`
    - Configure connection with auth token, websocket transport, and reconnection settings
    - Add event handlers for `connect`, `disconnect`, `connect_error`
    - _Requirements: 8.1, 8.2_
  
  - [x] 7.2 Integrate Socket.IO with App Context
    - Add Socket.IO event handlers in AppProvider useEffect
    - Listen for `orderCreated`, `orderStatusChanged`, `orderReadyForPickup`, `paymentConfirmed` events
    - Update orders array when events are received
    - Connect socket on successful login, disconnect on logout
    - Handle app state changes (background/foreground) with disconnect/reconnect
    - _Requirements: 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_
  
  - [ ]* 7.3 Write property test for socket event state updates
    - **Property 11: Socket Event State Updates**
    - **Validates: Requirements 8.3**
    - Test that socket events update local state correctly
    - Use fast-check with 100 iterations
  
  - [ ]* 7.4 Write property test for app state socket lifecycle
    - **Property 12: App State Socket Lifecycle**
    - **Validates: Requirements 8.7, 8.8**
    - Test that socket disconnects on background and reconnects on foreground
    - Use fast-check with 100 iterations
  
  - [ ]* 7.5 Write unit tests for Socket.IO integration
    - Test socket connects with authentication token
    - Test socket registers event handlers
    - Test socket disconnects properly
    - _Requirements: 8.1, 8.2, 8.7_

- [x] 8. Implement file upload service
  - [x] 8.1 Create upload service module
    - Create `src/services/uploadService.ts`
    - Implement `uploadImage(uri)` function
    - Validate file size < 5MB before upload
    - Create FormData with file from URI
    - Call POST /api/upload with multipart/form-data
    - Return Cloudinary URL from response
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.6, 11.7_
  
  - [ ]* 8.2 Write property test for file size validation
    - **Property 13: File Size Validation**
    - **Validates: Requirements 11.7**
    - Test that files > 5MB are rejected before API call
    - Use fast-check with 100 iterations
  
  - [ ]* 8.3 Write property test for upload URL usage
    - **Property 14: Upload URL Usage**
    - **Validates: Requirements 11.4**
    - Test that returned upload URL is used in subsequent API calls
    - Use fast-check with 100 iterations
  
  - [ ]* 8.4 Write unit tests for upload service
    - Test file size validation rejects large files
    - Test successful upload returns URL
    - Test upload failure shows error message
    - _Requirements: 11.5, 11.6, 11.7_

- [ ] 9. Update Buyer screens with API integration
  - [ ] 9.1 Update BuyerHomeScreen to fetch shops
    - Update `src/screens/buyer/BuyerScreens.tsx` - BuyerHomeScreen component
    - Call `fetchShops()` from App Context in useEffect on mount
    - Show loading indicator while `isLoadingShops` is true
    - Render shops list from App Context state
    - _Requirements: 4.1, 4.7_
  
  - [ ] 9.2 Update BuyerStorefrontScreen to fetch products
    - Update BuyerStorefrontScreen component
    - Call `fetchProducts(shopId)` from App Context in useEffect
    - Show loading indicator while `isLoadingProducts` is true
    - Render products from App Context state
    - _Requirements: 4.2_
  
  - [ ] 9.3 Update BuyerCheckoutScreen to place orders
    - Update BuyerCheckoutScreen component
    - Call `placeOrder(landmark, address)` on checkout button press
    - Handle loading state with `isSubmitting`
    - Navigate to BuyerOrderPlacedScreen with returned order on success
    - Show error alert on failure
    - _Requirements: 4.3, 4.4_
  
  - [ ] 9.4 Update BuyerTrackingScreen to use real order data
    - Update BuyerTrackingScreen component
    - Use `order._id` instead of `order.id` for API calls (after transformation)
    - Map backend Order_Status values to display strings
    - Show real-time updates from Socket.IO events
    - _Requirements: 4.5, 4.6_
  
  - [ ] 9.5 Update BuyerHistoryScreen to display orders
    - Update BuyerHistoryScreen component
    - Display orders from `fetchOrders()` filtered by buyer role
    - _Requirements: 4.7_
  
  - [ ]* 9.6 Write property test for screen mount data fetching
    - **Property 15: Screen Mount Data Fetching**
    - **Validates: Requirements 4.1, 5.1, 6.1**
    - Test that screen mount triggers appropriate data fetch
    - Use fast-check with 100 iterations
  
  - [ ]* 9.7 Write property test for API response data display
    - **Property 16: API Response Data Display**
    - **Validates: Requirements 4.7, 5.1, 6.1**
    - Test that screens display all entities from API response
    - Use fast-check with 100 iterations
  
  - [ ]* 9.8 Write unit tests for buyer screens
    - Test BuyerHomeScreen fetches shops on mount
    - Test BuyerHomeScreen shows loading indicator
    - Test BuyerHomeScreen renders shop list
    - Test BuyerCheckoutScreen places order and navigates
    - _Requirements: 4.1, 4.3, 4.4, 4.7_

- [ ] 10. Update Vendor screens with API integration
  - [ ] 10.1 Update VendorDashboardScreen to manage orders
    - Update `src/screens/vendor/VendorScreens.tsx` - VendorDashboardScreen component
    - Call `fetchOrders()` from App Context in useEffect on mount
    - Filter orders by selectedTab (pending, ready)
    - Implement `handleAcceptOrder()` calling `updateOrderStatus(orderId, 'accept')`
    - Show success/error alerts
    - Update statistics based on real order data
    - Listen for Socket.IO `orderCreated` events to refresh orders
    - _Requirements: 5.1, 5.2, 5.7_
  
  - [ ] 10.2 Update VendorInventoryScreen to manage products
    - Update VendorInventoryScreen component
    - Call `fetchProducts(user.id)` in useEffect (assuming vendorId = userId)
    - Implement `handleToggleStock()` calling PATCH /api/products/{id}
    - Show error alert on failure
    - _Requirements: 5.4, 5.5_
  
  - [ ] 10.3 Update AddProductForm to create products
    - Update AddProductForm component or create new form
    - Implement product creation calling POST /api/products
    - Include name, price, description, and photoUrl (from upload)
    - Handle image upload with uploadService before creating product
    - _Requirements: 5.6_
  
  - [ ] 10.4 Update VendorScannerScreen for QR verification
    - Update VendorScannerScreen component
    - Implement QR code scanning calling POST /api/orders/verify-qr with scanned token
    - Show success/error feedback
    - _Requirements: 5.3_
  
  - [ ]* 10.5 Write unit tests for vendor screens
    - Test VendorDashboardScreen fetches orders on mount
    - Test VendorDashboardScreen accepts orders
    - Test VendorInventoryScreen toggles product stock
    - _Requirements: 5.1, 5.2, 5.4, 5.5_

- [ ] 11. Update Rider screens with API integration
  - [ ] 11.1 Update RiderJobBoardScreen to view available jobs
    - Update `src/screens/rider/RiderScreens.tsx` - RiderJobBoardScreen component
    - Call `fetchOrders()` from App Context in useEffect on mount
    - Filter orders by status READY_FOR_PICKUP (mapped to 'accepted')
    - Implement `handleAcceptJob()` calling `updateOrderStatus(orderId, 'assign-rider')`
    - Show success/error alerts
    - Listen for Socket.IO `orderReadyForPickup` events to refresh jobs
    - _Requirements: 6.1, 6.2, 6.6_
  
  - [ ] 11.2 Update RiderQRCodeScreen to display verification token
    - Update RiderQRCodeScreen component
    - Display real `verificationToken` from order object (not mock data)
    - _Requirements: 6.3_
  
  - [ ] 11.3 Update RiderDropoffScreen to complete orders
    - Update RiderDropoffScreen component
    - Implement complete delivery calling `updateOrderStatus(orderId, 'complete')`
    - _Requirements: 6.4_
  
  - [ ] 11.4 Update RiderEarningsScreen to display earnings
    - Update RiderEarningsScreen component
    - Call GET /api/earnings/me to fetch rider earnings history
    - Display statistics from response
    - _Requirements: 6.5, 6.6_
  
  - [ ]* 11.5 Write unit tests for rider screens
    - Test RiderJobBoardScreen fetches orders on mount
    - Test RiderJobBoardScreen accepts jobs
    - Test RiderEarningsScreen displays earnings
    - _Requirements: 6.1, 6.2, 6.5_

- [ ] 12. Checkpoint - Ensure all screen integrations are working
  - Test buyer flow: browse shops, view products, place order, track delivery
  - Test vendor flow: view orders, accept orders, manage inventory, scan QR
  - Test rider flow: view jobs, accept job, complete delivery, view earnings
  - Ask user if questions arise

- [ ] 13. Update Onboarding screens with API integration
  - [ ] 13.1 Update phone input screens to send OTP
    - Update `src/screens/onboarding/OnboardingScreens.tsx`
    - Update VendorPhoneScreen, RiderPhoneScreen, BuyerPhoneScreen
    - Call `sendOtp(phoneNumber)` from auth store on submit
    - Show loading state during API call
    - _Requirements: 7.1_
  
  - [ ] 13.2 Update OTP verification screen
    - Update OTPVerificationScreen component (create if needed)
    - Call `verifyOtp(phoneNumber, otp)` from auth store on submit
    - Show loading state during API call
    - Navigate to role-specific screen on success
    - Show error message on failure
    - _Requirements: 7.2_
  
  - [ ] 13.3 Update VendorSetupScreen for vendor registration
    - Update VendorSetupScreen component
    - Add image picker for shop photo
    - Implement photo upload using `uploadService.uploadImage()`
    - Call POST /api/vendors/register with shopName, category, landmark, photoUrl
    - Handle loading and error states
    - Navigate to VendorDashboard on success
    - _Requirements: 7.4, 7.5, 7.6, 7.7_
  
  - [ ] 13.4 Update RiderKYCScreen for rider registration
    - Update RiderKYCScreen component (or create)
    - Add document upload for KYC verification
    - Upload document using `uploadService.uploadImage()`
    - Call POST /api/kyc with idType, documentUrl, guarantor details
    - Handle loading and error states
    - _Requirements: 7.3, 7.5, 7.6_
  
  - [ ] 13.5 Update BuyerProfileScreen for buyer registration
    - Update BuyerProfileScreen component (or create)
    - Implement profile completion (if needed beyond OTP)
    - Store user object in auth store on success
    - _Requirements: 7.7_
  
  - [ ]* 13.6 Write unit tests for onboarding screens
    - Test phone input screens call sendOtp
    - Test OTP screen calls verifyOtp and stores user
    - Test vendor setup uploads photo and registers vendor
    - Test rider KYC uploads document and submits KYC
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 14. Implement error handling UI patterns
  - [ ] 14.1 Add error handling to all API calls
    - Wrap all API calls in try-catch blocks
    - Show user-friendly error messages in Alert.alert()
    - Handle specific error types (NetworkError, AuthError, ValidationError, ServerError)
    - Add retry buttons for network failures
    - _Requirements: 1.4, 1.5, 7.6, 11.5_
  
  - [ ] 14.2 Add network status indicator
    - Create a network status component showing online/offline state
    - Use NetInfo to detect connection changes
    - Show subtle indicator in header or bottom bar
    - _Requirements: Error Handling Strategy_
  
  - [ ]* 14.3 Write property test for network error messages
    - **Property 4: Network Error Messages**
    - **Validates: Requirements 1.5, 7.6, 11.5**
    - Test that network errors return user-friendly messages
    - Use fast-check with 100 iterations
  
  - [ ]* 14.4 Write property test for 401 session clearing
    - **Property 5: 401 Session Clearing**
    - **Validates: Requirements 1.4**
    - Test that 401 responses clear auth data
    - Use fast-check with 100 iterations

- [ ] 15. Backend seed data and testing setup
  - [ ] 15.1 Create comprehensive seed script
    - Navigate to `oja-api` project
    - Create `src/scripts/seed.ts` script
    - Seed 10 vendors with Redemption City names (Mama Titi, Uncle Bayo, Iya Risi, etc.)
    - Seed 3 buyers, 2 riders with verified phone numbers
    - Seed 20+ products distributed across vendors
    - Seed 6 sample orders with different statuses
    - Seed earnings records for riders
    - Upload images to Cloudinary and use returned URLs
    - Make script idempotent (check existence before creating)
    - Add progress logging
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 10.10_
  
  - [ ] 15.2 Test seed script and verify data
    - Run seed script: `npm run seed` or `ts-node src/scripts/seed.ts`
    - Verify vendors created in database
    - Verify products linked to vendors
    - Verify orders created with correct statuses
    - Verify Cloudinary images accessible
    - _Requirements: 10.9, 10.10_

- [ ] 16. Final integration testing and verification
  - [ ] 16.1 Test complete buyer flow
    - Launch app, complete OTP login as buyer
    - Browse shops from real API
    - View products for a shop
    - Add products to cart (local state)
    - Complete checkout with landmark and address
    - Verify order created in backend
    - Track order status with real-time Socket.IO updates
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_
  
  - [ ] 16.2 Test complete vendor flow
    - Login as vendor via OTP
    - View pending orders from API
    - Accept an order
    - Verify order status updated in backend
    - Manage inventory (toggle stock)
    - Add new product with photo upload
    - Scan QR code for order verification
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_
  
  - [ ] 16.3 Test complete rider flow
    - Login as rider via OTP
    - View available jobs (READY_FOR_PICKUP orders)
    - Accept a job
    - Display QR code for pickup verification
    - Complete delivery
    - View earnings history
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_
  
  - [ ] 16.4 Test real-time Socket.IO updates
    - Have buyer place order
    - Verify vendor receives `orderCreated` event
    - Have vendor accept order
    - Verify buyer receives `orderStatusChanged` event
    - Have rider pickup order
    - Verify buyer receives status update
    - _Requirements: 8.3, 8.4, 8.5, 8.6_
  
  - [ ] 16.5 Test error scenarios
    - Test app behavior with backend offline
    - Test session expiry (401) handling
    - Test network timeout handling
    - Test file upload with large files
    - Verify user-friendly error messages
    - _Requirements: 1.4, 1.5, 11.5, 11.6, 11.7_
  
  - [ ] 16.6 Test onboarding flows
    - Test vendor onboarding with photo upload
    - Test rider onboarding with KYC document upload
    - Test buyer onboarding
    - Verify accounts created in backend
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

- [ ] 17. Final checkpoint - Complete integration verification
  - Run all property-based tests (100 iterations each)
  - Run all unit tests with coverage report
  - Verify all API endpoints working correctly
  - Verify real-time updates functioning
  - Verify file uploads successful
  - Test on both iOS and Android devices
  - Ask user if questions arise or deployment preparation needed

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property-based tests use fast-check with 100 iterations to validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Checkpoints ensure incremental validation at major integration milestones
- Backend seed data is critical for testing the full integration - complete before frontend testing
- Environment configuration must be set up first with correct local network IP (not localhost)
- Socket.IO integration should be tested with multiple devices/emulators simultaneously
- File upload testing requires Cloudinary credentials configured in backend

## Testing Setup

**Install testing dependencies:**
```bash
npm install --save-dev fast-check @types/fast-check @testing-library/react-native @testing-library/jest-native
```

**Run tests:**
```bash
npm test                    # Run all tests
npm test -- --watch         # Watch mode
npm test -- --coverage      # With coverage
npm test -- --testNamePattern="Property" # Only property tests
```

## Implementation Order

1. **Foundation (Tasks 1-4):** Environment, API client, auth store, data transformers
2. **Core Integration (Tasks 5-8):** App Context, Socket.IO, file upload
3. **Screen Updates (Tasks 9-13):** Buyer, vendor, rider, onboarding screens
4. **Polish (Tasks 14-17):** Error handling, seed data, testing, verification

This order ensures each layer builds on the previous, with checkpoints validating progress before moving forward.
