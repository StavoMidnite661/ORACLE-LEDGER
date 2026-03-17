# SOVRCVLT ORACLE-LEDGER API Specification

This document outlines the API endpoints for the SOVRCVLT ORACLE-LEDGER application.

## Base URL

The base URL for all API endpoints is `/api`.

## Authentication

Currently, there is no authentication required to access the API endpoints.

## Endpoints

### Employees

*   **GET /api/employees**

    *   Description: Retrieves a list of all employees.
    *   Response:

        ```json
        [
          {
            "id": "EMP-1672532400000",
            "name": "John Doe",
            "annualSalary": 80000,
            "bankRoutingNumber": "123456789",
            "bankAccountNumber": "987654321",
            "paymentMethod": "ACH",
            "taxId": "12-3456789"
          }
        ]
        ```

*   **POST /api/employees**

    *   Description: Creates a new employee.
    *   Request Body:

        ```json
        {
          "name": "Jane Smith",
          "annualSalary": 90000,
          "bankRoutingNumber": "123456789",
          "bankAccountNumber": "123456789",
          "paymentMethod": "Wire",
          "taxId": "98-7654321"
        }
        ```

*   **PUT /api/employees/:id**

    *   Description: Updates an existing employee.
    *   Request Body:

        ```json
        {
          "name": "Jane Smith",
          "annualSalary": 95000
        }
        ```

### Journal Entries

*   **GET /api/journal-entries**

    *   Description: Retrieves a list of all journal entries.
    *   Response:

        ```json
        [
          {
            "id": "JE-123456",
            "date": "2023-01-01",
            "description": "Initial funding",
            "source": "CHAIN",
            "status": "Posted",
            "lines": [
              {
                "accountId": 1,
                "type": "DEBIT",
                "amount": 10000
              },
              {
                "accountId": 2,
                "type": "CREDIT",
                "amount": 10000
              }
            ]
          }
        ]
        ```

*   **POST /api/journal-entries**

    *   Description: Creates a new journal entry.
    *   Request Body:

        ```json
        {
          "description": "Office supplies purchase",
          "source": "PURCHASE",
          "status": "Pending",
          "lines": [
            {
              "accountId": 10,
              "type": "DEBIT",
              "amount": 250
            },
            {
              "accountId": 1,
              "type": "CREDIT",
              "amount": 250
            }
          ]
        }
        ```

### Vendors

*   **GET /api/vendors**

    *   Description: Retrieves a list of all vendors.
    *   Response:

        ```json
        [
          {
            "id": "VEN-1672532400000",
            "name": "Office Supplies Inc.",
            "contactPerson": "John Smith",
            "email": "john@officesupplies.com",
            "phone": "123-456-7890",
            "address": "123 Main St, Anytown, USA",
            "paymentTerms": "Net 30",
            "bankAccountNumber": "123456789",
            "bankRoutingNumber": "987654321",
            "taxId": "12-3456789",
            "status": "Active",
            "category": "Supplies",
            "notes": "",
            "createdDate": "2023-01-01"
          }
        ]
        ```

*   **POST /api/vendors**

    *   Description: Creates a new vendor.
    *   Request Body:

        ```json
        {
          "name": "New Vendor",
          "contactPerson": "Jane Doe",
          "email": "jane@newvendor.com",
          "phone": "098-765-4321",
          "address": "456 Oak Ave, Anytown, USA",
          "paymentTerms": "Net 60",
          "bankAccountNumber": "987654321",
          "bankRoutingNumber": "123456789",
          "taxId": "98-7654321",
          "status": "Active",
          "category": "Services",
          "notes": "New vendor for consulting services"
        }
        ```

### Company Cards

*   **GET /api/company-cards**

    *   Description: Retrieves a list of all company cards.
    *   Response:

        ```json
        [
          {
            "id": "CARD-1672532400000",
            "cardNumber": {
              "last4": "1234",
              "providerTokenId": "tok_1234567890"
            },
            "cardType": "Virtual",
            "cardProvider": "Visa",
            "assignedTo": "EMP-1672532400000",
            "assignedEntity": "SOVR Development Holdings LLC",
            "status": "Active",
            "monthlyLimit": 5000,
            "dailyLimit": 1000,
            "transactionLimit": 500,
            "spentThisMonth": 0,
            "spentThisQuarter": 0,
            "spentThisYear": 0,
            "allowedCategories": [],
            "blockedCategories": [],
            "expirationDate": "12/25",
            "issueDate": "2023-01-01",
            "billingAddress": "123 Main St, Anytown, USA"
          }
        ]
        ```

*   **POST /api/company-cards**

    *   Description: Creates a new company card.
    *   Request Body:

        ```json
        {
          "cardNumber": {
            "last4": "5678",
            "providerTokenId": "tok_0987654321"
          },
          "cardType": "Physical",
          "cardProvider": "Mastercard",
          "assignedTo": "EMP-1672532400001",
          "assignedEntity": "SOVR Development Holdings LLC",
          "status": "Active",
          "monthlyLimit": 10000,
          "dailyLimit": 2000,
          "transactionLimit": 1000,
          "expirationDate": "12/26",
          "issueDate": "2023-01-01",
          "billingAddress": "123 Main St, Anytown, USA"
        }
        ```

*   **PUT /api/company-cards/:id**

    *   Description: Updates an existing company card.
    *   Request Body:

        ```json
        {
          "status": "Suspended"
        }
        ```

### Card Transactions

*   **GET /api/card-transactions**

    *   Description: Retrieves a list of all card transactions.
    *   Response:

        ```json
        [
          {
            "id": "TXN-1672532400000",
            "cardId": "CARD-1672532400000",
            "merchantName": "Amazon.com",
            "merchantCategory": "Software",
            "amount": 49.99,
            "currency": "USD",
            "transactionDate": "2023-01-02",
            "postingDate": "2023-01-03",
            "description": "AWS Services",
            "status": "Posted",
            "location": "Online",
            "accountingCode": "6010",
            "notes": "Monthly AWS bill"
          }
        ]
        ```

*   **POST /api/card-transactions**

    *   Description: Creates a new card transaction.
    *   Request Body:

        ```json
        {
          "cardId": "CARD-1672532400000",
          "merchantName": "Starbucks",
          "merchantCategory": "Meals",
          "amount": 5.99,
          "currency": "USD",
          "transactionDate": "2023-01-03",
          "postingDate": "2023-01-04",
          "description": "Coffee",
          "status": "Posted",
          "location": "Anytown, USA",
          "accountingCode": "6015",
          "notes": ""
        }
        ```

### Purchase Orders

*   **GET /api/purchase-orders**

    *   Description: Retrieves a list of all purchase orders.
    *   Response:

        ```json
        [
          {
            "id": "PO-1672532400000",
            "vendor": "Office Supplies Inc.",
            "date": "2023-01-04",
            "items": [
              {
                "description": "Paper",
                "amount": 50
              },
              {
                "description": "Pens",
                "amount": 20
              }
            ],
            "totalAmount": 70,
            "status": "Approved"
          }
        ]
        ```

*   **POST /api/purchase-orders**

    *   Description: Creates a new purchase order.
    *   Request Body:

        ```json
        {
          "vendor": "New Vendor",
          "items": [
            {
              "description": "Consulting services",
              "amount": 5000
            }
          ],
          "totalAmount": 5000,
          "status": "Draft"
        }
        ```

### Invoices

*   **GET /api/invoices**

    *   Description: Retrieves a list of all invoices.
    *   Response:

        ```json
        [
          {
            "id": "INV-AR-1672532400000",
            "type": "AR",
            "counterparty": "Client A",
            "issueDate": "2023-01-05",
            "dueDate": "2023-02-04",
            "amount": 10000,
            "status": "Issued"
          }
        ]
        ```

*   **POST /api/invoices**

    *   Description: Creates a new invoice.
    *   Request Body:

        ```json
        {
          "type": "AP",
          "counterparty": "Vendor B",
          "dueDate": "2023-02-05",
          "amount": 2500,
          "status": "Issued"
        }
        ```

*   **PUT /api/invoices/:id**

    *   Description: Updates an existing invoice.
    *   Request Body:

        ```json
        {
          "status": "Paid"
        }
        ```

### Consul Credits Transactions

*   **GET /api/consul-credits-transactions**

    *   Description: Retrieves a list of all Consul Credits transactions.
    *   Response:

        ```json
        [
          {
            "id": "CC-1672532400000",
            "txHash": "0x123...",
            "blockNumber": 123456,
            "timestamp": "2023-01-06T12:00:00.000Z",
            "eventType": "DEPOSIT",
            "userAddress": "0xabc...",
            "tokenAddress": "0xdef...",
            "tokenSymbol": "ETH",
            "tokenAmount": "1000000000000000000",
            "consulCreditsAmount": "1000",
            "exchangeRate": "1000",
            "ledgerReference": "JE-654321",
            "journalEntryId": "JE-654321",
            "confirmations": 12,
            "status": "CONFIRMED"
          }
        ]
        ```

*   **POST /api/consul-credits-transactions**

    *   Description: Creates a new Consul Credits transaction.
    *   Request Body:

        ```json
        {
          "txHash": "0x456...",
          "blockNumber": 654321,
          "timestamp": "2023-01-07T12:00:00.000Z",
          "eventType": "WITHDRAW",
          "userAddress": "0x123...",
          "tokenAddress": "0x456...",
          "tokenSymbol": "USDC",
          "tokenAmount": "500000000",
          "consulCreditsAmount": "500",
          "exchangeRate": "1",
          "ledgerReference": "JE-123456",
          "journalEntryId": "JE-123456",
          "confirmations": 0,
          "status": "PENDING"
        }
        ```

### Health

*   **GET /api/health**

    *   Description: Checks the health of the API.
    *   Response:

        ```json
        {
          "status": "OK",
          "timestamp": "2023-01-01T00:00:00.000Z"
        }
        ```
