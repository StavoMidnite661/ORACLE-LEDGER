# SOVRCVLT ORACLE-LEDGER API Specification

## Server Architecture

### Technology Stack
- **Runtime**: Node.js 20+ with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL 16+ (with Drizzle ORM)
- **Port**: 3001 (configurable via API_PORT env variable)

### Environment Variables Required
```bash
DATABASE_URL=postgresql://user:password@host:port/database
API_PORT=3001  # Optional, defaults to 3001
GEMINI_API_KEY=your_gemini_api_key  # For AI features
```

## API Endpoints

### Health Check
```
GET /api/health
Response: { status: "OK", timestamp: "2025-10-01T12:00:00.000Z" }
```

### Employees

#### Get All Employees
```
GET /api/employees
Response: Employee[]
```

#### Create Employee
```
POST /api/employees
Body: {
  name: string,
  annualSalary: number,
  bankRoutingNumber?: string,
  bankAccountNumber?: string,
  paymentMethod: 'ACH' | 'Wire' | 'Crypto',
  taxId?: string
}
Response: Employee
```

#### Update Employee
```
PUT /api/employees/:id
Body: Employee
Response: Employee
```

### Journal Entries (Double-Entry Bookkeeping)

#### Get All Journal Entries
```
GET /api/journal-entries
Response: JournalEntry[]
```

#### Create Journal Entry
```
POST /api/journal-entries
Body: {
  description: string,
  source: string,
  status: string,
  lines: [
    {
      accountId: number,
      type: 'DEBIT' | 'CREDIT',
      amount: number
    }
  ]
}
Response: JournalEntry
Auto-generates: id (JE-XXXXXX), date (current date)
```

### Vendors

#### Get All Vendors
```
GET /api/vendors
Response: Vendor[]
```

#### Create Vendor
```
POST /api/vendors
Body: {
  name: string,
  contactPerson: string,
  email: string,
  phone: string,
  address: string,
  paymentTerms: string,
  bankAccountNumber?: string,
  bankRoutingNumber?: string,
  taxId: string,
  status: 'Active' | 'Inactive',
  category: 'Software' | 'Hardware' | 'Services' | 'Supplies' | 'Professional' | 'Other',
  notes?: string
}
Response: Vendor
Auto-generates: id (VEN-timestamp)
```

### Company Cards

#### Get All Cards
```
GET /api/company-cards
Response: CompanyCard[]
```

#### Create Card
```
POST /api/company-cards
Body: {
  cardNumber: {
    last4: string,
    providerTokenId?: string
  },
  cardType: 'Virtual' | 'Physical' | 'Fleet' | 'Gas',
  cardProvider: 'Visa' | 'Mastercard' | 'Amex' | 'Discover',
  assignedTo?: string,
  dailyLimit: number,
  monthlyLimit: number,
  transactionLimit: number,
  status: 'Active' | 'Suspended' | 'Cancelled',
  issueDate: string (YYYY-MM-DD),
  expirationDate: string (YYYY-MM-DD)
}
Response: CompanyCard
Auto-generates: id (CARD-timestamp)
```

#### Update Card
```
PUT /api/company-cards/:id
Body: CompanyCard
Response: CompanyCard
```

### Card Transactions

#### Get All Transactions
```
GET /api/card-transactions
Response: CardTransaction[]
```

#### Create Transaction
```
POST /api/card-transactions
Body: {
  cardId: string,
  merchantName: string,
  merchantCategory: 'Fuel' | 'Office' | 'Travel' | 'Software' | 'Equipment' | 'Other',
  amount: number,
  currency: string,
  transactionDate: string (YYYY-MM-DD),
  postingDate: string (YYYY-MM-DD),
  description: string,
  status: string,
  location?: string,
  accountingCode?: string,
  notes?: string
}
Response: CardTransaction
Auto-generates: id (TXN-timestamp)
```

### Purchase Orders

#### Get All Purchase Orders
```
GET /api/purchase-orders
Response: PurchaseOrder[]
```

#### Create Purchase Order
```
POST /api/purchase-orders
Body: {
  vendor: string,
  items: [
    {
      description: string,
      amount: number
    }
  ],
  totalAmount: number,
  status: 'Draft' | 'Approved' | 'Fulfilled'
}
Response: PurchaseOrder
Auto-generates: id (PO-timestamp), date (current date)
```

### Invoices (AR/AP)

#### Get All Invoices
```
GET /api/invoices
Response: Invoice[]
```

#### Create Invoice
```
POST /api/invoices
Body: {
  type: 'AR' | 'AP',
  counterparty: string,
  dueDate: string (YYYY-MM-DD),
  amount: number,
  status: 'Issued' | 'Paid' | 'Overdue'
}
Response: Invoice
Auto-generates: id (INV-AR-timestamp or INV-AP-timestamp), issueDate (current date)
```

#### Update Invoice
```
PUT /api/invoices/:id
Body: Partial<Invoice>
Response: Invoice
```

### Consul Credits (Blockchain)

#### Get All Blockchain Transactions
```
GET /api/consul-credits-transactions
Response: ConsulCreditsTransaction[]
```

#### Create Blockchain Transaction
```
POST /api/consul-credits-transactions
Body: {
  txHash: string,
  blockNumber: number,
  timestamp: Date,
  eventType: string,
  userAddress: string,
  tokenAddress: string,
  tokenSymbol: string,
  tokenAmount: string,
  consulCreditsAmount: string,
  exchangeRate: string,
  ledgerReference?: string,
  journalEntryId?: string,
  confirmations: number,
  status: string
}
Response: ConsulCreditsTransaction
Auto-generates: id (CC-timestamp)
```

## Type Conversion Logic

### Numeric Fields
All PostgreSQL NUMERIC fields are stored as strings in DB and converted to numbers in API:
```typescript
function parseNumeric(value: string | number): number {
  return typeof value === 'string' ? parseFloat(value) : value;
}
```

### Date Formatting
```typescript
function formatDateToISO(date: Date): string {
  return date.toISOString().split('T')[0];
}
```

### Spend Category Mapping
Database ENUMs → TypeScript ENUMs:
- 'Fuel' → SpendCategory.Fuel
- 'Office' → SpendCategory.Office
- 'Travel' → SpendCategory.Travel
- 'Software' → SpendCategory.Software
- 'Hardware' → SpendCategory.Equipment
- 'Other' → SpendCategory.Other

## CORS Configuration
```typescript
app.use(cors());  // Allows all origins for development
```

## Error Handling
All endpoints return:
```json
{
  "error": "Error message description"
}
```
with HTTP 500 status code on failure.

## How to Run Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Database
```bash
# Create PostgreSQL database
# Set DATABASE_URL environment variable

# Push schema to database
npm run db:push
```

### 3. Start API Server
```bash
# Development mode (with auto-reload)
npm run dev:backend

# Production mode
node --loader tsx server/api.ts
```

### 4. Test API
```bash
curl http://localhost:3001/api/health
```

## Database Schema
See `database-schema.sql` for complete PostgreSQL DDL including:
- 14 tables with relationships
- 9 custom ENUM types
- Foreign key constraints
- Performance indexes
- Audit trails

## Frontend Integration
Frontend makes fetch calls to: `http://localhost:3001/api/*`

All responses are JSON format with proper type conversions applied.
