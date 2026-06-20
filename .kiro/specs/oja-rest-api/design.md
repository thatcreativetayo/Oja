# Technical Design Document: Oja REST API

## Overview

### Purpose

The Oja REST API is a hyperlocal 3-sided marketplace backend for Redemption City, Nigeria. It connects buyers with local vendors and facilitates delivery through verified riders. The system provides secure authentication, real-time order tracking, integrated payment processing, and rider verification workflows.

### Core Capabilities

- **Phone-based Authentication**: OTP verification via Termii SMS service with JWT token issuance
- **Multi-Role System**: Support for buyers, vendors, and riders with role-specific permissions
- **Product Catalog Management**: Vendor-controlled inventory with stock tracking
- **Order Processing**: End-to-end order workflow from creation through delivery
- **Real-time Communication**: Socket.io-based notifications for order status changes
- **Payment Integration**: Paystack payment processing with webhook verification
- **Rider Verification**: KYC approval workflow for delivery personnel
- **Admin Controls**: Administrative endpoints for KYC management

### Technology Stack

- **Runtime**: Node.js with TypeScript (strict mode)
- **Web Framework**: Express.js for REST API endpoints
- **Database**: MongoDB with Mongoose ODM for data persistence
- **Real-time**: Socket.io for WebSocket communication
- **Authentication**: JWT for stateless session management
- **External Services**: 
  - Termii API for SMS-based OTP delivery
  - Paystack API for payment processing
- **Build Tools**: tsx (development), tsc (production)

### High-Level Architecture

The system follows a layered architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Applications                       │
│              (Mobile Apps, Web Dashboards)                    │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP/HTTPS + WebSocket
┌───────────────────────▼─────────────────────────────────────┐
│                     API Gateway Layer                         │
│          (Express.js + Socket.io Server)                      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Middleware: Auth, Validation, Error Handling        │    │
│  └─────────────────────────────────────────────────────┘    │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                   Application Layer                           │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Routes  │  │Controllers│ │ Services │  │Middleware│   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                               │
│  - Request routing and validation                             │
│  - Business logic orchestration                               │
│  - External service integration                               │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                     Data Layer                                │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Mongoose Models & Schemas                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                  MongoDB Database                             │
│                                                               │
│  Collections: User, OtpToken, VendorProfile, Product,        │
│               Order, RiderKyc                                 │
└───────────────────────────────────────────────────────────────┘

External Services:
┌──────────┐         ┌──────────┐
│  Termii  │         │ Paystack │
│   SMS    │         │ Payments │
└──────────┘         └──────────┘
```


## Architecture

### System Components

#### 1. API Gateway Layer

**Express.js Server**
- Handles HTTP requests on configurable port (default: 3000)
- CORS middleware for cross-origin requests
- JSON body parsing with size limits
- Request logging and correlation IDs
- Rate limiting for API protection

**Socket.io Server**
- Attached to Express HTTP server
- JWT-based connection authentication
- Room-based message routing for user-specific notifications
- Automatic reconnection handling

#### 2. Middleware Stack

**Authentication Middleware** (`authMiddleware`)
- Extracts Bearer token from Authorization header
- Verifies JWT signature and expiration
- Attaches decoded user payload to request context
- Returns 401 for invalid/missing tokens

**Role Authorization Middleware** (`requireRole`)
- Validates user role against required role(s)
- Returns 403 for insufficient permissions
- Supports single role or array of roles

**Admin Authentication Middleware** (`adminAuthMiddleware`)
- Validates Admin_Token from request headers
- Compares against environment variable ADMIN_TOKEN
- Returns 401 for invalid admin tokens

**Validation Middleware** (`validateRequest`)
- Schema-based request validation using Mongoose schemas
- Validates request body, query parameters, and path parameters
- Returns 400 with detailed validation errors

**Error Handler Middleware** (`errorHandler`)
- Catches all uncaught errors from route handlers
- Formats errors into consistent JSON structure
- Logs errors with stack traces
- Returns appropriate HTTP status codes

#### 3. Route Modules

Routes are organized by domain and mounted on the Express app:

- **`/auth`**: Registration, login, OTP verification
- **`/vendors`**: Vendor profile management and search
- **`/products`**: Product CRUD operations and catalog queries
- **`/orders`**: Order creation, status updates, and retrieval
- **`/payments`**: Payment initiation and webhook handling
- **`/kyc`**: Rider KYC submission and admin management
- **`/riders`**: Rider-specific operations (QR verification, order pickup)

#### 4. Controller Layer

Controllers handle request/response logic:

- **AuthController**: User registration, OTP generation/verification, JWT issuance
- **VendorController**: Profile CRUD, operational status management
- **ProductController**: Product catalog management, stock updates
- **OrderController**: Order creation, status transitions, retrieval
- **PaymentController**: Paystack integration, webhook verification
- **KycController**: Rider KYC submission, admin approval/rejection
- **RiderController**: QR code verification, order pickup

Each controller method:
1. Validates request data
2. Calls appropriate service methods
3. Returns formatted JSON responses
4. Handles controller-level errors

#### 5. Service Layer

Services contain business logic and external integrations:

**AuthService**
- OTP generation (6-digit random numbers)
- OTP storage with TTL (10 minutes)
- JWT token generation (7-day expiration)
- Token verification and payload extraction

**OtpService**
- Termii API integration
- SMS message formatting
- API key management
- Retry logic for failed sends

**VendorService**
- Profile creation and updates
- Operational status management
- Vendor search with status filtering
- Ownership verification

**ProductService**
- Product CRUD operations
- Stock quantity management
- Vendor association validation
- Availability filtering

**OrderService**
- Order creation with validation
- QR code generation (UUID-based)
- Total amount calculation
- Order status state machine
- Vendor notification via Socket.io

**PaymentService**
- Paystack payment link generation
- Reference tracking
- Webhook signature verification (HMAC SHA512)
- Payment status updates
- Vendor notification on payment confirmation

**KycService**
- KYC submission validation
- Admin approval/rejection workflow
- Status checking
- Document storage

**RiderService**
- QR code verification
- Order assignment
- Delivery status updates
- KYC status validation

**NotificationService**
- Socket.io event emission
- Room-based targeting (user IDs)
- Event payload formatting
- Connection management

#### 6. Data Models

Mongoose models define schemas and provide database operations:

- **User**: User accounts with role-based access
- **OtpToken**: Time-limited OTP storage
- **VendorProfile**: Vendor shop information
- **Product**: Product catalog entries
- **Order**: Order transactions with items and delivery info
- **RiderKyc**: KYC verification records

### Data Flow Patterns

#### Pattern 1: OTP Authentication Flow

```
Client → POST /auth/register → AuthController
  → AuthService.createUser() → User.create()
  → OtpService.generateOtp() → OtpToken.create()
  → OtpService.sendSms() → Termii API
  → Response: { success: true }

Client → POST /auth/verify-otp → AuthController
  → AuthService.verifyOtp() → OtpToken.findOne()
  → AuthService.generateJwt() → jwt.sign()
  → Response: { token: "..." }
```

#### Pattern 2: Order Creation with Real-time Notification

```
Client → POST /orders → OrderController
  → OrderService.validateProducts() → Product.find()
  → OrderService.checkStock()
  → OrderService.calculateTotal()
  → Order.create()
  → ProductService.decrementStock() → Product.updateMany()
  → NotificationService.emitToVendor() → Socket.io
  → Response: { order: {...} }
```

#### Pattern 3: Payment Webhook Processing

```
Paystack → POST /payments/webhook → PaymentController
  → PaymentService.verifySignature() → HMAC SHA512
  → PaymentService.updateOrderPayment() → Order.updateOne()
  → NotificationService.emitToVendor() → Socket.io
  → Response: { received: true }
```

#### Pattern 4: Order Status State Machine

```
Order Status Transitions:

PENDING_ACCEPTANCE
  ↓ (Vendor accepts)
READY_FOR_PICKUP → Emit to all approved riders
  ↓ (Rider picks up with QR code)
OUT_FOR_DELIVERY → Assign rider to order
  ↓ (Rider marks delivered)
DELIVERED → Final state

Guards:
- PENDING_ACCEPTANCE → READY_FOR_PICKUP: Payment must be PAID
- READY_FOR_PICKUP → OUT_FOR_DELIVERY: Rider must be KYC approved
- Each transition validates current state before proceeding
```

### Security Architecture

#### Authentication Flow

1. **Registration Phase**
   - User submits phone number, name, role
   - System validates phone format (+234XXXXXXXXXX)
   - System generates 6-digit OTP
   - OTP stored with 10-minute TTL
   - SMS sent via Termii

2. **Verification Phase**
   - User submits phone number + OTP
   - System validates OTP within expiration window
   - JWT generated with 7-day expiration
   - Token payload: `{ userId, role, phoneNumber }`
   - Token signed with secret from environment

3. **Authorization Phase**
   - Client includes `Authorization: Bearer <token>`
   - Middleware verifies signature and expiration
   - User context attached to request
   - Role-based access control applied

#### Webhook Security

Paystack webhooks use HMAC SHA512 signature verification:

1. Extract `x-paystack-signature` header
2. Compute HMAC SHA512 of raw request body with secret key
3. Compare computed hash with received signature
4. Reject webhook if signatures don't match
5. Log security events for audit

#### Data Protection

- JWT secrets stored in environment variables
- Admin tokens stored in environment variables
- Termii API key stored in environment variables
- Paystack secret key stored in environment variables
- MongoDB connection string in environment variables
- No sensitive data logged in error messages


## Components and Interfaces

### API Endpoints

#### Authentication Endpoints

**POST /auth/register**
- **Purpose**: Create new user account
- **Authentication**: None
- **Request Body**:
  ```typescript
  {
    phoneNumber: string;  // Format: +234XXXXXXXXXX
    name: string;
    role: "buyer" | "vendor" | "rider";
  }
  ```
- **Response**: `{ success: boolean; message: string; userId?: string }`
- **Status Codes**: 201 (created), 400 (validation error), 409 (phone already exists)

**POST /auth/login**
- **Purpose**: Request OTP for login
- **Authentication**: None
- **Request Body**:
  ```typescript
  {
    phoneNumber: string;  // Format: +234XXXXXXXXXX
  }
  ```
- **Response**: `{ success: boolean; message: string }`
- **Status Codes**: 200 (OTP sent), 404 (user not found), 503 (SMS service error)

**POST /auth/verify-otp**
- **Purpose**: Verify OTP and receive JWT token
- **Authentication**: None
- **Request Body**:
  ```typescript
  {
    phoneNumber: string;
    otp: string;  // 6-digit code
  }
  ```
- **Response**: `{ success: boolean; token: string; user: UserObject }`
- **Status Codes**: 200 (success), 401 (invalid/expired OTP)

#### Vendor Endpoints

**POST /vendors/profile**
- **Purpose**: Create vendor profile
- **Authentication**: JWT (role: vendor)
- **Request Body**:
  ```typescript
  {
    shopName: string;
    category: "Groceries" | "Food" | "Electronics" | "Fashion" | "Health" | "Services";
    landmark: string;
    openingHours: string;
  }
  ```
- **Response**: `{ success: boolean; profile: VendorProfileObject }`
- **Status Codes**: 201 (created), 400 (validation error), 403 (not vendor role), 409 (profile exists)

**GET /vendors/profile**
- **Purpose**: Retrieve own vendor profile
- **Authentication**: JWT (role: vendor)
- **Response**: `{ success: boolean; profile: VendorProfileObject }`
- **Status Codes**: 200 (success), 404 (profile not found)

**PUT /vendors/profile**
- **Purpose**: Update vendor profile
- **Authentication**: JWT (role: vendor)
- **Request Body**: Partial VendorProfile fields
- **Response**: `{ success: boolean; profile: VendorProfileObject }`
- **Status Codes**: 200 (updated), 400 (validation error)

**PATCH /vendors/status**
- **Purpose**: Update operational status (OPEN/CLOSED)
- **Authentication**: JWT (role: vendor)
- **Request Body**:
  ```typescript
  {
    status: "OPEN" | "CLOSED";
  }
  ```
- **Response**: `{ success: boolean; status: string }`
- **Status Codes**: 200 (updated)

**GET /vendors/search**
- **Purpose**: Search for open vendors
- **Authentication**: JWT
- **Query Parameters**: `?category=Food&searchTerm=pizza`
- **Response**: `{ success: boolean; vendors: VendorProfileObject[] }`
- **Status Codes**: 200 (success)

#### Product Endpoints

**POST /products**
- **Purpose**: Create new product
- **Authentication**: JWT (role: vendor)
- **Request Body**:
  ```typescript
  {
    name: string;
    description: string;
    price: number;  // Positive
    stockQuantity: number;  // Non-negative integer
    category: string;
    imageUrl: string;
  }
  ```
- **Response**: `{ success: boolean; product: ProductObject }`
- **Status Codes**: 201 (created), 400 (validation error), 404 (vendor profile not found)

**GET /products**
- **Purpose**: List all products (filtered by stock > 0)
- **Authentication**: JWT
- **Query Parameters**: `?vendorId=xxx&category=Food`
- **Response**: `{ success: boolean; products: ProductObject[] }`
- **Status Codes**: 200 (success)

**GET /products/:id**
- **Purpose**: Get single product details
- **Authentication**: JWT
- **Response**: `{ success: boolean; product: ProductObject }`
- **Status Codes**: 200 (success), 404 (not found)

**PUT /products/:id**
- **Purpose**: Update product
- **Authentication**: JWT (role: vendor, owner only)
- **Request Body**: Partial Product fields
- **Response**: `{ success: boolean; product: ProductObject }`
- **Status Codes**: 200 (updated), 403 (not owner), 404 (not found)

**DELETE /products/:id**
- **Purpose**: Delete product
- **Authentication**: JWT (role: vendor, owner only)
- **Response**: `{ success: boolean; message: string }`
- **Status Codes**: 200 (deleted), 403 (not owner), 404 (not found)

#### Order Endpoints

**POST /orders**
- **Purpose**: Create new order
- **Authentication**: JWT (role: buyer)
- **Request Body**:
  ```typescript
  {
    vendorId: string;
    items: Array<{
      productId: string;
      quantity: number;
    }>;
    deliveryAddress: string;
    deliveryPhoneNumber: string;
  }
  ```
- **Response**: `{ success: boolean; order: OrderObject }`
- **Status Codes**: 201 (created), 400 (validation/stock error)

**GET /orders**
- **Purpose**: List user's orders (buyer sees their orders, vendor sees orders with their products)
- **Authentication**: JWT
- **Response**: `{ success: boolean; orders: OrderObject[] }`
- **Status Codes**: 200 (success)

**GET /orders/:id**
- **Purpose**: Get order details
- **Authentication**: JWT (buyer, vendor, or assigned rider)
- **Response**: `{ success: boolean; order: OrderObject }`
- **Status Codes**: 200 (success), 403 (not authorized), 404 (not found)

**PATCH /orders/:id/accept**
- **Purpose**: Vendor accepts order (PENDING_ACCEPTANCE → READY_FOR_PICKUP)
- **Authentication**: JWT (role: vendor, order vendor only)
- **Response**: `{ success: boolean; order: OrderObject }`
- **Status Codes**: 200 (accepted), 400 (invalid state), 403 (not vendor's order)

**PATCH /orders/:id/pickup**
- **Purpose**: Rider picks up order (READY_FOR_PICKUP → OUT_FOR_DELIVERY)
- **Authentication**: JWT (role: rider, KYC approved)
- **Request Body**:
  ```typescript
  {
    qrCode: string;
  }
  ```
- **Response**: `{ success: boolean; order: OrderObject }`
- **Status Codes**: 200 (picked up), 400 (invalid QR/state), 403 (not KYC approved)

**PATCH /orders/:id/deliver**
- **Purpose**: Rider marks order delivered (OUT_FOR_DELIVERY → DELIVERED)
- **Authentication**: JWT (role: rider, assigned rider only)
- **Response**: `{ success: boolean; order: OrderObject }`
- **Status Codes**: 200 (delivered), 400 (invalid state), 403 (not assigned rider)

**PATCH /orders/:id/cancel**
- **Purpose**: Cancel order (only in PENDING_ACCEPTANCE state)
- **Authentication**: JWT (buyer who created order)
- **Response**: `{ success: boolean; message: string }`
- **Status Codes**: 200 (cancelled), 400 (cannot cancel), 403 (not order creator)

#### Payment Endpoints

**POST /payments/initiate**
- **Purpose**: Generate Paystack payment link
- **Authentication**: JWT
- **Request Body**:
  ```typescript
  {
    orderId: string;
  }
  ```
- **Response**: `{ success: boolean; paymentUrl: string; reference: string }`
- **Status Codes**: 200 (success), 404 (order not found)

**POST /payments/webhook**
- **Purpose**: Receive Paystack payment notifications
- **Authentication**: HMAC SHA512 signature verification
- **Headers**: `x-paystack-signature: <hash>`
- **Request Body**: Paystack webhook payload
- **Response**: `{ received: boolean }`
- **Status Codes**: 200 (processed), 401 (signature verification failed)

#### KYC Endpoints

**POST /kyc/submit**
- **Purpose**: Submit rider KYC documentation
- **Authentication**: JWT (role: rider)
- **Request Body**:
  ```typescript
  {
    governmentIdType: "NIN" | "Drivers_License" | "Voters_Card" | "International_Passport";
    governmentIdNumber: string;
    governmentIdImage: string;  // URL or base64
    guarantorName: string;
    guarantorPhone: string;
    guarantorAddress: string;
  }
  ```
- **Response**: `{ success: boolean; kyc: RiderKycObject }`
- **Status Codes**: 201 (submitted), 400 (validation error), 409 (already submitted)

**GET /kyc/status**
- **Purpose**: Check own KYC status
- **Authentication**: JWT (role: rider)
- **Response**: `{ success: boolean; kyc: RiderKycObject }`
- **Status Codes**: 200 (success), 404 (not submitted)

**GET /kyc/pending** (Admin)
- **Purpose**: List pending KYC submissions
- **Authentication**: Admin token
- **Response**: `{ success: boolean; submissions: RiderKycObject[] }`
- **Status Codes**: 200 (success), 401 (invalid admin token)

**PATCH /kyc/:id/approve** (Admin)
- **Purpose**: Approve KYC submission
- **Authentication**: Admin token
- **Response**: `{ success: boolean; kyc: RiderKycObject }`
- **Status Codes**: 200 (approved), 400 (invalid state), 401 (invalid admin token)

**PATCH /kyc/:id/reject** (Admin)
- **Purpose**: Reject KYC submission
- **Authentication**: Admin token
- **Request Body**:
  ```typescript
  {
    reason: string;
  }
  ```
- **Response**: `{ success: boolean; kyc: RiderKycObject }`
- **Status Codes**: 200 (rejected), 400 (invalid state), 401 (invalid admin token)

#### Rider Endpoints

**POST /riders/verify-qr**
- **Purpose**: Verify order QR code for pickup
- **Authentication**: JWT (role: rider, KYC approved)
- **Request Body**:
  ```typescript
  {
    qrCode: string;
  }
  ```
- **Response**: `{ success: boolean; order: OrderObject }`
- **Status Codes**: 200 (valid), 400 (invalid QR/order state), 403 (not KYC approved)

### Socket.io Events

#### Client → Server

**connection**
- **Authentication**: JWT token in auth handshake
- **Purpose**: Establish WebSocket connection
- **Payload**: `{ token: string }`

**disconnect**
- **Purpose**: Clean up connection

#### Server → Client

**orderCreated**
- **Target**: Vendor (specific user room)
- **Trigger**: New order created with vendor's products
- **Payload**:
  ```typescript
  {
    orderId: string;
    buyerName: string;
    items: Array<{ productName: string; quantity: number }>;
    totalAmount: number;
    deliveryAddress: string;
    createdAt: string;
  }
  ```

**orderReadyForPickup**
- **Target**: All KYC-approved riders (broadcast to "approved-riders" room)
- **Trigger**: Vendor accepts order
- **Payload**:
  ```typescript
  {
    orderId: string;
    vendorLocation: string;
    deliveryAddress: string;
    qrCode: string;
    totalAmount: number;
  }
  ```

**orderStatusChanged**
- **Target**: Buyer (specific user room)
- **Trigger**: Order status transitions
- **Payload**:
  ```typescript
  {
    orderId: string;
    previousStatus: string;
    newStatus: string;
    updatedAt: string;
  }
  ```

**paymentConfirmed**
- **Target**: Vendor (specific user room)
- **Trigger**: Payment webhook confirms payment
- **Payload**:
  ```typescript
  {
    orderId: string;
    amount: number;
    reference: string;
    paidAt: string;
  }
  ```

### External Service Interfaces

#### Termii SMS API

**Base URL**: `https://api.ng.termii.com/api/sms/send`

**Request**:
```typescript
POST /api/sms/send
Headers: {
  "Content-Type": "application/json"
}
Body: {
  to: string;  // Phone number
  from: string;  // Sender ID
  sms: string;  // Message content
  type: "plain";
  channel: "generic";
  api_key: string;  // From environment
}
```

**Response**:
```typescript
{
  message_id: string;
  message: string;
  balance: number;
  user: string;
}
```

**Error Handling**:
- Network errors: Retry up to 3 times with exponential backoff
- 4xx errors: Log and return error to user
- 5xx errors: Retry with backoff

#### Paystack Payment API

**Initialize Payment**
- **Base URL**: `https://api.paystack.co/transaction/initialize`
- **Method**: POST
- **Headers**: `Authorization: Bearer <secret_key>`
- **Request**:
  ```typescript
  {
    email: string;  // Buyer's email (derived from phone)
    amount: number;  // In kobo (NGN * 100)
    reference: string;  // Unique order reference
    callback_url: string;  // Redirect after payment
  }
  ```
- **Response**:
  ```typescript
  {
    status: boolean;
    message: string;
    data: {
      authorization_url: string;  // Payment link
      access_code: string;
      reference: string;
    }
  }
  ```

**Webhook Payload**:
```typescript
{
  event: "charge.success" | "charge.failed";
  data: {
    reference: string;
    amount: number;
    status: "success" | "failed";
    paid_at: string;
    customer: {
      email: string;
    };
  };
}
```


## Data Models

### Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o| VendorProfile : "has (if vendor)"
    User ||--o| RiderKyc : "has (if rider)"
    User ||--o{ OtpToken : "generates"
    User ||--o{ Order : "creates (buyer)"
    User ||--o{ Order : "assigned to (rider)"
    VendorProfile ||--o{ Product : "owns"
    VendorProfile ||--o{ Order : "receives"
    Product }o--|| Order : "contains"
    
    User {
        ObjectId _id PK
        string phoneNumber UK "Format: +234XXXXXXXXXX"
        string name
        enum role "buyer, vendor, rider"
        Date createdAt
        Date updatedAt
    }
    
    OtpToken {
        ObjectId _id PK
        ObjectId userId FK
        string otp "6-digit code"
        Date expiresAt "10 minutes TTL"
        Date createdAt
    }
    
    VendorProfile {
        ObjectId _id PK
        ObjectId userId FK UK
        string shopName
        enum category "Groceries, Food, Electronics, Fashion, Health, Services"
        string landmark
        string openingHours
        enum operationalStatus "OPEN, CLOSED"
        Date createdAt
        Date updatedAt
    }
    
    Product {
        ObjectId _id PK
        ObjectId vendorId FK
        string name
        string description
        number price "Positive"
        number stockQuantity "Non-negative"
        string category
        string imageUrl
        Date createdAt
        Date updatedAt
    }
    
    Order {
        ObjectId _id PK
        ObjectId buyerId FK
        ObjectId vendorId FK
        ObjectId riderId FK "Nullable, assigned on pickup"
        array items "Array of {productId, quantity, price}"
        number totalAmount
        string deliveryAddress
        string deliveryPhoneNumber
        string qrCode UK "UUID-based"
        enum orderStatus "PENDING_ACCEPTANCE, READY_FOR_PICKUP, OUT_FOR_DELIVERY, DELIVERED"
        enum paymentStatus "UNPAID, PENDING_CONFIRMATION, PAID"
        string paystackReference "Nullable"
        Date createdAt
        Date updatedAt
    }
    
    RiderKyc {
        ObjectId _id PK
        ObjectId riderId FK UK
        enum governmentIdType "NIN, Drivers_License, Voters_Card, International_Passport"
        string governmentIdNumber
        string governmentIdImage
        string guarantorName
        string guarantorPhone
        string guarantorAddress
        enum kycStatus "PENDING, APPROVED, REJECTED"
        string rejectionReason "Nullable"
        Date submittedAt
        Date reviewedAt "Nullable"
    }
```

### User Model

**Collection**: `users`

**Schema**:
```typescript
{
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: (v: string) => /^\+234\d{10}$/.test(v),
      message: "Phone number must follow format +234XXXXXXXXXX"
    }
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    required: true,
    enum: ["buyer", "vendor", "rider"]
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}
```

**Indexes**:
- `phoneNumber`: Unique index for fast lookups
- `role`: Non-unique index for role-based queries

**Business Rules**:
- Phone number cannot be changed after registration
- Role cannot be changed after registration
- One user can have only one role

### OtpToken Model

**Collection**: `otptokens`

**Schema**:
```typescript
{
  userId: {
    type: ObjectId,
    ref: "User",
    required: true
  },
  otp: {
    type: String,
    required: true,
    length: 6,
    validate: {
      validator: (v: string) => /^\d{6}$/.test(v),
      message: "OTP must be 6 digits"
    }
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 10 * 60 * 1000)  // 10 minutes
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}
```

**Indexes**:
- `userId`: Non-unique index for user lookups
- `expiresAt`: TTL index for automatic deletion (expires documents at expiresAt time)

**Business Rules**:
- OTP valid for exactly 10 minutes from creation
- Multiple OTPs can exist per user (latest valid one is used)
- Expired OTPs automatically deleted by MongoDB TTL index

### VendorProfile Model

**Collection**: `vendorprofiles`

**Schema**:
```typescript
{
  userId: {
    type: ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  shopName: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ["Groceries", "Food", "Electronics", "Fashion", "Health", "Services"]
  },
  landmark: {
    type: String,
    required: true,
    trim: true
  },
  openingHours: {
    type: String,
    required: true
  },
  operationalStatus: {
    type: String,
    enum: ["OPEN", "CLOSED"],
    default: "CLOSED"
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}
```

**Indexes**:
- `userId`: Unique index (one profile per vendor)
- `category, operationalStatus`: Compound index for search queries
- `operationalStatus`: Non-unique index for filtering open shops

**Business Rules**:
- One vendor can have only one profile
- New profiles default to CLOSED status
- Only vendor with matching userId can update profile

### Product Model

**Collection**: `products`

**Schema**:
```typescript
{
  vendorId: {
    type: ObjectId,
    ref: "VendorProfile",
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0.01,
    validate: {
      validator: (v: number) => v > 0,
      message: "Price must be positive"
    }
  },
  stockQuantity: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: (v: number) => Number.isInteger(v),
      message: "Stock quantity must be an integer"
    }
  },
  category: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}
```

**Indexes**:
- `vendorId`: Non-unique index for vendor's products
- `category`: Non-unique index for category filtering
- `stockQuantity`: Non-unique index for availability queries

**Business Rules**:
- Price must be positive (> 0)
- Stock quantity must be non-negative integer (≥ 0)
- Only vendor who owns the product can update/delete it
- Products with stockQuantity = 0 hidden from buyer searches

### Order Model

**Collection**: `orders`

**Schema**:
```typescript
{
  buyerId: {
    type: ObjectId,
    ref: "User",
    required: true
  },
  vendorId: {
    type: ObjectId,
    ref: "VendorProfile",
    required: true
  },
  riderId: {
    type: ObjectId,
    ref: "User",
    default: null
  },
  items: [{
    productId: {
      type: ObjectId,
      ref: "Product",
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true
    }
  }],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  deliveryAddress: {
    type: String,
    required: true
  },
  deliveryPhoneNumber: {
    type: String,
    required: true
  },
  qrCode: {
    type: String,
    required: true,
    unique: true
  },
  orderStatus: {
    type: String,
    enum: ["PENDING_ACCEPTANCE", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "DELIVERED"],
    default: "PENDING_ACCEPTANCE"
  },
  paymentStatus: {
    type: String,
    enum: ["UNPAID", "PENDING_CONFIRMATION", "PAID"],
    default: "UNPAID"
  },
  paystackReference: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}
```

**Indexes**:
- `qrCode`: Unique index for QR verification
- `buyerId`: Non-unique index for buyer's orders
- `vendorId`: Non-unique index for vendor's orders
- `riderId`: Non-unique index for rider's assignments
- `orderStatus`: Non-unique index for status filtering
- `paystackReference`: Non-unique index for webhook lookups

**Business Rules**:
- All items must belong to the same vendor
- Total amount = sum of (item.quantity × item.price)
- QR code generated on order creation (UUID v4)
- Order status transitions must follow state machine rules
- Rider assigned when status transitions to OUT_FOR_DELIVERY
- Payment must be PAID before vendor can accept order

**State Machine Constraints**:
```typescript
const validTransitions = {
  PENDING_ACCEPTANCE: ["READY_FOR_PICKUP"],  // Requires: paymentStatus === PAID
  READY_FOR_PICKUP: ["OUT_FOR_DELIVERY"],    // Requires: riderId assigned, rider KYC approved
  OUT_FOR_DELIVERY: ["DELIVERED"],           // Requires: riderId matches requester
  DELIVERED: []                              // Final state
};
```

### RiderKyc Model

**Collection**: `riderkycs`

**Schema**:
```typescript
{
  riderId: {
    type: ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  governmentIdType: {
    type: String,
    required: true,
    enum: ["NIN", "Drivers_License", "Voters_Card", "International_Passport"]
  },
  governmentIdNumber: {
    type: String,
    required: true
  },
  governmentIdImage: {
    type: String,
    required: true
  },
  guarantorName: {
    type: String,
    required: true
  },
  guarantorPhone: {
    type: String,
    required: true
  },
  guarantorAddress: {
    type: String,
    required: true
  },
  kycStatus: {
    type: String,
    enum: ["PENDING", "APPROVED", "REJECTED"],
    default: "PENDING"
  },
  rejectionReason: {
    type: String,
    default: null
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: {
    type: Date,
    default: null
  }
}
```

**Indexes**:
- `riderId`: Unique index (one KYC per rider)
- `kycStatus`: Non-unique index for admin filtering

**Business Rules**:
- One KYC submission per rider
- New submissions default to PENDING status
- Only admin can approve/reject submissions
- Rejection requires a reason
- Riders can only perform deliveries if kycStatus === APPROVED

### Data Consistency Rules

#### Stock Quantity Consistency

When an order is created:
1. Check if sufficient stock exists for all items
2. If yes, atomically decrement stock quantities
3. If no, reject order with error

Transaction approach:
```typescript
// Use Mongoose transaction
const session = await mongoose.startSession();
session.startTransaction();
try {
  // 1. Verify stock
  for (const item of items) {
    const product = await Product.findById(item.productId).session(session);
    if (product.stockQuantity < item.quantity) {
      throw new Error("Insufficient stock");
    }
  }
  
  // 2. Create order
  const order = await Order.create([orderData], { session });
  
  // 3. Decrement stock
  for (const item of items) {
    await Product.findByIdAndUpdate(
      item.productId,
      { $inc: { stockQuantity: -item.quantity } },
      { session }
    );
  }
  
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

#### Payment Status Consistency

Paystack webhook must be idempotent:
- Check if reference already processed
- Only update if paymentStatus is UNPAID or PENDING_CONFIRMATION
- Emit notification only if status actually changed

#### Order Status Transition Guards

Before any status transition:
1. Validate current status matches expected previous state
2. Validate all prerequisites (payment, KYC, etc.)
3. Update status atomically
4. Emit notifications after successful update


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all 93 acceptance criteria, I've identified several areas where properties can be consolidated to avoid redundancy:

**Consolidated Areas:**
1. **Input Validation**: Multiple criteria test enum validation (role, category, governmentIdType, etc.) - these can be combined into general input validation properties
2. **Authorization**: Many criteria test role-based access and ownership - these can be consolidated into comprehensive authorization properties
3. **State Transitions**: Multiple criteria test order status transitions and guards - these can be unified into state machine properties
4. **Error Handling**: Several criteria test specific HTTP status codes - these can be combined into general error handling properties
5. **Real-time Notifications**: Multiple criteria test different event emissions - these can be consolidated into notification properties
6. **Round-trip Properties**: User/profile/product CRUD operations can be tested with round-trip properties

The properties below represent the deduplicated, essential correctness properties for the Oja REST API.

### Authentication and Authorization Properties

#### Property 1: Phone Number Format Validation

*For any* registration or login request, the system SHALL accept phoneNumber if and only if it matches the format `+234\d{10}` (plus sign, 234, followed by exactly 10 digits).

**Validates: Requirements 1.2**

#### Property 2: Role Validation on Registration

*For any* registration request, the system SHALL accept role if and only if it is one of: "buyer", "vendor", or "rider".

**Validates: Requirements 1.3**

#### Property 3: OTP Expiration Consistency

*For any* generated OTP, the expiration time SHALL be exactly 10 minutes (600 seconds) from the creation timestamp.

**Validates: Requirements 1.5**

#### Property 4: OTP Verification Time Window

*For any* OTP verification attempt, the system SHALL accept the OTP if and only if: (1) the OTP matches the stored value AND (2) the current time is before the expiration time.

**Validates: Requirements 1.6, 1.8**

#### Property 5: JWT Expiration Consistency

*For any* successful OTP verification, the generated JWT token SHALL have an expiration time of exactly 7 days from issuance.

**Validates: Requirements 1.7**

#### Property 6: JWT Authentication Round-trip

*For any* valid JWT token generated by the system, if the token is included as `Bearer <token>` in the Authorization header, the system SHALL extract the correct user context (userId, role, phoneNumber) from the token.

**Validates: Requirements 1.9**

#### Property 7: Role-Based Access Control

*For any* protected endpoint and user, the system SHALL grant access if and only if the user's role (from JWT token) matches one of the allowed roles for that endpoint.

**Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7**

#### Property 8: Resource Ownership Authorization

*For any* update or delete operation on a user-owned resource (VendorProfile, Product), the system SHALL allow the operation if and only if the requesting user's ID matches the resource owner's ID.

**Validates: Requirements 2.6, 3.6**

#### Property 9: Admin Token Validation

*For any* KYC admin endpoint request, the system SHALL allow the operation if and only if the provided Admin_Token matches the configured admin token.

**Validates: Requirements 8.7, 8.8**

### Data Validation Properties

#### Property 10: Enum Field Validation

*For any* request containing an enum field (category, governmentIdType, operationalStatus, etc.), the system SHALL accept the value if and only if it is one of the allowed values defined in the schema.

**Validates: Requirements 1.3, 2.2, 8.2**

#### Property 11: Positive Price Validation

*For any* product creation or update request, the system SHALL accept the price if and only if it is a positive number (> 0).

**Validates: Requirements 3.2**

#### Property 12: Non-negative Integer Stock Validation

*For any* product creation or update request, the system SHALL accept stockQuantity if and only if it is a non-negative integer (>= 0 and integer).

**Validates: Requirements 3.3**

#### Property 13: Required Field Validation

*For any* API request, if required fields are missing from the request body, the system SHALL return HTTP 400 with validation errors listing all missing fields.

**Validates: Requirements 4.2, 11.6, 11.8**

#### Property 14: Type and Format Validation

*For any* API request, if fields have incorrect types or formats according to the schema, the system SHALL return HTTP 400 with validation errors describing the type/format violations.

**Validates: Requirements 11.7, 11.8**

### CRUD Round-trip Properties

#### Property 15: User Registration Round-trip

*For any* valid registration data (phoneNumber, name, role), after successful registration, retrieving the created user SHALL return a user object with equivalent field values.

**Validates: Requirements 1.1**

#### Property 16: Vendor Profile Round-trip

*For any* valid vendor profile data, after creating a profile, retrieving the profile SHALL return all fields with equivalent values, and the operationalStatus SHALL be "CLOSED".

**Validates: Requirements 2.1, 2.3, 2.5**

#### Property 17: Product CRUD Round-trip

*For any* valid product data, after creating a product, retrieving the product SHALL return all fields with equivalent values. After updating specific fields, retrieving the product SHALL show only those fields changed, with other fields unchanged. After deletion, retrieving the product SHALL return a 404 error.

**Validates: Requirements 3.1, 3.4, 3.5**

#### Property 18: Operational Status Update Consistency

*For any* vendor profile and any valid operational status value ("OPEN" or "CLOSED"), after updating the status, retrieving the profile SHALL show the new status value.

**Validates: Requirements 2.4**

### Order Creation and Management Properties

#### Property 19: Single Vendor Order Validation

*For any* order creation request, if the items contain products from multiple different vendors, the system SHALL reject the order with a validation error.

**Validates: Requirements 4.1**

#### Property 20: Order Initialization Defaults

*For any* valid order creation request, the created order SHALL have orderStatus = "PENDING_ACCEPTANCE", paymentStatus = "UNPAID", riderId = null, and a unique qrCode.

**Validates: Requirements 4.3, 4.5**

#### Property 21: Order Total Calculation

*For any* order with items, the totalAmount SHALL equal the sum of (item.quantity × item.price) for all items in the order.

**Validates: Requirements 4.4**

#### Property 22: Stock Decrement on Order

*For any* order creation, for each product in the order, the product's stockQuantity SHALL decrease by the ordered quantity atomically.

**Validates: Requirements 3.8**

#### Property 23: Insufficient Stock Rejection

*For any* order creation attempt, if any product's current stockQuantity is less than the requested quantity, the system SHALL reject the entire order and no stock quantities SHALL be modified.

**Validates: Requirements 3.9**

#### Property 24: Order Visibility by Role

*For any* buyer, retrieving orders SHALL return only orders where buyerId equals the user's ID. *For any* vendor, retrieving orders SHALL return only orders where vendorId equals the vendor's profile ID. *For any* rider, retrieving orders SHALL return only orders where riderId equals the user's ID.

**Validates: Requirements 4.7, 4.8**

#### Property 25: Cancellation State Guard

*For any* order, cancellation SHALL succeed if and only if orderStatus = "PENDING_ACCEPTANCE" and the requester is the buyer who created the order.

**Validates: Requirements 4.9**

### Order State Machine Properties

#### Property 26: Valid State Transitions

*For any* order status transition request, the system SHALL allow the transition if and only if the current orderStatus is the valid previous state for the requested new state according to the state machine:
- PENDING_ACCEPTANCE → READY_FOR_PICKUP (requires paymentStatus = PAID)
- READY_FOR_PICKUP → OUT_FOR_DELIVERY (requires KYC-approved rider)
- OUT_FOR_DELIVERY → DELIVERED (requires assigned rider)

All other transitions SHALL be rejected.

**Validates: Requirements 5.1, 5.3, 5.4, 5.6, 5.7**

#### Property 27: Rider Assignment on Pickup

*For any* order pickup operation (READY_FOR_PICKUP → OUT_FOR_DELIVERY), after the transition, the order's riderId SHALL equal the ID of the rider who performed the pickup.

**Validates: Requirements 5.5**

#### Property 28: Payment Prerequisite for Acceptance

*For any* vendor acceptance attempt (PENDING_ACCEPTANCE → READY_FOR_PICKUP), the system SHALL allow the transition if and only if paymentStatus = "PAID".

**Validates: Requirements 7.6**

### Product Availability Properties

#### Property 29: Stock Filtering for Buyers

*For any* product catalog query by a buyer, the returned products SHALL include only products where stockQuantity > 0.

**Validates: Requirements 3.7**

#### Property 30: Vendor Search Filtering

*For any* vendor search query, the returned vendors SHALL include only vendors where operationalStatus = "OPEN".

**Validates: Requirements 2.7**

### QR Code Verification Properties

#### Property 31: QR Code Validity Check

*For any* QR code verification request, the system SHALL accept the QR code if and only if: (1) the QR code matches an existing order's qrCode AND (2) the order's orderStatus = "READY_FOR_PICKUP" AND (3) the requesting rider's kycStatus = "APPROVED".

**Validates: Requirements 6.1, 6.2, 6.3, 6.5, 6.6**

#### Property 32: QR Verification Response Completeness

*For any* successful QR code verification, the response SHALL include all order details including vendorLocation (from vendor profile landmark) and deliveryAddress.

**Validates: Requirements 6.4**

### Payment Integration Properties

#### Property 33: Payment Reference Storage

*For any* payment initiation request, the system SHALL generate a Paystack payment link and store the reference in the order's paystackReference field with the correct totalAmount.

**Validates: Requirements 7.1, 7.2**

#### Property 34: Webhook Signature Verification

*For any* incoming webhook request, the system SHALL compute HMAC SHA512 of the raw request body using the Paystack secret key, and SHALL process the webhook if and only if the computed signature matches the x-paystack-signature header.

**Validates: Requirements 7.3, 7.5**

#### Property 35: Payment Status Transition on Webhook

*For any* verified webhook with event "charge.success", if the order's paymentStatus is "UNPAID" or "PENDING_CONFIRMATION", the system SHALL transition paymentStatus to "PAID".

**Validates: Requirements 7.4**

### KYC Management Properties

#### Property 36: KYC Submission Uniqueness

*For any* rider, the system SHALL allow at most one KYC submission. If a rider attempts to submit KYC when a submission already exists, the system SHALL reject the request.

**Validates: Requirements 8.4**

#### Property 37: KYC Initial Status

*For any* new KYC submission, the kycStatus SHALL be initialized to "PENDING" and reviewedAt SHALL be null.

**Validates: Requirements 8.3**

#### Property 38: KYC Approval Transition

*For any* pending KYC record, when an admin approves it, the kycStatus SHALL transition to "APPROVED" and reviewedAt SHALL be set to the current timestamp.

**Validates: Requirements 8.5**

#### Property 39: KYC Rejection with Reason

*For any* pending KYC record, when an admin rejects it with a reason, the kycStatus SHALL transition to "REJECTED", the rejectionReason SHALL be stored, and reviewedAt SHALL be set to the current timestamp.

**Validates: Requirements 8.6**

#### Property 40: Rider KYC Access Control

*For any* rider, retrieving KYC status SHALL return the rider's own KYC record if it exists, and SHALL NOT return other riders' KYC records.

**Validates: Requirements 8.9**

#### Property 41: KYC Prerequisite for Rider Operations

*For any* rider operation (QR verification, order pickup), the system SHALL allow the operation if and only if the rider has a KYC record with kycStatus = "APPROVED".

**Validates: Requirements 6.3, 6.6**

### Real-time Notification Properties

#### Property 42: Socket.io JWT Authentication

*For any* WebSocket connection attempt, the system SHALL authenticate using the provided JWT token, and SHALL accept the connection if and only if the token is valid and not expired.

**Validates: Requirements 9.1, 9.7**

#### Property 43: Order Created Notification

*For any* order creation, the system SHALL emit an "orderCreated" event to the vendor's user room (identified by vendor's userId) with order details including items, totalAmount, and deliveryAddress.

**Validates: Requirements 4.6, 9.2, 9.6**

#### Property 44: Ready for Pickup Broadcast

*For any* order status transition to "READY_FOR_PICKUP", the system SHALL emit an "orderReadyForPickup" event to all KYC-approved riders with order details including orderId, vendorLocation, deliveryAddress, and qrCode.

**Validates: Requirements 5.2, 9.3, 9.6**

#### Property 45: Order Status Change Notification

*For any* order status transition, the system SHALL emit an "orderStatusChanged" event to the buyer's user room with previousStatus, newStatus, and orderId.

**Validates: Requirements 5.8, 9.4, 9.6**

#### Property 46: Payment Confirmation Notification

*For any* payment status transition to "PAID", the system SHALL emit a "paymentConfirmed" event to the vendor's user room with orderId, amount, and payment reference.

**Validates: Requirements 7.7, 9.5, 9.6**

### Database Seeding Properties

#### Property 47: Seed Idempotency

*For any* execution of the seed command, if seed data already exists in the database, the system SHALL skip seeding, not create duplicate data, and return a message indicating data already exists.

**Validates: Requirements 10.5, 10.6**

### Error Handling Properties

#### Property 48: Invalid Data Error Response

*For any* request with invalid data (validation failures), the system SHALL return HTTP status 400 with a JSON response containing all validation error messages.

**Validates: Requirements 11.1, 11.8**

#### Property 49: Authentication Error Response

*For any* request to a protected endpoint without a valid JWT token, the system SHALL return HTTP status 401 with an authentication error message.

**Validates: Requirements 11.2**

#### Property 50: Authorization Error Response

*For any* request where the authenticated user lacks the required role or resource ownership, the system SHALL return HTTP status 403 with an authorization error message.

**Validates: Requirements 11.3**

#### Property 51: Resource Not Found Response

*For any* request for a non-existent resource (by ID), the system SHALL return HTTP status 404 with a not found message.

**Validates: Requirements 11.4**

#### Property 52: Server Error Response

*For any* unhandled server error during request processing, the system SHALL return HTTP status 500, log the error details with stack trace, and return a generic error message (without exposing internal details).

**Validates: Requirements 11.5**

### JSON Parsing and Serialization Properties

#### Property 53: JSON Parsing Validation

*For any* request with Content-Type "application/json" and a valid JSON body, the system SHALL successfully parse the body into a JavaScript object. For any malformed JSON, the system SHALL return HTTP status 400 with a parsing error message.

**Validates: Requirements 13.1, 13.2**

#### Property 54: JSON Response Serialization

*For any* successful API response, the system SHALL serialize the response object to JSON format and set Content-Type to "application/json".

**Validates: Requirements 13.3**

#### Property 55: JSON Round-trip Preservation

*For any* valid request object sent to the API, parsing the JSON request, processing it, serializing the response to JSON, and parsing the response SHALL produce an object with equivalent data values (accounting for transformations like Date serialization).

**Validates: Requirements 13.4**

#### Property 56: Date Serialization Format

*For any* response object containing Date fields, the serialized JSON SHALL represent dates in ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ).

**Validates: Requirements 13.6**

#### Property 57: Serialization Error Handling

*For any* object that cannot be serialized to JSON, the system SHALL return HTTP status 500 and log the serialization error.

**Validates: Requirements 13.7**


## Error Handling

### Error Response Structure

All errors follow a consistent JSON structure:

```typescript
{
  success: false,
  error: {
    code: string,      // Machine-readable error code
    message: string,   // Human-readable error message
    details?: any      // Optional additional error details (e.g., validation errors)
  }
}
```

### HTTP Status Code Mapping

| Status Code | Error Type | Description | Example |
|-------------|-----------|-------------|---------|
| 400 | Bad Request | Invalid input data, validation failures, malformed JSON | Missing required fields, invalid phone format |
| 401 | Unauthorized | Authentication failure | Invalid JWT token, expired token, missing token |
| 403 | Forbidden | Authorization failure | Wrong role for endpoint, not resource owner |
| 404 | Not Found | Resource does not exist | User ID not found, order not found |
| 409 | Conflict | Resource already exists | Phone number already registered, vendor profile exists |
| 500 | Internal Server Error | Unexpected server error | Database connection failure, uncaught exceptions |
| 503 | Service Unavailable | External service failure | Termii SMS service down, Paystack unavailable |

### Error Categories and Handling

#### 1. Validation Errors (400)

**Triggers**:
- Missing required fields
- Invalid data types
- Format violations (phone number, email)
- Enum value violations
- Business rule violations (negative stock, wrong vendor)

**Handling**:
- Validate at middleware level using Mongoose schemas
- Collect all validation errors before responding
- Return detailed field-level error messages

**Example Response**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "phoneNumber": "Phone number must follow format +234XXXXXXXXXX",
      "role": "Role must be one of: buyer, vendor, rider"
    }
  }
}
```

#### 2. Authentication Errors (401)

**Triggers**:
- Missing Authorization header
- Invalid JWT token signature
- Expired JWT token
- Invalid OTP
- Expired OTP
- Invalid admin token

**Handling**:
- Verify JWT in authentication middleware
- Check token expiration
- Validate OTP against stored values with expiration check
- Log authentication failures for security monitoring

**Example Response**:
```json
{
  "success": false,
  "error": {
    "code": "AUTHENTICATION_FAILED",
    "message": "Invalid or expired authentication token"
  }
}
```

#### 3. Authorization Errors (403)

**Triggers**:
- Wrong role for endpoint (buyer trying to create products)
- Not resource owner (vendor updating another vendor's product)
- KYC not approved (rider attempting pickup)
- Invalid state for operation (canceling delivered order)

**Handling**:
- Check role in authorization middleware
- Verify resource ownership in service layer
- Validate state prerequisites before operations
- Return specific reason for denial

**Example Response**:
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "User with role 'buyer' cannot access this endpoint. Required role: vendor"
  }
}
```

#### 4. Not Found Errors (404)

**Triggers**:
- User ID not found in database
- Product ID not found
- Order ID not found
- Vendor profile not found
- KYC record not found

**Handling**:
- Check for null/undefined after database queries
- Distinguish between "not found" and "not authorized" (return 404 even if resource exists but user can't access it to prevent enumeration)

**Example Response**:
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Order with ID 507f1f77bcf86cd799439011 not found"
  }
}
```

#### 5. Conflict Errors (409)

**Triggers**:
- Duplicate phone number registration
- Duplicate vendor profile creation
- Duplicate KYC submission
- Duplicate QR code (should never happen with UUID)

**Handling**:
- Catch unique constraint violations from database
- Check for existing records before creation
- Return clear message about what already exists

**Example Response**:
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_EXISTS",
    "message": "User with phone number +2348012345678 already exists"
  }
}
```

#### 6. Server Errors (500)

**Triggers**:
- Uncaught exceptions
- Database connection failures
- Serialization failures
- Unexpected null/undefined values

**Handling**:
- Catch all errors in global error handler middleware
- Log full error details with stack trace
- Return generic error message (no internal details exposed)
- Monitor error rates for alerting

**Example Response**:
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred. Please try again later."
  }
}
```

**Logging Format**:
```typescript
{
  timestamp: "2025-01-15T10:30:45.123Z",
  level: "error",
  userId: "507f1f77bcf86cd799439011",
  endpoint: "POST /orders",
  error: {
    message: "Cannot read property 'vendorId' of null",
    stack: "Error: Cannot read property...\n    at OrderService.createOrder..."
  },
  requestId: "req-uuid-12345"
}
```

#### 7. External Service Errors (503)

**Triggers**:
- Termii SMS API timeout or failure
- Paystack API unavailable
- MongoDB connection lost

**Handling**:
- Implement retry logic with exponential backoff (3 retries)
- Circuit breaker pattern for repeated failures
- Return service unavailable with retry suggestion
- Queue critical operations (SMS) for later retry

**Example Response**:
```json
{
  "success": false,
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "SMS service is temporarily unavailable. Please try again in a few minutes."
  }
}
```

### Middleware Error Flow

```
Request → Parsing → Validation → Authentication → Authorization → Controller → Service → Database
    ↓         ↓           ↓              ↓               ↓             ↓          ↓          ↓
  400      400         400            401             403           500        500        500
                                                                                          (DB errors)
    ↓
Global Error Handler
    ↓
Formatted Error Response
```

### Error Handling Best Practices

1. **Fail Fast**: Validate and authenticate early in the request pipeline
2. **Comprehensive Logging**: Log all errors with context (user, endpoint, timestamp)
3. **User-Friendly Messages**: Return clear, actionable error messages
4. **Security**: Don't expose internal implementation details in error messages
5. **Consistency**: Use the same error structure across all endpoints
6. **Monitoring**: Track error rates and patterns for alerting
7. **Idempotency**: Ensure error responses don't cause side effects
8. **Transaction Rollback**: Use database transactions for multi-step operations that can fail


## Testing Strategy

### Overview

The Oja REST API testing strategy employs a dual approach combining **unit tests** for specific examples and edge cases with **property-based tests** for comprehensive validation of universal properties. This ensures both concrete correctness and general behavior verification.

### Testing Approach

#### Unit Testing

**Purpose**: Verify specific examples, edge cases, integration points, and error conditions.

**Focus Areas**:
- Specific example scenarios (e.g., "registering a buyer with +2348012345678 succeeds")
- Edge cases (empty strings, boundary values, null handling)
- Integration between components (controller → service → model)
- Error conditions and error messages
- External service mocking (Termii, Paystack)

**Avoid**: Writing too many unit tests for scenarios that property tests will cover. Property tests handle broad input coverage through randomization.

**Framework**: Jest

**Example Unit Tests**:
```typescript
// Example: Specific authentication flow
describe('Auth Flow', () => {
  it('should register a new buyer successfully', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({
        phoneNumber: '+2348012345678',
        name: 'John Doe',
        role: 'buyer'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });
  
  // Edge case
  it('should reject registration with empty phone number', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({
        phoneNumber: '',
        name: 'John Doe',
        role: 'buyer'
      });
    
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});

// Example: Error handling integration
describe('Error Handling', () => {
  it('should return 401 for requests without auth token', async () => {
    const response = await request(app)
      .get('/vendors/profile');
    
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTHENTICATION_FAILED');
  });
});
```

#### Property-Based Testing

**Purpose**: Verify universal properties across all valid inputs using randomized test data generation.

**Focus Areas**:
- Input validation rules across all possible inputs
- Round-trip properties (create → retrieve → verify)
- State machine transitions
- Authorization rules across all roles
- Data consistency and invariants
- Calculation correctness (order totals, etc.)

**Framework**: fast-check (JavaScript/TypeScript property-based testing library)

**Configuration**: 
- Minimum **100 iterations per property test** (due to randomization)
- Each test references its design document property via comment tag

**Tag Format**:
```typescript
// Feature: oja-rest-api, Property 1: Phone Number Format Validation
```

**Example Property Tests**:

```typescript
import * as fc from 'fast-check';

// Feature: oja-rest-api, Property 1: Phone Number Format Validation
describe('Property 1: Phone Number Format Validation', () => {
  it('accepts valid phone numbers and rejects invalid ones', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.tuple(
          fc.string(), // Generate random strings
          fc.string(),
          fc.constantFrom('buyer', 'vendor', 'rider')
        ),
        async ([phoneNumber, name, role]) => {
          const response = await request(app)
            .post('/auth/register')
            .send({ phoneNumber, name, role });
          
          const isValidFormat = /^\+234\d{10}$/.test(phoneNumber);
          
          if (isValidFormat) {
            // Should accept valid format
            expect([201, 409]).toContain(response.status); // 201 or 409 if already exists
          } else {
            // Should reject invalid format
            expect(response.status).toBe(400);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: oja-rest-api, Property 21: Order Total Calculation
describe('Property 21: Order Total Calculation', () => {
  it('calculates order total as sum of (quantity × price)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            quantity: fc.integer({ min: 1, max: 10 }),
            price: fc.float({ min: 0.01, max: 10000, noNaN: true })
          }),
          { minLength: 1, maxLength: 5 }
        ),
        async (items) => {
          // Setup: Create vendor and products
          const vendor = await createTestVendor();
          const products = await Promise.all(
            items.map(item => createTestProduct(vendor._id, { price: item.price }))
          );
          
          // Create order
          const buyer = await createTestBuyer();
          const orderItems = products.map((product, idx) => ({
            productId: product._id,
            quantity: items[idx].quantity
          }));
          
          const response = await authenticatedRequest(buyer.token)
            .post('/orders')
            .send({
              vendorId: vendor._id,
              items: orderItems,
              deliveryAddress: 'Test Address',
              deliveryPhoneNumber: '+2348012345678'
            });
          
          // Verify total calculation
          const expectedTotal = items.reduce(
            (sum, item) => sum + (item.quantity * item.price),
            0
          );
          
          expect(response.status).toBe(201);
          expect(response.body.order.totalAmount).toBeCloseTo(expectedTotal, 2);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: oja-rest-api, Property 26: Valid State Transitions
describe('Property 26: Valid State Transitions', () => {
  it('enforces order state machine rules', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          'PENDING_ACCEPTANCE',
          'READY_FOR_PICKUP',
          'OUT_FOR_DELIVERY',
          'DELIVERED'
        ),
        fc.constantFrom(
          'PENDING_ACCEPTANCE',
          'READY_FOR_PICKUP',
          'OUT_FOR_DELIVERY',
          'DELIVERED'
        ),
        async (fromState, toState) => {
          // Setup order in fromState
          const order = await createTestOrderInState(fromState);
          
          // Attempt transition to toState
          const response = await attemptStateTransition(order, toState);
          
          // Valid transitions
          const validTransitions = {
            'PENDING_ACCEPTANCE': ['READY_FOR_PICKUP'],
            'READY_FOR_PICKUP': ['OUT_FOR_DELIVERY'],
            'OUT_FOR_DELIVERY': ['DELIVERED'],
            'DELIVERED': []
          };
          
          const isValidTransition = validTransitions[fromState]?.includes(toState);
          
          if (isValidTransition) {
            expect([200, 201]).toContain(response.status);
          } else {
            expect(response.status).toBe(400);
            expect(response.body.error.code).toMatch(/INVALID_STATE/);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: oja-rest-api, Property 55: JSON Round-trip Preservation
describe('Property 55: JSON Round-trip Preservation', () => {
  it('preserves data through JSON serialization round-trip', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          phoneNumber: fc.string({ minLength: 14, maxLength: 14 }).map(s => '+234' + s.slice(4)),
          name: fc.string({ minLength: 1, maxLength: 100 }),
          role: fc.constantFrom('buyer', 'vendor', 'rider')
        }),
        async (userData) => {
          // Register user
          const registerResponse = await request(app)
            .post('/auth/register')
            .send(userData);
          
          if (registerResponse.status === 201) {
            // Retrieve user (through login + profile endpoint)
            const loginResponse = await request(app)
              .post('/auth/login')
              .send({ phoneNumber: userData.phoneNumber });
            
            // Verify round-trip: sent data matches received data
            expect(registerResponse.body.user.phoneNumber).toBe(userData.phoneNumber);
            expect(registerResponse.body.user.name).toBe(userData.name);
            expect(registerResponse.body.user.role).toBe(userData.role);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Test Organization

```
tests/
├── unit/
│   ├── controllers/
│   │   ├── auth.controller.test.ts
│   │   ├── vendor.controller.test.ts
│   │   ├── product.controller.test.ts
│   │   ├── order.controller.test.ts
│   │   ├── payment.controller.test.ts
│   │   └── kyc.controller.test.ts
│   ├── services/
│   │   ├── auth.service.test.ts
│   │   ├── otp.service.test.ts
│   │   ├── payment.service.test.ts
│   │   └── notification.service.test.ts
│   ├── middleware/
│   │   ├── auth.middleware.test.ts
│   │   ├── validation.middleware.test.ts
│   │   └── error.middleware.test.ts
│   └── models/
│       ├── user.model.test.ts
│       ├── order.model.test.ts
│       └── product.model.test.ts
├── property/
│   ├── authentication.property.test.ts  // Properties 1-9
│   ├── validation.property.test.ts      // Properties 10-14
│   ├── crud.property.test.ts            // Properties 15-18
│   ├── orders.property.test.ts          // Properties 19-28
│   ├── availability.property.test.ts    // Properties 29-30
│   ├── qr-verification.property.test.ts // Properties 31-32
│   ├── payment.property.test.ts         // Properties 33-35
│   ├── kyc.property.test.ts             // Properties 36-41
│   ├── notifications.property.test.ts   // Properties 42-46
│   ├── seeding.property.test.ts         // Property 47
│   ├── errors.property.test.ts          // Properties 48-52
│   └── serialization.property.test.ts   // Properties 53-57
├── integration/
│   ├── order-flow.test.ts              // Full order creation → delivery flow
│   ├── payment-flow.test.ts            // Payment initiation → webhook → confirmation
│   ├── kyc-flow.test.ts                // KYC submission → approval → rider operations
│   └── realtime.test.ts                // Socket.io notification flows
└── helpers/
    ├── test-data-generators.ts         // fast-check arbitraries
    ├── test-helpers.ts                 // Setup/teardown, auth helpers
    └── mocks.ts                        // External service mocks
```

### Test Data Generation (for Property Tests)

Using fast-check arbitraries for random data generation:

```typescript
// helpers/test-data-generators.ts

export const arbitraries = {
  phoneNumber: fc.string().map(s => 
    '+234' + Math.floor(Math.random() * 10000000000).toString().padStart(10, '0')
  ),
  
  role: fc.constantFrom('buyer', 'vendor', 'rider'),
  
  vendorCategory: fc.constantFrom(
    'Groceries', 'Food', 'Electronics', 'Fashion', 'Health', 'Services'
  ),
  
  orderStatus: fc.constantFrom(
    'PENDING_ACCEPTANCE', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED'
  ),
  
  paymentStatus: fc.constantFrom('UNPAID', 'PENDING_CONFIRMATION', 'PAID'),
  
  governmentIdType: fc.constantFrom(
    'NIN', 'Drivers_License', 'Voters_Card', 'International_Passport'
  ),
  
  product: fc.record({
    name: fc.string({ minLength: 1, maxLength: 100 }),
    description: fc.string({ minLength: 10, maxLength: 500 }),
    price: fc.float({ min: 0.01, max: 100000, noNaN: true }),
    stockQuantity: fc.integer({ min: 0, max: 1000 }),
    category: fc.string({ minLength: 1, maxLength: 50 }),
    imageUrl: fc.webUrl()
  }),
  
  orderItem: fc.record({
    quantity: fc.integer({ min: 1, max: 100 }),
    price: fc.float({ min: 0.01, max: 10000, noNaN: true })
  })
};
```

### Mocking External Services

```typescript
// helpers/mocks.ts

export const mockTermiiService = {
  sendSms: jest.fn().mockResolvedValue({
    message_id: 'test-message-id',
    message: 'Message sent',
    balance: 1000,
    user: 'test-user'
  })
};

export const mockPaystackService = {
  initializePayment: jest.fn().mockResolvedValue({
    status: true,
    data: {
      authorization_url: 'https://paystack.com/pay/test',
      access_code: 'test-access',
      reference: 'test-ref-' + Date.now()
    }
  }),
  
  generateWebhookSignature: (payload: any, secret: string) => {
    return crypto
      .createHmac('sha512', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
  }
};
```

### Coverage Goals

- **Line Coverage**: Minimum 80%
- **Branch Coverage**: Minimum 75%
- **Property Test Coverage**: 100% of correctness properties (all 57 properties)
- **Unit Test Coverage**: All controllers, services, and middleware
- **Integration Test Coverage**: All critical user flows

### Continuous Integration

```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mongodb:
        image: mongo:6
        ports:
          - 27017:27017
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:unit
      - run: npm run test:property
      - run: npm run test:integration
      - run: npm run test:coverage
```

### Test Commands

```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest tests/unit",
    "test:property": "jest tests/property --testTimeout=60000",
    "test:integration": "jest tests/integration --runInBand",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage --coverageReporters=text --coverageReporters=lcov"
  }
}
```

### Test Database Management

- Use separate test database: `oja_test`
- Reset database before each test suite
- Use transactions for test isolation where possible
- Clean up test data after tests complete

```typescript
// helpers/test-helpers.ts

export async function setupTestDatabase() {
  await mongoose.connect(process.env.MONGODB_TEST_URI);
  await mongoose.connection.dropDatabase();
}

export async function teardownTestDatabase() {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
}

export async function clearCollections() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}
```

### Property-Based Testing Best Practices

1. **Generators**: Create comprehensive generators for all domain objects
2. **Shrinking**: Let fast-check automatically shrink failing cases to minimal examples
3. **Preconditions**: Use `fc.pre()` to filter invalid inputs rather than trying to generate only valid ones
4. **Invariants**: Focus on properties that must always hold, not implementation details
5. **Commutativity**: Test that order of operations doesn't affect results where applicable
6. **Idempotency**: Test that operations produce the same result when repeated
7. **Round-trips**: Always test serialization/deserialization and CRUD round-trips

### Testing Non-Functional Requirements

**Performance Testing**:
- Use Artillery or k6 for load testing
- Test 100 concurrent Socket.io connections
- Measure 95th percentile response times
- Target: < 500ms for authenticated requests

**Security Testing**:
- SQL/NoSQL injection attempts with malicious inputs
- JWT token tampering tests
- Webhook signature forgery attempts
- Rate limiting verification

**Reliability Testing**:
- Simulate MongoDB connection failures
- Simulate Termii/Paystack service outages
- Test automatic reconnection logic
- Verify error logging completeness

