# ORACLE-LEDGER Stripe Integration - API Integration Guide

## 📋 Table of Contents

1. [API Overview](#api-overview)
2. [Authentication](#authentication)
3. [Customer Management API](#customer-management-api)
4. [Payment Processing API](#payment-processing-api)
5. [ACH Payments API](#ach-payments-api)
6. [Direct Deposit API](#direct-deposit-api)
7. [Webhook Integration](#webhook-integration)
8. [Error Handling](#error-handling)
9. [Rate Limiting](#rate-limiting)
10. [SDK and Library Examples](#sdk-and-library-examples)
11. [Best Practices](#best-practices)
12. [Testing and Sandbox](#testing-and-sandbox)

---

## API Overview

### Base URL and Versioning

**Production Base URL:** `https://api.yourdomain.com`  
**Development Base URL:** `http://localhost:3001`  
**API Version:** `v1`

All API endpoints follow RESTful conventions and return JSON responses. The API is designed to be backward compatible within major versions.

### Content Type and Headers

All API requests must include the following headers:

```http
Content-Type: application/json
Accept: application/json
X-Client-Version: 1.0.0
X-Request-ID: unique-request-identifier
```

### Response Format

All API responses follow a consistent format:

**Success Response:**
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "timestamp": "2025-11-02T23:37:26.000Z",
  "requestId": "req_1234567890"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      // Additional error details
    }
  },
  "timestamp": "2025-11-02T23:37:26.000Z",
  "requestId": "req_1234567890"
}
```

---

## Authentication

### Current Implementation (Development)

For development, the API uses header-based authentication:

```http
X-User-ID: uuid-string
X-User-Email: user@example.com
X-User-Role: user|admin|compliance_officer|auditor
```

### Production Authentication (JWT)

In production environments, implement JWT token authentication:

```javascript
// Obtain JWT token
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password"
}

// Response
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "admin"
    }
  }
}
```

### API Key Authentication (Alternative)

For service-to-service authentication:

```http
X-API-Key: your_api_key_here
X-Organization-ID: your_org_id
```

### Role-Based Access Control

| Role | Permissions |
|------|-------------|
| `user` | Basic read/write access to own data |
| `admin` | Full system access |
| `compliance_officer` | Access to audit logs and compliance data |
| `auditor` | Read-only access to all data |
| `accountant` | Access to financial operations |
| `finance_manager` | Access to payments and reconciliation |

---

## Customer Management API

### Create Customer

Create a new Stripe customer with ORACLE-LEDGER integration.

**Endpoint:** `POST /api/v1/customers`

**Request Headers:**
```http
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "billingAddress": {
    "line1": "123 Main Street",
    "line2": "Suite 100",
    "city": "San Francisco",
    "state": "CA",
    "postalCode": "94105",
    "country": "US"
  },
  "shippingAddress": {
    "line1": "456 Oak Avenue",
    "line2": "",
    "city": "Los Angeles",
    "state": "CA",
    "postalCode": "90210",
    "country": "US"
  },
  "customerId": 12345,
  "metadata": {
    "source": "website",
    "campaign": "spring_2025",
    "sales_rep": "john_smith"
  },
  "paymentMethods": [
    {
      "type": "card",
      "token": "tok_visa",
      "isDefault": true
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "cust_1234567890",
    "stripeCustomerId": "cus_ABC123DEF456",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "billingAddress": {
      "line1": "123 Main Street",
      "line2": "Suite 100",
      "city": "San Francisco",
      "state": "CA",
      "postalCode": "94105",
      "country": "US"
    },
    "shippingAddress": {
      "line1": "456 Oak Avenue",
      "city": "Los Angeles",
      "state": "CA",
      "postalCode": "90210",
      "country": "US"
    },
    "customerId": 12345,
    "metadata": {
      "source": "website",
      "campaign": "spring_2025",
      "sales_rep": "john_smith"
    },
    "defaultPaymentMethod": {
      "id": "pm_1234567890",
      "type": "card",
      "brand": "visa",
      "last4": "4242",
      "expMonth": 12,
      "expYear": 2025
    },
    "createdAt": "2025-11-02T23:37:26.000Z",
    "updatedAt": "2025-11-02T23:37:26.000Z",
    "active": true
  }
}
```

### Retrieve Customer

**Endpoint:** `GET /api/v1/customers/{customerId}`

**Path Parameters:**
- `customerId` (string, required): The customer ID or UUID

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "cust_1234567890",
    "stripeCustomerId": "cus_ABC123DEF456",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "billingAddress": { /* ... */ },
    "shippingAddress": { /* ... */ },
    "customerId": 12345,
    "metadata": { /* ... */ },
    "paymentMethods": [
      {
        "id": "pm_1234567890",
        "type": "card",
        "brand": "visa",
        "last4": "4242",
        "expMonth": 12,
        "expYear": 2025,
        "isDefault": true,
        "status": "active",
        "createdAt": "2025-11-02T23:37:26.000Z"
      }
    ],
    "statistics": {
      "totalPayments": 15,
      "totalAmountCents": 157500,
      "averagePaymentCents": 10500,
      "lastPaymentDate": "2025-10-15T14:30:00.000Z"
    },
    "createdAt": "2025-11-02T23:37:26.000Z",
    "updatedAt": "2025-11-02T23:37:26.000Z",
    "active": true
  }
}
```

### Update Customer

**Endpoint:** `PUT /api/v1/customers/{customerId}`

**Request Body:** (all fields optional)
```json
{
  "firstName": "Johnathan",
  "lastName": "Doe",
  "email": "johnathan.doe@example.com",
  "phone": "+1987654321",
  "billingAddress": {
    "line1": "789 New Street",
    "city": "San Francisco",
    "state": "CA",
    "postalCode": "94102",
    "country": "US"
  },
  "metadata": {
    "campaign": "updated_spring_2025",
    "vip_status": "gold"
  }
}
```

### List Customers

**Endpoint:** `GET /api/v1/customers`

**Query Parameters:**
- `page` (integer, optional): Page number (default: 1)
- `limit` (integer, optional): Items per page (default: 50, max: 100)
- `search` (string, optional): Search by name or email
- `status` (string, optional): Filter by status (`active`, `inactive`, `all`)
- `createdAfter` (string, optional): ISO 8601 date
- `createdBefore` (string, optional): ISO 8601 date

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "customers": [
      {
        "id": "cust_1234567890",
        "stripeCustomerId": "cus_ABC123DEF456",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com",
        "customerId": 12345,
        "defaultPaymentMethod": {
          "brand": "visa",
          "last4": "4242"
        },
        "statistics": {
          "totalPayments": 15,
          "totalAmountCents": 157500
        },
        "createdAt": "2025-11-02T23:37:26.000Z",
        "active": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 150,
      "totalPages": 3,
      "hasNext": true,
      "hasPrevious": false
    }
  }
}
```

### Delete Customer

**Endpoint:** `DELETE /api/v1/customers/{customerId}`

**Note:** This performs a soft delete, marking the customer as inactive.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Customer deleted successfully",
    "customer": {
      "id": "cust_1234567890",
      "active": false,
      "deletedAt": "2025-11-02T23:37:26.000Z"
    }
  }
}
```

---

## Payment Processing API

### Create Payment

Process a payment using a customer's default or specified payment method.

**Endpoint:** `POST /api/v1/payments`

**Request Body:**
```json
{
  "customerId": "cust_1234567890",
  "amount": 2599,
  "currency": "usd",
  "description": "Invoice #12345 - Professional Services",
  "paymentMethodId": "pm_1234567890",
  "confirm": true,
  "metadata": {
    "invoiceId": "inv_12345",
    "service": "consulting",
    "hours": 10
  },
  "statementDescriptor": "PROF SERVICES",
  "receiptEmail": "customer@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "pi_1234567890",
    "object": "payment_intent",
    "amount": 2599,
    "currency": "usd",
    "status": "succeeded",
    "customer": "cust_1234567890",
    "paymentMethod": "pm_1234567890",
    "description": "Invoice #12345 - Professional Services",
    "charges": {
      "data": [
        {
          "id": "ch_1234567890",
          "amount": 2599,
          "currency": "usd",
          "status": "succeeded",
          "receiptUrl": "https://pay.stripe.com/receipts/..."
        }
      ]
    },
    "createdAt": "2025-11-02T23:37:26.000Z"
  }
}
```

### Retrieve Payment

**Endpoint:** `GET /api/v1/payments/{paymentId}`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "pi_1234567890",
    "object": "payment_intent",
    "amount": 2599,
    "currency": "usd",
    "status": "succeeded",
    "customer": "cust_1234567890",
    "paymentMethod": "pm_1234567890",
    "description": "Invoice #12345 - Professional Services",
    "charges": {
      "data": [
        {
          "id": "ch_1234567890",
          "amount": 2599,
          "currency": "usd",
          "status": "succeeded",
          "receiptUrl": "https://pay.stripe.com/receipts/...",
          "billingDetails": {
            "name": "John Doe",
            "email": "john.doe@example.com"
          }
        }
      ]
    },
    "fees": {
      "applicationFeeAmount": 0,
      "stripeFeeAmount": 104,
      "netAmount": 2495
    },
    "transfer": null,
    "createdAt": "2025-11-02T23:37:26.000Z",
    "updatedAt": "2025-11-02T23:37:26.000Z"
  }
}
```

### List Payments

**Endpoint:** `GET /api/v1/payments`

**Query Parameters:**
- `customer` (string, optional): Filter by customer ID
- `status` (string, optional): Filter by status (`processing`, `succeeded`, `canceled`)
- `created` (object, optional): Date range filter
  - `gte`: Greater than or equal to
  - `lte`: Less than or equal to
- `limit` (integer, optional): Number of results (default: 10, max: 100)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "id": "pi_1234567890",
        "amount": 2599,
        "currency": "usd",
        "status": "succeeded",
        "customer": "cust_1234567890",
        "description": "Invoice #12345 - Professional Services",
        "createdAt": "2025-11-02T23:37:26.000Z"
      }
    ],
    "hasMore": false
  }
}
```

### Refund Payment

**Endpoint:** `POST /api/v1/payments/{paymentId}/refund`

**Request Body:**
```json
{
  "amount": 500,
  "reason": "requested_by_customer",
  "metadata": {
    "refundReason": "service_not_satisfied"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "re_1234567890",
    "object": "refund",
    "amount": 500,
    "currency": "usd",
    "status": "pending",
    "paymentIntent": "pi_1234567890",
    "charge": "ch_1234567890",
    "reason": "requested_by_customer",
    "createdAt": "2025-11-02T23:37:26.000Z"
  }
}
```

---

## ACH Payments API

### Create ACH Payment

Process an ACH payment for invoice payment or recurring billing.

**Endpoint:** `POST /api/v1/ach-payments`

**Request Body:**
```json
{
  "customerId": "cust_1234567890",
  "paymentMethodId": "pm_1234567890",
  "amount": 10000,
  "currency": "usd",
  "description": "Monthly subscription - November 2025",
  "achClassCode": "PPD",
  "scheduledDate": "2025-11-05",
  "metadata": {
    "invoiceId": "inv_67890",
    "subscriptionId": "sub_12345",
    "billingPeriod": "2025-11"
  },
  "statementDescriptor": "MONTHLY SUB",
  "applicationFee": 0
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "pi_ach_1234567890",
    "object": "payment_intent",
    "amount": 10000,
    "currency": "usd",
    "status": "processing",
    "customer": "cust_1234567890",
    "paymentMethod": "pm_1234567890",
    "achDetails": {
      "classCode": "PPD",
      "companyName": "Your Company Name",
      "companyIdentification": "123456789",
      "scheduledDate": "2025-11-05",
      "estimatedSettlementDate": "2025-11-08"
    },
    "nextAction": null,
    "createdAt": "2025-11-02T23:37:26.000Z"
  }
}
```

### Retrieve ACH Payment

**Endpoint:** `GET /api/v1/ach-payments/{paymentId}`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "pi_ach_1234567890",
    "object": "payment_intent",
    "amount": 10000,
    "currency": "usd",
    "status": "succeeded",
    "customer": "cust_1234567890",
    "paymentMethod": "pm_1234567890",
    "achDetails": {
      "classCode": "PPD",
      "companyName": "Your Company Name",
      "companyIdentification": "123456789",
      "scheduledDate": "2025-11-05",
      "processedDate": "2025-11-05T10:30:00.000Z",
      "estimatedSettlementDate": "2025-11-08",
      "actualSettlementDate": "2025-11-08T14:15:00.000Z"
    },
    "bankAccount": {
      "bankName": "Bank of America",
      "last4": "6789",
      "accountType": "checking"
    },
    "returnCode": null,
    "returnReason": null,
    "createdAt": "2025-11-02T23:37:26.000Z",
    "updatedAt": "2025-11-08T14:15:00.000Z"
  }
}
```

### List ACH Payments

**Endpoint:** `GET /api/v1/ach-payments`

**Query Parameters:**
- `customer` (string, optional): Filter by customer ID
- `status` (string, optional): Filter by status (`processing`, `succeeded`, `failed`, `canceled`)
- `scheduledDate` (string, optional): Filter by scheduled date (YYYY-MM-DD)
- `limit` (integer, optional): Number of results (default: 50, max: 100)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "achPayments": [
      {
        "id": "pi_ach_1234567890",
        "amount": 10000,
        "currency": "usd",
        "status": "succeeded",
        "customer": "cust_1234567890",
        "description": "Monthly subscription - November 2025",
        "scheduledDate": "2025-11-05",
        "bankAccount": {
          "bankName": "Bank of America",
          "last4": "6789"
        },
        "createdAt": "2025-11-02T23:37:26.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 25,
      "totalPages": 1
    }
  }
}
```

### ACH Return Processing

**Endpoint:** `GET /api/v1/ach-payments/{paymentId}/returns`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "returns": [
      {
        "id": "ach_return_1234567890",
        "achPaymentId": "pi_ach_1234567890",
        "returnCode": "R01",
        "returnReason": "Insufficient funds",
        "returnedAt": "2025-11-10T15:30:00.000Z",
        "adjustedAmount": 10000,
        "corrected": false,
        "notes": "Customer will resubmit payment"
      }
    ]
  }
}
```

---

## Direct Deposit API

### Create Direct Deposit Recipient

Set up an employee or contractor for direct deposit payments.

**Endpoint:** `POST /api/v1/direct-deposit/recipients`

**Request Body:**
```json
{
  "employeeId": "emp_1234567890",
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@example.com",
  "phone": "+1234567890",
  "dateOfBirth": "1990-05-15",
  "ssnLast4": "1234",
  "address": {
    "line1": "123 Elm Street",
    "city": "San Francisco",
    "state": "CA",
    "postalCode": "94105",
    "country": "US"
  },
  "bankAccounts": [
    {
      "accountHolderName": "Jane Smith",
      "bankName": "Wells Fargo",
      "routingNumber": "121000248",
      "accountNumber": "000123456789",
      "accountType": "checking",
      "isDefault": true
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "dd_recipient_1234567890",
    "stripeAccountId": "acct_1ABC234DEF456",
    "employeeId": "emp_1234567890",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane.smith@example.com",
    "phone": "+1234567890",
    "dateOfBirth": "1990-05-15",
    "ssnLast4": "1234",
    "address": {
      "line1": "123 Elm Street",
      "city": "San Francisco",
      "state": "CA",
      "postalCode": "94105",
      "country": "US"
    },
    "verificationStatus": "pending",
    "accountStatus": "pending",
    "kycStatus": "pending",
    "chargesEnabled": false,
    "transfersEnabled": false,
    "payoutsEnabled": false,
    "bankAccounts": [
      {
        "id": "dd_bank_1234567890",
        "bankName": "Wells Fargo",
        "last4": "6789",
        "accountType": "checking",
        "isDefault": true,
        "isVerified": false,
        "status": "pending"
      }
    ],
    "createdAt": "2025-11-02T23:37:26.000Z"
  }
}
```

### Process Direct Deposit Payment

**Endpoint:** `POST /api/v1/direct-deposit/payouts`

**Request Body:**
```json
{
  "recipientId": "dd_recipient_1234567890",
  "amount": 500000,
  "currency": "usd",
  "description": "Payroll - November 2025",
  "payPeriodStart": "2025-11-01",
  "payPeriodEnd": "2025-11-15",
  "bankAccountId": "dd_bank_1234567890",
  "metadata": {
    "payrollId": "payroll_67890",
    "employeeId": "emp_1234567890",
    "payType": "salary"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "po_1234567890",
    "stripePayoutId": "po_ABC123DEF456",
    "object": "payout",
    "amount": 500000,
    "currency": "usd",
    "status": "pending",
    "recipientId": "dd_recipient_1234567890",
    "description": "Payroll - November 2025",
    "payPeriodStart": "2025-11-01",
    "payPeriodEnd": "2025-11-15",
    "bankAccount": {
      "bankName": "Wells Fargo",
      "last4": "6789",
      "accountType": "checking"
    },
    "scheduledPayoutDate": "2025-11-15",
    "estimatedArrivalDate": "2025-11-17T00:00:00.000Z",
    "method": "standard",
    "createdAt": "2025-11-02T23:37:26.000Z"
  }
}
```

### Retrieve Payout Status

**Endpoint:** `GET /api/v1/direct-deposit/payouts/{payoutId}`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "po_1234567890",
    "stripePayoutId": "po_ABC123DEF456",
    "amount": 500000,
    "currency": "usd",
    "status": "paid",
    "recipientId": "dd_recipient_1234567890",
    "description": "Payroll - November 2025",
    "bankAccount": {
      "bankName": "Wells Fargo",
      "last4": "6789",
      "accountType": "checking"
    },
    "scheduledPayoutDate": "2025-11-15",
    "actualPayoutDate": "2025-11-15T10:30:00.000Z",
    "estimatedArrivalDate": "2025-11-17T00:00:00.000Z",
    "actualArrivalDate": "2025-11-17T08:45:00.000Z",
    "fees": {
      "stripeFeeAmount": 250,
      "netAmount": 499750
    },
    "failureReason": null,
    "createdAt": "2025-11-02T23:37:26.000Z",
    "updatedAt": "2025-11-17T08:45:00.000Z"
  }
}
```

### List Direct Deposit Recipients

**Endpoint:** `GET /api/v1/direct-deposit/recipients`

**Query Parameters:**
- `employeeId` (string, optional): Filter by employee ID
- `status` (string, optional): Filter by verification status
- `verificationStatus` (string, optional): Filter by verification status
- `limit` (integer, optional): Number of results (default: 50, max: 100)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "recipients": [
      {
        "id": "dd_recipient_1234567890",
        "stripeAccountId": "acct_1ABC234DEF456",
        "employeeId": "emp_1234567890",
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane.smith@example.com",
        "verificationStatus": "verified",
        "accountStatus": "enabled",
        "chargesEnabled": true,
        "transfersEnabled": true,
        "payoutsEnabled": true,
        "bankAccounts": [
          {
            "bankName": "Wells Fargo",
            "last4": "6789",
            "accountType": "checking",
            "isDefault": true,
            "isVerified": true
          }
        ],
        "createdAt": "2025-11-02T23:37:26.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 25,
      "totalPages": 1
    }
  }
}
```

---

## Webhook Integration

### Webhook Endpoint Configuration

**Endpoint:** `POST /api/v1/webhooks/stripe`

**Headers:**
```http
Stripe-Signature: t=1234567890,v1=signature_hash
Content-Type: application/json
```

### Webhook Event Handling

**Customer Events:**
```json
{
  "type": "customer.created",
  "data": {
    "object": {
      "id": "cus_ABC123DEF456",
      "email": "customer@example.com",
      "created": 1234567890
    }
  }
}
```

**Payment Events:**
```json
{
  "type": "charge.succeeded",
  "data": {
    "object": {
      "id": "ch_1234567890",
      "amount": 2599,
      "currency": "usd",
      "customer": "cus_ABC123DEF456",
      "paymentMethod": "pm_1234567890",
      "status": "succeeded"
    }
  }
}
```

**ACH Payment Events:**
```json
{
  "type": "charge.succeeded",
  "data": {
    "object": {
      "id": "ch_ach_1234567890",
      "amount": 10000,
      "currency": "usd",
      "paymentMethod": "pm_1234567890",
      "achDetails": {
        "classCode": "PPD",
        "companyName": "Your Company Name"
      }
    }
  }
}
```

**Payout Events:**
```json
{
  "type": "payout.paid",
  "data": {
    "object": {
      "id": "po_ABC123DEF456",
      "amount": 500000,
      "currency": "usd",
      "status": "paid",
      "destination": "ba_1234567890"
    }
  }
}
```

### Webhook Security

```javascript
// Verify webhook signature
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

const webhookHandler = express.Router();

webhookHandler.post('/stripe', (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log(`⚠️  Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Handle the event
  switch (event.type) {
    case 'customer.created':
      handleCustomerCreated(event.data.object);
      break;
    case 'customer.updated':
      handleCustomerUpdated(event.data.object);
      break;
    case 'payment_method.attached':
      handlePaymentMethodAttached(event.data.object);
      break;
    case 'charge.succeeded':
      handleChargeSucceeded(event.data.object);
      break;
    case 'charge.failed':
      handleChargeFailed(event.data.object);
      break;
    case 'payment_intent.succeeded':
      handlePaymentIntentSucceeded(event.data.object);
      break;
    case 'payment_intent.payment_failed':
      handlePaymentIntentFailed(event.data.object);
      break;
    case 'payout.paid':
      handlePayoutPaid(event.data.object);
      break;
    case 'payout.failed':
      handlePayoutFailed(event.data.object);
      break;
    case 'account.updated':
      handleAccountUpdated(event.data.object);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
  
  res.json({ received: true });
});
```

---

## Error Handling

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_REQUEST` | 400 | Invalid request parameters |
| `AUTHENTICATION_REQUIRED` | 401 | Authentication required |
| `INSUFFICIENT_PERMISSIONS` | 403 | Insufficient permissions |
| `RESOURCE_NOT_FOUND` | 404 | Resource not found |
| `RESOURCE_ALREADY_EXISTS` | 409 | Resource already exists |
| `VALIDATION_ERROR` | 422 | Validation failed |
| `RATE_LIMIT_EXCEEDED` | 429 | Rate limit exceeded |
| `STRIPE_ERROR` | 502 | Stripe API error |
| `DATABASE_ERROR` | 503 | Database connection error |
| `EXTERNAL_SERVICE_ERROR` | 503 | External service unavailable |
| `INTERNAL_ERROR` | 500 | Internal server error |

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid parameters",
    "details": {
      "field": "email",
      "reason": "Invalid email format",
      "value": "invalid-email"
    },
    "suggestion": "Please provide a valid email address"
  },
  "timestamp": "2025-11-02T23:37:26.000Z",
  "requestId": "req_1234567890",
  "documentationUrl": "https://docs.yourdomain.com/errors/VALIDATION_ERROR"
}
```

### Common Error Scenarios

**Invalid Customer Data:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Customer validation failed",
    "details": [
      {
        "field": "email",
        "reason": "Email already exists",
        "value": "existing@example.com"
      },
      {
        "field": "phone",
        "reason": "Invalid phone number format",
        "value": "12345"
      }
    ]
  }
}
```

**Stripe API Error:**
```json
{
  "success": false,
  "error": {
    "code": "STRIPE_ERROR",
    "message": "Stripe API error",
    "details": {
      "stripeErrorCode": "card_declined",
      "stripeMessage": "Your card was declined.",
      "declineCode": "generic_decline",
      "stripeType": "CardError"
    }
  }
}
```

**Insufficient Funds (ACH):**
```json
{
  "success": false,
  "error": {
    "code": "ACH_INSUFFICIENT_FUNDS",
    "message": "ACH payment failed due to insufficient funds",
    "details": {
      "returnCode": "R01",
      "returnReason": "Insufficient funds",
      "originalPaymentId": "pi_ach_1234567890"
    }
  }
}
```

### Retry Logic

```javascript
// Exponential backoff retry logic
async function retryWithBackoff(operation, maxRetries = 3) {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries) {
        throw error;
      }
      
      // Don't retry on client errors
      if (error.status >= 400 && error.status < 500) {
        throw error;
      }
      
      // Exponential backoff
      const delay = Math.pow(2, i) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Usage
const customer = await retryWithBackoff(async () => {
  return await stripe.customers.create(customerData);
});
```

---

## Rate Limiting

### Rate Limits

| Endpoint Category | Limit | Window |
|-------------------|-------|--------|
| Authentication | 10 requests | 1 minute |
| Customer Management | 100 requests | 1 minute |
| Payment Processing | 50 requests | 1 minute |
| ACH Payments | 30 requests | 1 minute |
| Direct Deposit | 20 requests | 1 minute |
| Webhook Processing | 1000 requests | 1 minute |
| General API | 1000 requests | 1 minute |

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
X-RateLimit-Window: 60
```

### Rate Limit Exceeded Response

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded",
    "details": {
      "limit": 100,
      "window": "1 minute",
      "retryAfter": 30
    }
  }
}
```

### Best Practices for Rate Limiting

1. **Use request queuing for bulk operations**
2. **Implement client-side caching**
3. **Batch operations when possible**
4. **Use webhooks for real-time updates instead of polling**

---

## SDK and Library Examples

### JavaScript/Node.js

```javascript
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize client
const client = new StripeClient({
  apiKey: process.env.STRIPE_SECRET_KEY,
  baseUrl: 'https://api.yourdomain.com'
});

// Create customer
const customer = await client.customers.create({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '+1234567890',
  billingAddress: {
    line1: '123 Main Street',
    city: 'San Francisco',
    state: 'CA',
    postalCode: '94105',
    country: 'US'
  }
});

// Process payment
const payment = await client.payments.create({
  customerId: customer.id,
  amount: 2599,
  currency: 'usd',
  description: 'Invoice #12345',
  metadata: {
    invoiceId: 'inv_12345'
  }
});

// Create ACH payment
const achPayment = await client.achPayments.create({
  customerId: customer.id,
  paymentMethodId: 'pm_1234567890',
  amount: 10000,
  currency: 'usd',
  achClassCode: 'PPD',
  scheduledDate: '2025-11-05'
});

// Process direct deposit
const payout = await client.directDeposit.payouts.create({
  recipientId: 'dd_recipient_1234567890',
  amount: 500000,
  currency: 'usd',
  description: 'Payroll - November 2025'
});
```

### Python

```python
import requests
import json

class OracleLedgerClient:
    def __init__(self, api_key, base_url):
        self.api_key = api_key
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        })
    
    def create_customer(self, customer_data):
        response = self.session.post(
            f'{self.base_url}/v1/customers',
            json=customer_data
        )
        response.raise_for_status()
        return response.json()
    
    def create_payment(self, payment_data):
        response = self.session.post(
            f'{self.base_url}/v1/payments',
            json=payment_data
        )
        response.raise_for_status()
        return response.json()

# Usage
client = OracleLedgerClient(
    api_key='your_api_key_here',
    base_url='https://api.yourdomain.com'
)

customer = client.create_customer({
    'firstName': 'John',
    'lastName': 'Doe',
    'email': 'john.doe@example.com'
})

payment = client.create_payment({
    'customerId': customer['data']['id'],
    'amount': 2599,
    'currency': 'usd',
    'description': 'Invoice #12345'
})
```

### PHP

```php
<?php
class OracleLedgerClient {
    private $apiKey;
    private $baseUrl;
    
    public function __construct($apiKey, $baseUrl) {
        $this->apiKey = $apiKey;
        $this->baseUrl = $baseUrl;
    }
    
    private function request($method, $endpoint, $data = null) {
        $ch = curl_init();
        
        curl_setopt_array($ch, [
            CURLOPT_URL => $this->baseUrl . '/v1' . $endpoint,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $this->apiKey,
                'Content-Type: application/json'
            ]
        ]);
        
        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
        
        $response = curl_exec($ch);
        curl_close($ch);
        
        return json_decode($response, true);
    }
    
    public function createCustomer($customerData) {
        return $this->request('POST', '/customers', $customerData);
    }
    
    public function createPayment($paymentData) {
        return $this->request('POST', '/payments', $paymentData);
    }
}

// Usage
$client = new OracleLedgerClient(
    'your_api_key_here',
    'https://api.yourdomain.com'
);

$customer = $client->createCustomer([
    'firstName' => 'John',
    'lastName' => 'Doe',
    'email' => 'john.doe@example.com'
]);

$payment = $client->createPayment([
    'customerId' => $customer['data']['id'],
    'amount' => 2599,
    'currency' => 'usd',
    'description' => 'Invoice #12345'
]);
?>
```

### Ruby

```ruby
require 'net/http'
require 'json'

class OracleLedgerClient
  def initialize(api_key, base_url)
    @api_key = api_key
    @base_url = base_url
  end
  
  def request(method, endpoint, data = nil)
    uri = URI(@base_url + '/v1' + endpoint)
    
    case method
    when 'GET'
      request = Net::HTTP::Get.new(uri)
    when 'POST'
      request = Net::HTTP::Post.new(uri)
    when 'PUT'
      request = Net::HTTP::Put.new(uri)
    when 'DELETE'
      request = Net::HTTP::Delete.new(uri)
    end
    
    request['Authorization'] = "Bearer #{@api_key}"
    request['Content-Type'] = 'application/json'
    request.body = data.to_json if data
    
    response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: uri.scheme == 'https') do |http|
      http.request(request)
    end
    
    JSON.parse(response.body)
  end
  
  def create_customer(customer_data)
    request('POST', '/customers', customer_data)
  end
  
  def create_payment(payment_data)
    request('POST', '/payments', payment_data)
  end
end

# Usage
client = OracleLedgerClient.new(
  'your_api_key_here',
  'https://api.yourdomain.com'
)

customer = client.create_customer(
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com'
)

payment = client.create_payment(
  customerId: customer['data']['id'],
  amount: 2599,
  currency: 'usd',
  description: 'Invoice #12345'
)
```

---

## Best Practices

### API Integration

1. **Always use HTTPS in production**
2. **Implement proper error handling**
3. **Use idempotency keys for payment operations**
4. **Cache customer data when appropriate**
5. **Use webhooks for real-time updates**
6. **Implement retry logic with exponential backoff**
7. **Monitor API usage and rate limits**

### Security

1. **Store API keys securely**
2. **Validate all input data**
3. **Use proper authentication**
4. **Implement rate limiting**
5. **Log sensitive operations**
6. **Regularly rotate API keys**
7. **Use webhook signatures for verification**

### Performance

1. **Use pagination for large datasets**
2. **Implement client-side caching**
3. **Optimize database queries**
4. **Use connection pooling**
5. **Monitor response times**
6. **Implement request batching**

### Compliance

1. **Maintain PCI DSS compliance**
2. **Follow NACHA guidelines for ACH**
3. **Implement proper audit logging**
4. **Secure sensitive data**
5. **Regular compliance audits**

---

## Testing and Sandbox

### Sandbox Environment

**Base URL:** `https://sandbox-api.yourdomain.com`

**Test API Keys:**
```javascript
// Publishable key (for frontend)
pk_test_51234567890abcdef...

// Secret key (for backend)
sk_test_51234567890abcdef...
```

### Test Data

**Test Customer:**
```json
{
  "firstName": "Test",
  "lastName": "Customer",
  "email": "test@example.com",
  "phone": "+1234567890"
}
```

**Test Cards:**
```javascript
// Successful payment
cardNumber: '4242424242424242'

// Declined payment
cardNumber: '4000000000000002'

// Insufficient funds
cardNumber: '4000000000009995'

// Expired card
cardNumber: '4000000000000069'
```

**Test Bank Accounts (ACH):**
```javascript
// Successful ACH payment
bankAccount: '110000000'

// Failed ACH payment
bankAccount: '000123456789'
```

### Integration Testing

```javascript
// Jest test example
describe('Stripe Integration', () => {
  let client;
  
  beforeAll(() => {
    client = new OracleLedgerClient({
      apiKey: process.env.TEST_API_KEY,
      baseUrl: process.env.TEST_BASE_URL
    });
  });
  
  test('should create customer and process payment', async () => {
    // Create customer
    const customer = await client.customers.create({
      firstName: 'Test',
      lastName: 'Customer',
      email: 'test@example.com'
    });
    
    expect(customer.success).toBe(true);
    expect(customer.data.id).toBeDefined();
    
    // Process payment
    const payment = await client.payments.create({
      customerId: customer.data.id,
      amount: 1000,
      currency: 'usd',
      description: 'Test payment'
    });
    
    expect(payment.success).toBe(true);
    expect(payment.data.status).toBe('succeeded');
  });
  
  test('should handle ACH payment', async () => {
    const achPayment = await client.achPayments.create({
      customerId: 'test_customer_id',
      paymentMethodId: 'test_payment_method',
      amount: 5000,
      currency: 'usd',
      achClassCode: 'PPD'
    });
    
    expect(achPayment.success).toBe(true);
  });
});
```

### Load Testing

```javascript
// Artillery load test configuration
config:
  target: 'https://api.yourdomain.com'
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 20
  payload:
    path: "test-data.csv"
    fields:
      - "customerId"
      - "amount"

scenarios:
  - name: "Process Payments"
    weight: 60
    flow:
      - post:
          url: "/v1/payments"
          json:
            customerId: "{{ customerId }}"
            amount: "{{ amount }}"
            currency: "usd"
            description: "Load test payment"
  
  - name: "Create Customers"
    weight: 40
    flow:
      - post:
          url: "/v1/customers"
          json:
            firstName: "LoadTest"
            lastName: "User{{ $randomString() }}"
            email: "loadtest{{ $randomInt(1, 1000) }}@example.com"
```

---

*This API Integration Guide provides comprehensive documentation for integrating with ORACLE-LEDGER Stripe API. For additional information, see DEPLOYMENT_GUIDE.md, CONFIGURATION_GUIDE.md, TROUBLESHOOTING_GUIDE.md, and DEVELOPER_GUIDE.md.*
