# Stripe Customer Management API Documentation

## Overview

The ORACLE-LEDGER system includes comprehensive Stripe customer management APIs that handle:

- Customer creation and management
- Payment method management
- PCI-compliant audit logging
- Integration with ORACLE-LEDGER accounting system

## API Endpoints

### 1. Create Customer
**POST** `/api/stripe/customers`

Create a new Stripe customer and store in the database.

**Headers:**
- `X-User-ID`: User identifier
- `X-User-Email`: User email
- `Content-Type`: application/json

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "billingAddress": {
    "line1": "123 Main St",
    "city": "Anytown",
    "state": "CA",
    "postal_code": "12345",
    "country": "US"
  },
  "shippingAddress": {
    "line1": "456 Oak Ave",
    "city": "Anytown",
    "state": "CA",
    "postal_code": "12345",
    "country": "US"
  },
  "customerId": 123,
  "stripeMetadata": {
    "source": "api",
    "campaign": "spring_2025"
  }
}
```

**Success Response (201):**
```json
{
  "id": "uuid",
  "stripeCustomerId": "cus_1234567890",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "billingAddress": "{\"line1\":\"123 Main St\",\"city\":\"Anytown\",\"state\":\"CA\",\"postal_code\":\"12345\",\"country\":\"US\"}",
  "shippingAddress": "{\"line1\":\"456 Oak Ave\",\"city\":\"Anytown\",\"state\":\"CA\",\"postal_code\":\"12345\",\"country\":\"US\"}",
  "createdAt": "2025-11-02T22:24:28.000Z",
  "updatedAt": "2025-11-02T22:24:28.000Z",
  "stripeCreatedAt": "2025-11-02T22:24:28.000Z",
  "stripeUpdatedAt": "2025-11-02T22:24:28.000Z",
  "active": true,
  "customerId": 123,
  "stripeMetadata": "{\"source\":\"api\",\"campaign\":\"spring_2025\"}",
  "deletedAt": null
}
```

**Error Responses:**
- `400`: Invalid input data
- `401`: Authentication required
- `409`: Customer with email already exists

### 2. List Customers
**GET** `/api/stripe/customers`

Get a paginated list of customers.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (max: 100, default: 50)
- `search` (optional): Search term for first name, last name, or email
- `active` (optional): Filter by active status (true/false)

**Success Response (200):**
```json
{
  "customers": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "totalPages": 2
  }
}
```

### 3. Get Customer Details
**GET** `/api/stripe/customers/:id`

Get detailed customer information including payment methods.

**Success Response (200):**
```json
{
  "id": "uuid",
  "stripeCustomerId": "cus_1234567890",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "stripeDefaultPaymentMethodId": "pm_1234567890",
  "billingAddress": "{\"line1\":\"123 Main St\",\"city\":\"Anytown\",\"state\":\"CA\"}",
  "shippingAddress": "{\"line1\":\"456 Oak Ave\",\"city\":\"Anytown\",\"state\":\"CA\"}",
  "createdAt": "2025-11-02T22:24:28.000Z",
  "updatedAt": "2025-11-02T22:24:28.000Z",
  "stripeCreatedAt": "2025-11-02T22:24:28.000Z",
  "stripeUpdatedAt": "2025-11-02T22:24:28.000Z",
  "active": true,
  "customerId": 123,
  "stripeMetadata": "{\"source\":\"api\",\"campaign\":\"spring_2025\"}",
  "deletedAt": null,
  "paymentMethods": [...]
}
```

### 4. Update Customer
**PUT** `/api/stripe/customers/:id`

Update customer information.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe Updated",
  "email": "john.updated@example.com",
  "phone": "+1987654321",
  "billingAddress": {
    "line1": "789 New St",
    "city": "New City",
    "state": "NY",
    "postal_code": "10001",
    "country": "US"
  },
  "stripeMetadata": {
    "updated_by": "api",
    "campaign": "updated_spring_2025"
  }
}
```

**Success Response (200):**
Returns the updated customer object.

### 5. Soft Delete Customer
**DELETE** `/api/stripe/customers/:id`

Soft delete a customer (marks as inactive and sets deleted timestamp).

**Success Response (200):**
```json
{
  "message": "Customer soft deleted successfully",
  "customer": {
    "id": "uuid",
    "active": false,
    "deletedAt": "2025-11-02T22:24:28.000Z",
    ...
  }
}
```

### 6. Add Payment Method
**POST** `/api/stripe/customers/:id/payment-methods`

Add a payment method to a customer.

**Request Body:**
```json
{
  "stripePaymentMethodId": "pm_1234567890",
  "type": "card",
  "verificationStatus": "verified",
  "stripeMetadata": {
    "source": "stripe_element"
  },
  "setupIntentId": "seti_1234567890",
  "isDefault": true
}
```

**Supported Payment Method Types:**
- `card`: Credit/debit cards
- `us_bank_account`: ACH bank accounts
- `sepa_debit`: SEPA bank accounts (EU)

**Success Response (201):**
```json
{
  "id": "uuid",
  "customerId": "customer-uuid",
  "stripePaymentMethodId": "pm_1234567890",
  "type": "card",
  "cardLast4": "4242",
  "cardBrand": "visa",
  "cardExpMonth": 12,
  "cardExpYear": 2025,
  "status": "active",
  "isDefault": true,
  "createdAt": "2025-11-02T22:24:28.000Z",
  "verifiedAt": "2025-11-02T22:24:28.000Z",
  "verificationStatus": "verified",
  "stripeMetadata": "{\"source\":\"stripe_element\"}",
  "setupIntentId": "seti_1234567890",
  "updatedBy": "test-user-123",
  "deletedAt": null
}
```

### 7. List Payment Methods
**GET** `/api/stripe/customers/:id/payment-methods`

Get all payment methods for a customer.

**Success Response (200):**
```json
{
  "paymentMethods": [...]
}
```

### 8. Set Default Payment Method
**POST** `/api/stripe/customers/:id/payment-methods/:methodId/default`

Set a payment method as the default for the customer.

**Success Response (200):**
Returns the updated payment method object with `isDefault: true`.

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message describing what went wrong"
}
```

**Common HTTP Status Codes:**
- `200`: Success
- `201`: Created successfully
- `400`: Bad request (invalid input)
- `401`: Authentication required
- `404`: Resource not found
- `409`: Conflict (e.g., duplicate email)
- `500`: Internal server error

## PCI Compliance

All endpoints include PCI-compliant audit logging via the `pci_audit_log` table. The following actions are logged:

- `create_customer`: Customer creation
- `view_customer_details`: Customer details access
- `update_customer`: Customer updates
- `soft_delete_customer`: Customer deletion
- `add_payment_method`: Payment method addition
- `view_payment_methods`: Payment methods access
- `set_default_payment_method`: Default payment method changes

Audit logs include:
- User information (ID, email)
- IP address and user agent
- Sensitive fields accessed
- Before/after values
- Timestamps

## Security Features

### Authentication
- All endpoints require authentication via headers:
  - `X-User-ID`: User identifier
  - `X-User-Email`: User email
- In production, replace with JWT token validation

### Input Validation
- Email format validation
- Phone number format validation
- Required field validation
- Payment method type validation

### Data Sanitization
- Input data is sanitized before processing
- JSON fields are properly stringified
- SQL injection protection via parameterized queries

## Database Schema

### Customers Table
```sql
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_customer_id VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    stripe_default_payment_method_id VARCHAR(255),
    billing_address JSONB,
    shipping_address JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    stripe_created_at TIMESTAMP WITH TIME ZONE,
    stripe_updated_at TIMESTAMP WITH TIME ZONE,
    active BOOLEAN DEFAULT true,
    customer_id INTEGER,
    stripe_metadata JSONB,
    deleted_at TIMESTAMP WITH TIME ZONE
);
```

### Payment Methods Table
```sql
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    stripe_payment_method_id VARCHAR(255) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL,
    card_last4 VARCHAR(4),
    card_brand VARCHAR(50),
    card_exp_month INTEGER,
    card_exp_year INTEGER,
    bank_name VARCHAR(255),
    bank_account_last4 VARCHAR(4),
    bank_account_routing_number VARCHAR(9),
    bank_account_type VARCHAR(20),
    status VARCHAR(50) DEFAULT 'active',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE,
    verification_status VARCHAR(50),
    stripe_metadata JSONB,
    setup_intent_id VARCHAR(255),
    updated_by UUID,
    deleted_at TIMESTAMP WITH TIME ZONE
);
```

## Environment Variables

Required environment variables:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...  # Your Stripe secret key
API_PORT=3001                  # API server port

# Database Configuration
DATABASE_URL=postgresql://...   # Database connection string
```

## Testing

Run the test script:

```bash
node test-stripe-api.js
```

This will test all endpoints with sample data.

## Integration Notes

### Stripe Integration
- Uses Stripe SDK v2024-06-20
- Automatically creates customers in Stripe
- Syncs payment methods from Stripe
- Maintains audit trail in both systems

### ORACLE-LEDGER Integration
- Links customers to `customer_id` in accounting system
- Enables payment processing for invoices
- Supports ACH and direct deposit workflows

### Best Practices
1. Always validate input data before processing
2. Use soft deletes to maintain audit trails
3. Implement proper authentication in production
4. Monitor PCI audit logs for compliance
5. Handle Stripe API rate limits appropriately
6. Use idempotency keys for payment operations

## Support

For issues or questions:
1. Check PCI audit logs for access tracking
2. Review application logs for error details
3. Validate Stripe API key and permissions
4. Ensure database schema is up to date
