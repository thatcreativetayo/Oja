# Requirements Document

## Introduction

Oja is a hyperlocal 3-sided marketplace REST API for Redemption City, Nigeria. The API enables buyers to purchase products from local vendors and have them delivered by verified riders. The system supports phone-based OTP authentication, real-time order tracking, payment processing via Paystack, and rider KYC verification workflows.

## Glossary

- **Oja_API**: The REST API system for the Oja marketplace
- **User**: An authenticated individual with one role: buyer, vendor, or rider
- **Buyer**: A User who purchases products from vendors
- **Vendor**: A User who operates a shop and sells products
- **Rider**: A User who delivers orders after KYC verification
- **OTP_Service**: The Termii SMS integration component for sending one-time passwords
- **Payment_Gateway**: The Paystack integration component for payment processing
- **Order**: A transaction containing products from a single vendor with delivery information
- **Product**: An item offered for sale by a vendor with stock quantity
- **Vendor_Profile**: The shop information associated with a vendor
- **Rider_KYC**: The know-your-customer verification record for a rider
- **KYC_Admin**: An administrator who approves or rejects rider KYC submissions
- **Order_Status**: The current stage of an order: PENDING_ACCEPTANCE, READY_FOR_PICKUP, OUT_FOR_DELIVERY, or DELIVERED
- **Payment_Status**: The current payment state: UNPAID, PENDING_CONFIRMATION, or PAID
- **Operational_Status**: Whether a vendor shop is currently OPEN or CLOSED
- **QR_Code**: A unique verification code for rider pickup confirmation
- **Webhook**: An HTTP callback from external services to notify payment events
- **JWT_Token**: A JSON Web Token used for authenticating API requests
- **Admin_Token**: A secret token required for administrative operations

## Requirements

### Requirement 1: User Registration and Authentication

**User Story:** As a new user, I want to register with my phone number and authenticate using OTP, so that I can securely access the marketplace.

#### Acceptance Criteria

1. WHEN a registration request is received with phoneNumber, name, and role, THE Oja_API SHALL create a new User account
2. THE Oja_API SHALL validate that phoneNumber follows the format "+234XXXXXXXXXX" where X is a digit
3. THE Oja_API SHALL validate that role is one of "buyer", "vendor", or "rider"
4. WHEN a login request is received with a valid phoneNumber, THE OTP_Service SHALL send a 6-digit OTP via SMS to that phone number
5. THE Oja_API SHALL store the OTP with a 10-minute expiration time
6. WHEN an OTP verification request is received within 10 minutes, THE Oja_API SHALL validate the OTP against the stored value
7. WHEN OTP verification succeeds, THE Oja_API SHALL return a JWT_Token valid for 7 days
8. IF an OTP is expired or invalid, THEN THE Oja_API SHALL return an authentication error
9. THE Oja_API SHALL accept JWT_Token in the Authorization header as "Bearer {token}" for authenticated requests

### Requirement 2: Vendor Profile Management

**User Story:** As a vendor, I want to manage my shop profile and operational status, so that buyers know when I'm available and what I sell.

#### Acceptance Criteria

1. WHEN a User with role "vendor" creates a profile, THE Oja_API SHALL create a Vendor_Profile with shopName, category, landmark, and opening hours
2. THE Oja_API SHALL validate that category is one of: "Groceries", "Food", "Electronics", "Fashion", "Health", or "Services"
3. THE Oja_API SHALL initialize Operational_Status as "CLOSED" for new vendor profiles
4. WHEN a Vendor updates operational status, THE Oja_API SHALL change Operational_Status to the requested value ("OPEN" or "CLOSED")
5. WHEN a Vendor retrieves their profile, THE Oja_API SHALL return all Vendor_Profile fields including Operational_Status
6. THE Oja_API SHALL allow only the owning Vendor to update their Vendor_Profile
7. WHEN a Buyer searches for vendors, THE Oja_API SHALL return only vendors with Operational_Status "OPEN"

### Requirement 3: Product Management

**User Story:** As a vendor, I want to manage my product catalog with stock tracking, so that buyers can see what I have available.

#### Acceptance Criteria

1. WHEN a Vendor creates a Product, THE Oja_API SHALL store name, description, price, stockQuantity, category, and imageUrl linked to the Vendor_Profile
2. THE Oja_API SHALL validate that price is a positive number
3. THE Oja_API SHALL validate that stockQuantity is a non-negative integer
4. WHEN a Vendor updates a Product, THE Oja_API SHALL modify only the fields provided in the request
5. WHEN a Vendor deletes a Product, THE Oja_API SHALL remove it from the catalog
6. THE Oja_API SHALL allow only the owning Vendor to modify or delete their Products
7. WHEN a Buyer retrieves products, THE Oja_API SHALL return only Products with stockQuantity greater than 0
8. WHEN an Order is placed, THE Oja_API SHALL decrement stockQuantity by the ordered quantity for each Product
9. IF stockQuantity would become negative after an order, THEN THE Oja_API SHALL reject the order with an insufficient stock error

### Requirement 4: Order Creation and Management

**User Story:** As a buyer, I want to create orders from a vendor's products, so that I can purchase items for delivery.

#### Acceptance Criteria

1. WHEN a Buyer creates an Order, THE Oja_API SHALL validate that all Products belong to the same Vendor
2. WHEN a Buyer creates an Order, THE Oja_API SHALL validate that deliveryAddress and deliveryPhoneNumber are provided
3. THE Oja_API SHALL initialize Order_Status as "PENDING_ACCEPTANCE" and Payment_Status as "UNPAID"
4. THE Oja_API SHALL calculate totalAmount as the sum of (quantity × price) for all items
5. THE Oja_API SHALL generate a unique QR_Code for each Order
6. WHEN an Order is created, THE Oja_API SHALL emit a real-time notification to the Vendor via Socket.io
7. WHEN a Buyer retrieves their orders, THE Oja_API SHALL return all Orders where the Buyer is the creator
8. WHEN a Vendor retrieves their orders, THE Oja_API SHALL return all Orders containing their Products
9. THE Oja_API SHALL allow cancellation only when Order_Status is "PENDING_ACCEPTANCE"

### Requirement 5: Order Status Workflow

**User Story:** As a vendor and rider, I want to update order status through defined stages, so that all parties can track order progress.

#### Acceptance Criteria

1. WHEN a Vendor accepts an order, THE Oja_API SHALL transition Order_Status from "PENDING_ACCEPTANCE" to "READY_FOR_PICKUP"
2. WHEN Order_Status transitions to "READY_FOR_PICKUP", THE Oja_API SHALL emit a real-time notification to available Riders via Socket.io
3. IF Order_Status is not "PENDING_ACCEPTANCE", THEN THE Oja_API SHALL reject vendor acceptance requests
4. WHEN a KYC-verified Rider picks up an order, THE Oja_API SHALL transition Order_Status from "READY_FOR_PICKUP" to "OUT_FOR_DELIVERY"
5. THE Oja_API SHALL assign the Rider to the Order when Order_Status transitions to "OUT_FOR_DELIVERY"
6. WHEN a Rider marks an order as delivered, THE Oja_API SHALL transition Order_Status from "OUT_FOR_DELIVERY" to "DELIVERED"
7. IF Order_Status is not the expected previous state, THEN THE Oja_API SHALL reject status transition requests
8. WHEN Order_Status changes, THE Oja_API SHALL emit real-time notifications to the Buyer via Socket.io

### Requirement 6: Rider QR Code Verification

**User Story:** As a rider, I want to verify the pickup QR code, so that I can confirm I'm collecting the correct order.

#### Acceptance Criteria

1. WHEN a Rider scans a QR_Code, THE Oja_API SHALL validate that the QR_Code matches an existing Order
2. THE Oja_API SHALL validate that Order_Status is "READY_FOR_PICKUP" before allowing QR_Code verification
3. THE Oja_API SHALL validate that the requesting Rider has KYC_Status "APPROVED"
4. WHEN QR_Code verification succeeds, THE Oja_API SHALL return Order details including vendor location and delivery address
5. IF QR_Code is invalid or Order_Status is incorrect, THEN THE Oja_API SHALL return a verification error
6. IF Rider KYC_Status is not "APPROVED", THEN THE Oja_API SHALL reject the verification request

### Requirement 7: Payment Integration

**User Story:** As a buyer, I want to pay for orders via Paystack, so that transactions are secure and verified.

#### Acceptance Criteria

1. WHEN a Buyer initiates payment, THE Payment_Gateway SHALL generate a Paystack payment link with Order totalAmount
2. THE Oja_API SHALL store the Paystack reference linked to the Order
3. WHEN Payment_Gateway sends a webhook notification, THE Oja_API SHALL verify the signature using HMAC SHA512
4. WHEN a payment webhook is verified with status "success", THE Oja_API SHALL transition Payment_Status from "UNPAID" to "PAID"
5. IF webhook signature verification fails, THEN THE Oja_API SHALL reject the webhook and log the security event
6. THE Oja_API SHALL allow Order status progression only when Payment_Status is "PAID"
7. WHEN payment is confirmed, THE Oja_API SHALL emit a real-time notification to the Vendor via Socket.io

### Requirement 8: Rider KYC System

**User Story:** As a rider, I want to submit KYC documentation for verification, so that I can deliver orders.

#### Acceptance Criteria

1. WHEN a User with role "rider" submits KYC, THE Oja_API SHALL create a Rider_KYC record with governmentIdType, governmentIdNumber, governmentIdImage, guarantorName, guarantorPhone, and guarantorAddress
2. THE Oja_API SHALL validate that governmentIdType is one of: "NIN", "Drivers_License", "Voters_Card", or "International_Passport"
3. THE Oja_API SHALL initialize kycStatus as "PENDING" for new submissions
4. THE Oja_API SHALL allow only one Rider_KYC submission per Rider
5. WHEN a KYC_Admin approves KYC, THE Oja_API SHALL transition kycStatus from "PENDING" to "APPROVED"
6. WHEN a KYC_Admin rejects KYC with a reason, THE Oja_API SHALL transition kycStatus to "REJECTED" and store the rejection reason
7. THE Oja_API SHALL validate Admin_Token for all KYC approval and rejection endpoints
8. IF Admin_Token is invalid, THEN THE Oja_API SHALL return an unauthorized error
9. THE Oja_API SHALL allow Riders to view their own Rider_KYC status

### Requirement 9: Real-time Order Updates

**User Story:** As a buyer, vendor, and rider, I want to receive real-time notifications about order changes, so that I can respond quickly.

#### Acceptance Criteria

1. WHEN a User connects to the Socket.io server, THE Oja_API SHALL authenticate the connection using JWT_Token
2. THE Oja_API SHALL emit "orderCreated" events to Vendors when a new Order contains their Products
3. THE Oja_API SHALL emit "orderReadyForPickup" events to all KYC-approved Riders when Order_Status transitions to "READY_FOR_PICKUP"
4. THE Oja_API SHALL emit "orderStatusChanged" events to Buyers when their Order_Status changes
5. THE Oja_API SHALL emit "paymentConfirmed" events to Vendors when Payment_Status transitions to "PAID"
6. THE Oja_API SHALL include Order details in all emitted events
7. IF Socket.io authentication fails, THEN THE Oja_API SHALL reject the connection

### Requirement 10: Database Seeding

**User Story:** As a developer, I want to seed initial vendor and product data, so that the system has test data for development.

#### Acceptance Criteria

1. WHEN the seed command is executed, THE Oja_API SHALL create sample Vendors with complete Vendor_Profiles
2. WHEN the seed command is executed, THE Oja_API SHALL create sample Products linked to the seeded Vendors
3. THE Oja_API SHALL ensure seeded data includes diverse categories for both Vendors and Products
4. THE Oja_API SHALL set realistic stockQuantity values for seeded Products
5. THE Oja_API SHALL prevent duplicate seeding by checking for existing seed data
6. IF seed data already exists, THEN THE Oja_API SHALL skip seeding and return a message indicating data already exists

### Requirement 11: Error Handling and Validation

**User Story:** As an API consumer, I want clear error messages and validation feedback, so that I can correct my requests.

#### Acceptance Criteria

1. WHEN a request contains invalid data, THE Oja_API SHALL return HTTP status 400 with a descriptive error message
2. WHEN authentication fails, THE Oja_API SHALL return HTTP status 401 with an authentication error message
3. WHEN authorization fails, THE Oja_API SHALL return HTTP status 403 with an authorization error message
4. WHEN a requested resource is not found, THE Oja_API SHALL return HTTP status 404 with a not found message
5. WHEN a server error occurs, THE Oja_API SHALL return HTTP status 500 and log the error details
6. THE Oja_API SHALL validate all required fields before processing requests
7. THE Oja_API SHALL validate data types and formats according to the schema definitions
8. WHEN validation fails, THE Oja_API SHALL return all validation errors in the response

### Requirement 12: Role-Based Access Control

**User Story:** As a system administrator, I want role-based access control enforced, so that users can only perform actions appropriate to their role.

#### Acceptance Criteria

1. THE Oja_API SHALL allow only Users with role "vendor" to create and manage Vendor_Profiles
2. THE Oja_API SHALL allow only Users with role "vendor" to create, update, and delete Products
3. THE Oja_API SHALL allow only Users with role "buyer" to create Orders
4. THE Oja_API SHALL allow only Users with role "rider" to submit Rider_KYC and pick up Orders
5. THE Oja_API SHALL allow only Users with role "vendor" to accept Orders containing their Products
6. THE Oja_API SHALL extract role from JWT_Token for authorization decisions
7. IF a User attempts an action not permitted for their role, THEN THE Oja_API SHALL return HTTP status 403

### Requirement 13: Data Parsing and Serialization

**User Story:** As a developer, I want reliable JSON parsing and serialization, so that API data exchange is consistent and error-free.

#### Acceptance Criteria

1. WHEN a request is received with Content-Type "application/json", THE Oja_API SHALL parse the request body into a JavaScript object
2. WHEN parsing fails, THE Oja_API SHALL return HTTP status 400 with a JSON parsing error message
3. THE Oja_API SHALL serialize all response objects to JSON format with Content-Type "application/json"
4. FOR ALL valid request objects, parsing the request then serializing then parsing SHALL produce an equivalent object (round-trip property)
5. THE Oja_API SHALL handle special characters and Unicode in JSON strings without corruption
6. THE Oja_API SHALL serialize Date objects to ISO 8601 format in JSON responses
7. WHEN serialization fails, THE Oja_API SHALL return HTTP status 500 and log the serialization error

## Non-Functional Requirements

### Performance

1. THE Oja_API SHALL respond to health check requests within 100ms under normal load
2. THE Oja_API SHALL process authenticated API requests within 500ms at the 95th percentile
3. THE Oja_API SHALL support at least 100 concurrent Socket.io connections

### Security

1. THE Oja_API SHALL store passwords using bcrypt with a minimum cost factor of 10
2. THE Oja_API SHALL validate JWT_Token signature for all authenticated endpoints
3. THE Oja_API SHALL use HTTPS for all production deployments
4. THE Oja_API SHALL sanitize user inputs to prevent NoSQL injection attacks

### Reliability

1. THE Oja_API SHALL implement connection pooling for MongoDB with automatic reconnection
2. THE Oja_API SHALL log all errors with timestamp, user context, and stack trace
3. WHEN an external service is unavailable, THE Oja_API SHALL return a service unavailable error

### Maintainability

1. THE Oja_API SHALL use TypeScript strict mode for type safety
2. THE Oja_API SHALL organize code into modules: routes, controllers, services, models, and middleware
3. THE Oja_API SHALL include API documentation using OpenAPI/Swagger specification
