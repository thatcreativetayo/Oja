# Implementation Plan: Oja REST API

## Overview

This implementation plan breaks down the Oja REST API feature into discrete coding tasks. The system is a hyperlocal marketplace backend with phone-based authentication, multi-role support (buyers, vendors, riders), real-time notifications via Socket.io, payment integration with Paystack, and rider KYC verification.

The implementation follows a layered architecture: models → services → controllers → routes → middleware → integration. Each task builds incrementally, ensuring testable progress at every step.

## Tasks

- [ ] 1. Project setup and core infrastructure
  - Initialize TypeScript Node.js project with Express
  - Configure MongoDB connection with Mongoose
  - Set up environment variables (.env file structure)
  - Create project structure (models/, services/, controllers/, routes/, middleware/, utils/)
  - Configure TypeScript strict mode and build scripts
  - Set up testing framework (Jest) with test database configuration
  - _Requirements: NFR Maintainability 1, 2_

- [ ] 2. Implement data models and schemas
  - [ ] 2.1 Create User model with phone validation
    - Define User schema with phoneNumber format validation (+234XXXXXXXXXX)
    - Add role enum validation (buyer, vendor, rider)
    - Create indexes on phoneNumber and role
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ] 2.2 Create OtpToken model with TTL
    - Define OtpToken schema with 6-digit OTP validation
    - Configure TTL index on expiresAt field (10-minute expiration)
    - Add userId foreign key reference
    - _Requirements: 1.4, 1.5_

  - [ ] 2.3 Create VendorProfile model
    - Define VendorProfile schema with category enum
    - Add operationalStatus enum (OPEN, CLOSED)
    - Create unique index on userId and compound index on category/operationalStatus
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 2.4 Create Product model with validation
    - Define Product schema with price and stockQuantity validation
    - Add vendorId foreign key reference
    - Create indexes on vendorId, category, and stockQuantity
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ] 2.5 Create Order model with state machine
    - Define Order schema with items array and status enums
    - Add orderStatus and paymentStatus enums
    - Create unique index on qrCode and indexes on buyerId, vendorId, riderId
    - _Requirements: 4.3, 4.4, 4.5_

  - [ ] 2.6 Create RiderKyc model
    - Define RiderKyc schema with governmentIdType enum
    - Add kycStatus enum (PENDING, APPROVED, REJECTED)
    - Create unique index on riderId
    - _Requirements: 8.1, 8.2, 8.3_

- [ ] 3. Implement authentication services
  - [ ] 3.1 Create AuthService for user management
    - Implement createUser method with phone validation
    - Implement findUserByPhone method
    - Implement JWT generation with 7-day expiration
    - Implement JWT verification and payload extraction
    - _Requirements: 1.1, 1.7, 1.9_

  - [ ]* 3.2 Write property tests for authentication
    - **Property 1: Phone Number Format Validation**
    - **Validates: Requirements 1.2**
    - **Property 2: Role Validation on Registration**
    - **Validates: Requirements 1.3**
    - **Property 5: JWT Expiration Consistency**
    - **Validates: Requirements 1.7**
    - **Property 6: JWT Authentication Round-trip**
    - **Validates: Requirements 1.9**

  - [ ] 3.3 Create OtpService for OTP management
    - Implement generateOtp method (6-digit random number)
    - Implement storeOtp method with 10-minute TTL
    - Implement verifyOtp method with expiration check
    - Implement cleanupExpiredOtps utility
    - _Requirements: 1.4, 1.5, 1.6, 1.8_

  - [ ]* 3.4 Write property tests for OTP service
    - **Property 3: OTP Expiration Consistency**
    - **Validates: Requirements 1.5**
    - **Property 4: OTP Verification Time Window**
    - **Validates: Requirements 1.6, 1.8**

  - [ ] 3.5 Create Termii SMS integration service
    - Implement sendSms method with Termii API integration
    - Add retry logic with exponential backoff (3 retries)
    - Handle network errors and 4xx/5xx responses
    - _Requirements: 1.4_

  - [ ]* 3.6 Write unit tests for Termii integration
    - Test successful SMS send
    - Test retry logic on network failure
    - Test error handling for API failures

- [ ] 4. Implement authentication middleware and routes
  - [ ] 4.1 Create authentication middleware
    - Implement authMiddleware for JWT verification
    - Extract user context from token and attach to request
    - Return 401 for invalid/missing tokens
    - _Requirements: 1.9, 11.2_

  - [ ] 4.2 Create role authorization middleware
    - Implement requireRole middleware with single role or array support
    - Return 403 for insufficient permissions
    - _Requirements: 12.1-12.7_

  - [ ] 4.3 Create AuthController
    - Implement register endpoint (POST /auth/register)
    - Implement login endpoint (POST /auth/login)
    - Implement verifyOtp endpoint (POST /auth/verify-otp)
    - _Requirements: 1.1, 1.4, 1.6, 1.7_

  - [ ] 4.4 Create auth routes
    - Mount AuthController methods on /auth routes
    - Add validation middleware for request schemas
    - _Requirements: 1.1-1.9_

  - [ ]* 4.5 Write property tests for authorization
    - **Property 7: Role-Based Access Control**
    - **Validates: Requirements 12.1-12.7**
    - **Property 49: Authentication Error Response**
    - **Validates: Requirements 11.2**
    - **Property 50: Authorization Error Response**
    - **Validates: Requirements 11.3**

- [ ] 5. Checkpoint - Authentication complete
  - Ensure all tests pass, verify JWT token generation and validation works correctly, ask the user if questions arise.

- [ ] 6. Implement vendor profile management
  - [ ] 6.1 Create VendorService
    - Implement createProfile method with userId uniqueness check
    - Implement updateProfile method with ownership validation
    - Implement getProfile method
    - Implement updateOperationalStatus method
    - Implement searchVendors method with OPEN status filtering
    - _Requirements: 2.1, 2.4, 2.5, 2.6, 2.7_

  - [ ]* 6.2 Write property tests for vendor service
    - **Property 16: Vendor Profile Round-trip**
    - **Validates: Requirements 2.1, 2.3, 2.5**
    - **Property 18: Operational Status Update Consistency**
    - **Validates: Requirements 2.4**
    - **Property 30: Vendor Search Filtering**
    - **Validates: Requirements 2.7**
    - **Property 8: Resource Ownership Authorization**
    - **Validates: Requirements 2.6**

  - [ ] 6.3 Create VendorController
    - Implement createProfile endpoint (POST /vendors/profile)
    - Implement getProfile endpoint (GET /vendors/profile)
    - Implement updateProfile endpoint (PUT /vendors/profile)
    - Implement updateStatus endpoint (PATCH /vendors/status)
    - Implement searchVendors endpoint (GET /vendors/search)
    - _Requirements: 2.1-2.7_

  - [ ] 6.4 Create vendor routes
    - Mount VendorController on /vendors routes
    - Apply authMiddleware and requireRole('vendor') where appropriate
    - Add validation middleware
    - _Requirements: 2.1-2.7_

- [ ] 7. Implement product management
  - [ ] 7.1 Create ProductService
    - Implement createProduct method with vendor validation
    - Implement updateProduct method with ownership check
    - Implement deleteProduct method with ownership check
    - Implement getProducts method with stockQuantity > 0 filtering
    - Implement getProductById method
    - Implement decrementStock method for order creation
    - _Requirements: 3.1-3.9_

  - [ ]* 7.2 Write property tests for product service
    - **Property 11: Positive Price Validation**
    - **Validates: Requirements 3.2**
    - **Property 12: Non-negative Integer Stock Validation**
    - **Validates: Requirements 3.3**
    - **Property 17: Product CRUD Round-trip**
    - **Validates: Requirements 3.1, 3.4, 3.5**
    - **Property 29: Stock Filtering for Buyers**
    - **Validates: Requirements 3.7**

  - [ ] 7.3 Create ProductController
    - Implement createProduct endpoint (POST /products)
    - Implement getProducts endpoint (GET /products)
    - Implement getProductById endpoint (GET /products/:id)
    - Implement updateProduct endpoint (PUT /products/:id)
    - Implement deleteProduct endpoint (DELETE /products/:id)
    - _Requirements: 3.1-3.6_

  - [ ] 7.4 Create product routes
    - Mount ProductController on /products routes
    - Apply authMiddleware and role-based access control
    - Add validation middleware
    - _Requirements: 3.1-3.6_

- [ ] 8. Checkpoint - Vendor and product management complete
  - Ensure all tests pass, verify vendors can create profiles and products, ask the user if questions arise.

- [ ] 9. Implement order management services
  - [ ] 9.1 Create OrderService core functionality
    - Implement validateSingleVendor method
    - Implement checkStockAvailability method
    - Implement calculateOrderTotal method
    - Implement generateQrCode method (UUID v4)
    - _Requirements: 4.1, 4.4, 4.5_

  - [ ] 9.2 Create order creation with transactions
    - Implement createOrder method with MongoDB transaction
    - Atomically verify stock, create order, and decrement stock
    - Rollback transaction on insufficient stock
    - _Requirements: 3.8, 3.9, 4.1-4.5_

  - [ ]* 9.3 Write property tests for order creation
    - **Property 19: Single Vendor Order Validation**
    - **Validates: Requirements 4.1**
    - **Property 20: Order Initialization Defaults**
    - **Validates: Requirements 4.3, 4.5**
    - **Property 21: Order Total Calculation**
    - **Validates: Requirements 4.4**
    - **Property 22: Stock Decrement on Order**
    - **Validates: Requirements 3.8**
    - **Property 23: Insufficient Stock Rejection**
    - **Validates: Requirements 3.9**

  - [ ] 9.4 Implement order retrieval and filtering
    - Implement getOrdersByBuyer method
    - Implement getOrdersByVendor method
    - Implement getOrdersByRider method
    - Implement getOrderById with authorization check
    - _Requirements: 4.7, 4.8_

  - [ ]* 9.5 Write property tests for order visibility
    - **Property 24: Order Visibility by Role**
    - **Validates: Requirements 4.7, 4.8**

  - [ ] 9.5 Implement order cancellation
    - Implement cancelOrder method with state guard (PENDING_ACCEPTANCE only)
    - Verify buyer ownership before cancellation
    - _Requirements: 4.9_

  - [ ]* 9.6 Write property tests for order cancellation
    - **Property 25: Cancellation State Guard**
    - **Validates: Requirements 4.9**

- [ ] 10. Implement order state machine
  - [ ] 10.1 Create state transition validation
    - Define validTransitions map
    - Implement validateStateTransition method
    - Check current state matches expected previous state
    - _Requirements: 5.3, 5.7_

  - [ ] 10.2 Implement vendor order acceptance
    - Implement acceptOrder method with payment status check
    - Transition PENDING_ACCEPTANCE → READY_FOR_PICKUP
    - Verify requesting vendor owns the order
    - _Requirements: 5.1, 5.3, 7.6_

  - [ ] 10.3 Implement rider order pickup
    - Implement pickupOrder method with QR verification
    - Transition READY_FOR_PICKUP → OUT_FOR_DELIVERY
    - Assign riderId to order
    - Verify rider KYC status is APPROVED
    - _Requirements: 5.4, 5.5_

  - [ ] 10.4 Implement rider delivery completion
    - Implement deliverOrder method
    - Transition OUT_FOR_DELIVERY → DELIVERED
    - Verify requesting rider is assigned rider
    - _Requirements: 5.6, 5.7_

  - [ ]* 10.5 Write property tests for state machine
    - **Property 26: Valid State Transitions**
    - **Validates: Requirements 5.1, 5.3, 5.4, 5.6, 5.7**
    - **Property 27: Rider Assignment on Pickup**
    - **Validates: Requirements 5.5**
    - **Property 28: Payment Prerequisite for Acceptance**
    - **Validates: Requirements 7.6**

- [ ] 11. Implement OrderController and routes
  - [ ] 11.1 Create OrderController
    - Implement createOrder endpoint (POST /orders)
    - Implement getOrders endpoint (GET /orders)
    - Implement getOrderById endpoint (GET /orders/:id)
    - Implement acceptOrder endpoint (PATCH /orders/:id/accept)
    - Implement pickupOrder endpoint (PATCH /orders/:id/pickup)
    - Implement deliverOrder endpoint (PATCH /orders/:id/deliver)
    - Implement cancelOrder endpoint (PATCH /orders/:id/cancel)
    - _Requirements: 4.1-4.9, 5.1-5.8_

  - [ ] 11.2 Create order routes
    - Mount OrderController on /orders routes
    - Apply role-based access control (buyer for create, vendor for accept, rider for pickup/deliver)
    - Add validation middleware
    - _Requirements: 4.1-4.9, 5.1-5.8_

- [ ] 12. Checkpoint - Order management complete
  - Ensure all tests pass, verify order creation and state transitions work correctly, ask the user if questions arise.

- [ ] 13. Implement real-time notification service
  - [ ] 13.1 Create Socket.io server setup
    - Initialize Socket.io server attached to Express HTTP server
    - Configure CORS for Socket.io
    - _Requirements: 9.1_

  - [ ] 13.2 Implement Socket.io authentication
    - Create JWT authentication middleware for Socket.io connections
    - Validate token on connection handshake
    - Reject connections with invalid tokens
    - _Requirements: 9.1, 9.7_

  - [ ]* 13.3 Write property tests for Socket.io auth
    - **Property 42: Socket.io JWT Authentication**
    - **Validates: Requirements 9.1, 9.7**

  - [ ] 13.4 Create NotificationService
    - Implement emitToUser method (room-based targeting)
    - Implement emitToRoom method (broadcast to multiple users)
    - Implement orderCreated notification
    - Implement orderReadyForPickup notification
    - Implement orderStatusChanged notification
    - Implement paymentConfirmed notification
    - _Requirements: 4.6, 5.2, 5.8, 7.7, 9.2-9.6_

  - [ ]* 13.5 Write property tests for notifications
    - **Property 43: Order Created Notification**
    - **Validates: Requirements 4.6, 9.2, 9.6**
    - **Property 44: Ready for Pickup Broadcast**
    - **Validates: Requirements 5.2, 9.3, 9.6**
    - **Property 45: Order Status Change Notification**
    - **Validates: Requirements 5.8, 9.4, 9.6**

  - [ ] 13.6 Integrate notifications into order workflows
    - Add orderCreated notification to createOrder
    - Add orderReadyForPickup notification to acceptOrder
    - Add orderStatusChanged notification to all status transitions
    - _Requirements: 4.6, 5.2, 5.8_

- [ ] 14. Implement payment integration
  - [ ] 14.1 Create PaymentService
    - Implement initializePayment method with Paystack API
    - Generate payment link and store reference in order
    - Handle Paystack API errors
    - _Requirements: 7.1, 7.2_

  - [ ] 14.2 Implement webhook verification
    - Implement verifyWebhookSignature method (HMAC SHA512)
    - Compare computed hash with x-paystack-signature header
    - Log security events for failed verifications
    - _Requirements: 7.3, 7.5_

  - [ ] 14.3 Implement payment status updates
    - Implement processPaymentWebhook method
    - Update order paymentStatus to PAID on successful payment
    - Ensure idempotency (check if already processed)
    - _Requirements: 7.4_

  - [ ]* 14.4 Write property tests for payment
    - **Property 33: Payment Reference Storage**
    - **Validates: Requirements 7.1, 7.2**
    - **Property 34: Webhook Signature Verification**
    - **Validates: Requirements 7.3, 7.5**
    - **Property 35: Payment Status Transition on Webhook**
    - **Validates: Requirements 7.4**

  - [ ] 14.5 Create PaymentController
    - Implement initiatePayment endpoint (POST /payments/initiate)
    - Implement webhook endpoint (POST /payments/webhook)
    - _Requirements: 7.1-7.7_

  - [ ] 14.6 Create payment routes
    - Mount PaymentController on /payments routes
    - Apply authMiddleware to /initiate
    - No auth on /webhook (uses signature verification)
    - _Requirements: 7.1-7.7_

  - [ ] 14.7 Integrate payment notifications
    - Add paymentConfirmed notification to webhook processing
    - _Requirements: 7.7, 9.5_

  - [ ]* 14.8 Write property tests for payment notifications
    - **Property 46: Payment Confirmation Notification**
    - **Validates: Requirements 7.7, 9.5, 9.6**

- [ ] 15. Checkpoint - Payment integration complete
  - Ensure all tests pass, verify Paystack payment flow and webhook processing work correctly, ask the user if questions arise.

- [ ] 16. Implement rider KYC system
  - [ ] 16.1 Create KycService
    - Implement submitKyc method with uniqueness check
    - Implement getKycByRiderId method
    - Implement getPendingKycSubmissions method (admin)
    - Implement approveKyc method with reviewedAt timestamp
    - Implement rejectKyc method with reason storage
    - _Requirements: 8.1-8.9_

  - [ ]* 16.2 Write property tests for KYC service
    - **Property 36: KYC Submission Uniqueness**
    - **Validates: Requirements 8.4**
    - **Property 37: KYC Initial Status**
    - **Validates: Requirements 8.3**
    - **Property 38: KYC Approval Transition**
    - **Validates: Requirements 8.5**
    - **Property 39: KYC Rejection with Reason**
    - **Validates: Requirements 8.6**
    - **Property 40: Rider KYC Access Control**
    - **Validates: Requirements 8.9**
    - **Property 41: KYC Prerequisite for Rider Operations**
    - **Validates: Requirements 6.3, 6.6**

  - [ ] 16.3 Create admin authentication middleware
    - Implement adminAuthMiddleware
    - Validate Admin_Token from request headers
    - Compare against environment variable ADMIN_TOKEN
    - Return 401 for invalid tokens
    - _Requirements: 8.7, 8.8_

  - [ ]* 16.4 Write property tests for admin auth
    - **Property 9: Admin Token Validation**
    - **Validates: Requirements 8.7, 8.8**

  - [ ] 16.5 Create KycController
    - Implement submitKyc endpoint (POST /kyc/submit)
    - Implement getKycStatus endpoint (GET /kyc/status)
    - Implement getPendingKyc endpoint (GET /kyc/pending) - admin only
    - Implement approveKyc endpoint (PATCH /kyc/:id/approve) - admin only
    - Implement rejectKyc endpoint (PATCH /kyc/:id/reject) - admin only
    - _Requirements: 8.1-8.9_

  - [ ] 16.6 Create KYC routes
    - Mount KycController on /kyc routes
    - Apply requireRole('rider') to submit and status endpoints
    - Apply adminAuthMiddleware to admin endpoints
    - Add validation middleware
    - _Requirements: 8.1-8.9_

- [ ] 17. Implement rider QR verification
  - [ ] 17.1 Create RiderService
    - Implement verifyQrCode method
    - Validate QR code exists and order is READY_FOR_PICKUP
    - Validate rider KYC status is APPROVED
    - Return order details including vendor location and delivery address
    - _Requirements: 6.1-6.6_

  - [ ]* 17.2 Write property tests for QR verification
    - **Property 31: QR Code Validity Check**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.5, 6.6**
    - **Property 32: QR Verification Response Completeness**
    - **Validates: Requirements 6.4**

  - [ ] 17.3 Create RiderController
    - Implement verifyQr endpoint (POST /riders/verify-qr)
    - _Requirements: 6.1-6.6_

  - [ ] 17.4 Create rider routes
    - Mount RiderController on /riders routes
    - Apply requireRole('rider')
    - Add validation middleware
    - _Requirements: 6.1-6.6_

- [ ] 18. Checkpoint - KYC and rider functionality complete
  - Ensure all tests pass, verify KYC submission and approval flow works, verify QR verification works correctly, ask the user if questions arise.

- [ ] 19. Implement validation and error handling middleware
  - [ ] 19.1 Create validation middleware
    - Implement validateRequest middleware using Mongoose schemas
    - Validate request body, query params, and path params
    - Return 400 with detailed validation errors
    - _Requirements: 11.1, 11.6, 11.7, 11.8_

  - [ ] 19.2 Create error handler middleware
    - Implement global errorHandler middleware
    - Format errors into consistent JSON structure
    - Map error types to HTTP status codes
    - Log errors with stack traces
    - Return appropriate status codes (400, 401, 403, 404, 500, 503)
    - _Requirements: 11.1-11.5_

  - [ ]* 19.3 Write property tests for validation
    - **Property 10: Enum Field Validation**
    - **Validates: Requirements 1.3, 2.2, 8.2**
    - **Property 13: Required Field Validation**
    - **Validates: Requirements 4.2, 11.6, 11.8**
    - **Property 14: Type and Format Validation**
    - **Validates: Requirements 11.7, 11.8**

  - [ ]* 19.4 Write property tests for error handling
    - **Property 48: Invalid Data Error Response**
    - **Validates: Requirements 11.1, 11.8**
    - **Property 51: Resource Not Found Response**
    - **Validates: Requirements 11.4**
    - **Property 52: Server Error Response**
    - **Validates: Requirements 11.5**

- [ ] 20. Implement JSON parsing and serialization
  - [ ] 20.1 Configure Express JSON middleware
    - Add express.json() with size limits
    - Configure error handling for malformed JSON
    - _Requirements: 13.1, 13.2_

  - [ ] 20.2 Implement response serialization
    - Create response formatter utility
    - Ensure all responses use application/json Content-Type
    - Handle Date serialization to ISO 8601
    - _Requirements: 13.3, 13.6_

  - [ ]* 20.3 Write property tests for JSON handling
    - **Property 53: JSON Parsing Validation**
    - **Validates: Requirements 13.1, 13.2**
    - **Property 54: JSON Response Serialization**
    - **Validates: Requirements 13.3**
    - **Property 55: JSON Round-trip Preservation**
    - **Validates: Requirements 13.4**
    - **Property 56: Date Serialization Format**
    - **Validates: Requirements 13.6**
    - **Property 57: Serialization Error Handling**
    - **Validates: Requirements 13.7**

- [ ] 21. Implement database seeding
  - [ ] 21.1 Create seed script
    - Create sample vendors with complete profiles
    - Create sample products linked to vendors
    - Include diverse categories for vendors and products
    - Set realistic stock quantities
    - _Requirements: 10.1-10.4_

  - [ ] 21.2 Implement seed idempotency
    - Check for existing seed data before seeding
    - Skip seeding if data exists
    - Return message indicating data already exists
    - _Requirements: 10.5, 10.6_

  - [ ]* 21.3 Write property tests for seeding
    - **Property 47: Seed Idempotency**
    - **Validates: Requirements 10.5, 10.6**

- [ ] 22. Implement main application setup
  - [ ] 22.1 Create Express app configuration
    - Initialize Express app
    - Configure CORS middleware
    - Add request logging middleware
    - Add rate limiting middleware
    - Configure body parser with size limits
    - _Requirements: NFR Performance 1, 2_

  - [ ] 22.2 Mount all routes
    - Mount auth routes on /auth
    - Mount vendor routes on /vendors
    - Mount product routes on /products
    - Mount order routes on /orders
    - Mount payment routes on /payments
    - Mount kyc routes on /kyc
    - Mount rider routes on /riders
    - _Requirements: All route requirements_

  - [ ] 22.3 Apply global middleware
    - Add validation middleware before routes
    - Add error handler middleware after routes
    - Configure 404 handler for unknown routes
    - _Requirements: 11.1-11.5_

  - [ ] 22.4 Create server entry point
    - Create server.ts with MongoDB connection
    - Attach Socket.io to HTTP server
    - Configure graceful shutdown
    - Start server on configurable port (default 3000)
    - _Requirements: Architecture requirements_

- [ ] 23. Create environment configuration
  - [ ] 23.1 Define environment variables
    - Create .env.example with all required variables
    - Document each variable purpose
    - Include: MONGODB_URI, JWT_SECRET, ADMIN_TOKEN, TERMII_API_KEY, PAYSTACK_SECRET_KEY, PORT
    - _Requirements: Security requirements_

  - [ ] 23.2 Create configuration module
    - Create config.ts to load and validate environment variables
    - Throw errors for missing required variables
    - Export typed configuration object
    - _Requirements: NFR Security 1-4_

- [ ] 24. Final checkpoint - Integration verification
  - Ensure all unit tests pass
  - Ensure all property-based tests pass (minimum 100 iterations each)
  - Verify end-to-end flows: registration → login → create order → payment → delivery
  - Run full test coverage report (target: 80% line coverage, 75% branch coverage)
  - Verify all 57 correctness properties are tested
  - Ask the user if questions arise or if any adjustments are needed

- [ ] 25. Create API documentation
  - [ ] 25.1 Set up Swagger/OpenAPI
    - Install swagger-ui-express and swagger-jsdoc
    - Create OpenAPI specification file
    - Mount Swagger UI on /api-docs
    - _Requirements: NFR Maintainability 3_

  - [ ] 25.2 Document all endpoints
    - Document all request/response schemas
    - Include example requests and responses
    - Document authentication requirements
    - Document error responses
    - _Requirements: NFR Maintainability 3_

- [ ] 26. Write integration tests
  - [ ]* 26.1 Write order flow integration test
    - Test full flow: create order → payment → vendor accept → rider pickup → delivery
    - Verify state transitions and notifications at each step
    - _Requirements: All order and payment requirements_

  - [ ]* 26.2 Write KYC flow integration test
    - Test: rider submits KYC → admin approves → rider can pickup orders
    - _Requirements: All KYC requirements_

  - [ ]* 26.3 Write real-time notification integration tests
    - Test Socket.io connection and event emission
    - Verify notifications reach correct users/rooms
    - _Requirements: All notification requirements_

- [ ] 27. Final verification checkpoint
  - Run complete test suite (unit + property + integration)
  - Verify all 93 acceptance criteria covered by tests
  - Verify all 57 correctness properties implemented and passing
  - Run linter and fix any issues
  - Ensure TypeScript strict mode passes with no errors
  - Create README with setup instructions, API overview, and running instructions
  - Ask the user for final review and approval

## Notes

- Tasks marked with `*` are optional property-based and integration tests that can be skipped for faster MVP development
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties with randomized inputs (minimum 100 iterations)
- Unit tests validate specific examples, edge cases, and integration points
- Checkpoints ensure incremental validation throughout implementation
- All testing uses Jest framework with fast-check for property-based tests
- MongoDB transactions ensure data consistency for order creation and stock management
- Socket.io authentication uses JWT tokens from the main authentication system
- External service integrations (Termii, Paystack) include retry logic and error handling
