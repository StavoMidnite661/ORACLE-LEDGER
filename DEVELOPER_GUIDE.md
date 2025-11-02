# ORACLE-LEDGER Stripe Integration - Developer Guide

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Development Environment Setup](#development-environment-setup)
3. [Project Structure](#project-structure)
4. [Code Organization](#code-organization)
5. [Development Workflow](#development-workflow)
6. [Testing Standards](#testing-standards)
7. [Code Review Process](#code-review-process)
8. [Contribution Guidelines](#contribution-guidelines)
9. [Extension Points](#extension-points)
10. [Customization](#customization)
11. [Performance Guidelines](#performance-guidelines)
12. [Security Best Practices](#security-best-practices)
13. [Version Control](#version-control)
14. [Release Procedures](#release-procedures)
15. [Development Tools](#development-tools)

---

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ORACLE-LEDGER STRIPE INTEGRATION        │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   FRONTEND   │  │   BACKEND    │  │   DATABASE   │
│              │  │              │  │              │
│   React/Vite │  │  Express API │  │ PostgreSQL   │
│   Port: 5000 │  │  Port: 3001  │  │ Port: 5432   │
└──────────────┘  └──────────────┘  └──────────────┘
       │                  │                  │
       │                  │                  │
       ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  STRIPE API  │  │   WEBHOOKS   │  │   MONITORING │
│              │  │              │  │              │
│ Payment Proc │  │ Event Handling│  │  Logging     │
│ ACH/Direct   │  │ Real-time    │  │  Metrics     │
│ Deposit      │  │ Updates      │  │  Alerting    │
└──────────────┘  └──────────────┘  └──────────────┘
```

### Core Components

#### 1. Frontend Layer (React + TypeScript)
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS
- **State Management**: React hooks and context
- **Routing**: React Router

#### 2. Backend Layer (Node.js + Express)
- **Runtime**: Node.js 20+
- **Framework**: Express.js 5
- **Database ORM**: Drizzle ORM
- **API Documentation**: OpenAPI/Swagger
- **Validation**: Joi or Zod

#### 3. Database Layer (PostgreSQL)
- **Version**: PostgreSQL 16+
- **Migration**: Drizzle Kit
- **Connection Pooling**: pg-pool
- **Backup**: Automated with retention policies

#### 4. External Integrations
- **Payment Processing**: Stripe API v2024-06-20
- **Webhook Handling**: Stripe webhooks with signature verification
- **Monitoring**: Prometheus metrics
- **Logging**: Winston with structured logging

### Design Patterns

#### 1. Repository Pattern
```typescript
// Database abstraction layer
interface CustomerRepository {
  findById(id: string): Promise<Customer | null>;
  findByEmail(email: string): Promise<Customer | null>;
  create(data: CreateCustomerData): Promise<Customer>;
  update(id: string, data: UpdateCustomerData): Promise<Customer>;
  delete(id: string): Promise<void>;
}

class CustomerRepositoryImpl implements CustomerRepository {
  constructor(private db: Database) {}
  
  async findById(id: string): Promise<Customer | null> {
    const result = await this.db
      .select()
      .from(customers)
      .where(eq(customers.id, id))
      .limit(1);
    
    return result[0] || null;
  }
  
  // ... other methods
}
```

#### 2. Service Layer Pattern
```typescript
// Business logic layer
interface CustomerService {
  createCustomer(data: CreateCustomerRequest): Promise<CustomerResponse>;
  getCustomer(id: string): Promise<CustomerResponse>;
  updateCustomer(id: string, data: UpdateCustomerRequest): Promise<CustomerResponse>;
}

class CustomerServiceImpl implements CustomerService {
  constructor(
    private customerRepo: CustomerRepository,
    private stripeService: StripeService,
    private auditLogger: AuditLogger
  ) {}
  
  async createCustomer(data: CreateCustomerRequest): Promise<CustomerResponse> {
    // Validate input
    await this.validateCustomerData(data);
    
    // Create in database
    const customer = await this.customerRepo.create(data);
    
    // Create in Stripe
    const stripeCustomer = await this.stripeService.createCustomer(data);
    
    // Update with Stripe ID
    const updatedCustomer = await this.customerRepo.update(customer.id, {
      stripeCustomerId: stripeCustomer.id
    });
    
    // Log audit trail
    await this.auditLogger.log({
      action: 'create_customer',
      userId: data.createdBy,
      resourceId: customer.id,
      metadata: { stripeId: stripeCustomer.id }
    });
    
    return this.mapToResponse(updatedCustomer);
  }
}
```

#### 3. Factory Pattern
```typescript
// Payment method factory
interface PaymentMethodFactory {
  create(type: PaymentMethodType, data: PaymentMethodData): Promise<PaymentMethod>;
}

class StripePaymentMethodFactory implements PaymentMethodFactory {
  constructor(private stripe: Stripe) {}
  
  async create(type: PaymentMethodType, data: PaymentMethodData): Promise<PaymentMethod> {
    switch (type) {
      case 'card':
        return this.createCardPaymentMethod(data);
      case 'us_bank_account':
        return this.createBankAccountPaymentMethod(data);
      default:
        throw new Error(`Unsupported payment method type: ${type}`);
    }
  }
  
  private async createCardPaymentMethod(data: CardPaymentMethodData): Promise<PaymentMethod> {
    const paymentMethod = await this.stripe.paymentMethods.create({
      type: 'card',
      card: data.card,
      billing_details: data.billingDetails,
    });
    
    return this.mapToPaymentMethod(paymentMethod);
  }
}
```

### Database Schema Design

#### Entity Relationships
```mermaid
erDiagram
    CUSTOMERS ||--o{ PAYMENT_METHODS : has
    CUSTOMERS ||--o{ ACH_PAYMENTS : makes
    CUSTOMERS ||--o{ INVOICES : receives
    EMPLOYEES ||--o{ DIRECT_DEPOSIT_RECIPIENTS : is
    DIRECT_DEPOSIT_RECIPIENTS ||--o{ DIRECT_DEPOSIT_BANK_ACCOUNTS : has
    DIRECT_DEPOSIT_RECIPIENTS ||--o{ DIRECT_DEPOSIT_PAYOUTS : receives
    PAYMENT_METHODS ||--o{ ACH_PAYMENTS : used_for
    ACH_PAYMENTS ||--o{ ACH_RETURNS : has
    STRIPE_WEBHOOK_EVENTS ||--o{ ACH_PAYMENTS : triggers
    PCI_AUDIT_LOG }o--|| CUSTOMERS : logs_access_to
```

#### Key Design Principles

1. **Normalization**: Data is normalized to reduce redundancy
2. **Audit Trails**: All sensitive operations are logged
3. **Soft Deletes**: Records are marked as deleted rather than removed
4. **Timestamps**: All tables include created_at and updated_at
5. **UUIDs**: Primary keys use UUIDs for security
6. **Foreign Keys**: Referential integrity is enforced
7. **Indexes**: Optimized indexes for common query patterns

---

## Development Environment Setup

### Prerequisites Installation

#### 1. Node.js and npm
```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x

# Set up npm registry (if needed)
npm config set registry https://registry.npmjs.org/
```

#### 2. PostgreSQL Database
```bash
# Install PostgreSQL 16
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create development database and user
sudo -u postgres psql << EOF
CREATE DATABASE oracle_ledger_dev;
CREATE USER oracle_ledger_dev WITH PASSWORD 'dev_password';
GRANT ALL PRIVILEGES ON DATABASE oracle_ledger_dev TO oracle_ledger_dev;
\q
EOF

# Configure PostgreSQL for development
# Edit /etc/postgresql/16/main/postgresql.conf
sudo tee -a /etc/postgresql/16/main/postgresql.conf << EOF
# Development settings
shared_preload_libraries = 'pg_stat_statements'
log_statement = 'all'
log_duration = on
log_min_duration_statement = 0
EOF

sudo systemctl restart postgresql
```

#### 3. Redis (Optional - for caching)
```bash
# Install Redis
sudo apt install redis-server

# Configure Redis
sudo sed -i 's/^# bind 127.0.0.1 ::1/bind 127.0.0.1 ::1/' /etc/redis/redis.conf
sudo sed -i 's/^protected-mode yes/protected-mode no/' /etc/redis/redis.conf

# Start Redis
sudo systemctl start redis
sudo systemctl enable redis
```

### Project Setup

#### 1. Clone Repository
```bash
# Clone the repository
git clone https://github.com/your-org/oracle-ledger.git
cd oracle-ledger

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

#### 2. Environment Configuration
```bash
# .env file for development
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL=postgresql://oracle_ledger_dev:dev_password@localhost:5432/oracle_ledger_dev

# Stripe (use test keys)
STRIPE_PUBLISHABLE_KEY=pk_test_51...
STRIPE_SECRET_KEY=sk_test_51...
STRIPE_WEBHOOK_SECRET=whsec_test_...

# Logging
LOG_LEVEL=debug
LOG_FORMAT=simple

# Development flags
HOT_RELOAD=true
MOCK_STRIPE=false

# JWT (development secret - NEVER use in production)
JWT_SECRET=development-secret-key-change-in-production
JWT_EXPIRES_IN=24h

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Email (development SMTP - use MailHog or similar)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
```

#### 3. Database Setup
```bash
# Generate and apply database migrations
npm run db:generate
npm run db:push

# Or use the shorthand
npm run db:setup

# Verify database setup
psql $DATABASE_URL -c "\dt"

# You should see tables like:
# customers, payment_methods, ach_payments, direct_deposit_recipients, etc.
```

### Development Tools

#### 1. Code Editor Setup
```json
// .vscode/settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/.git": true,
    "**/.DS_Store": true,
    "**/dist": true,
    "**/build": true
  }
}
```

#### 2. Recommended VS Code Extensions
```json
// .vscode/extensions.json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "ms-vscode.vscode-json",
    "ms-python.python",
    "ms-vscode.vscode-eslint",
    "ms-vscode.vscode-remote-containers",
    "ms-vscode-remote.remote-ssh",
    "gitpod.gitpod-desktop",
    "humao.rest-client"
  ]
}
```

#### 3. Git Hooks Setup
```bash
# Install husky for git hooks
npm install --save-dev husky
npx husky install

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run lint && npm run type-check && npm run test"

# Add commit message hook
npx husky add .husky/commit-msg "npx commitlint --edit $1"

# Test the hooks
git add -A && git commit -m "test: test commit hooks"
```

### Development Workflow

#### 1. Start Development Servers
```bash
# Start all services (recommended)
npm run dev:full

# Or start individually
npm run dev:backend    # Backend API on port 3001
npm run dev            # Frontend on port 5000

# View database in Drizzle Studio (optional)
npm run db:studio
```

#### 2. Access Points
- **Frontend**: http://localhost:5000
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api-docs
- **Database Studio**: http://localhost:4983
- **Health Check**: http://localhost:3001/api/health

---

## Project Structure

### Directory Structure

```
oracle-ledger/
├── .husky/                     # Git hooks
├── .vscode/                    # VS Code configuration
├── attached_assets/            # Static assets
├── components/                 # React components
│   ├── shared/                # Shared components
│   ├── layout/                # Layout components
│   ├── customers/             # Customer management
│   ├── payments/              # Payment processing
│   ├── ach/                   # ACH payment components
│   ├── direct-deposit/        # Direct deposit components
│   ├── compliance/            # Compliance components
│   └── dashboard/             # Dashboard components
├── contracts/                 # Smart contracts (future)
├── database/                  # Database migrations
├── drizzle/                   # Drizzle ORM files
├── migrations/                # Database migration files
├── node_modules/              # Dependencies
├── public/                    # Static files
├── scripts/                   # Build and deployment scripts
├── server/                    # Backend API
│   ├── api.ts                # Express application
│   ├── db.ts                 # Database connection
│   ├── middleware/           # Express middleware
│   ├── routes/               # API routes
│   ├── controllers/          # Request controllers
│   └── utils/                # Utility functions
├── services/                  # Business logic services
│   ├── stripe/               # Stripe integration
│   ├── customer/             # Customer management
│   ├── payment/              # Payment processing
│   ├── ach/                  # ACH processing
│   ├── direct-deposit/       # Direct deposit
│   ├── webhook/              # Webhook handling
│   ├── audit/                # Audit logging
│   └── compliance/           # Compliance management
├── shared/                    # Shared code
│   ├── schema.ts             # Database schema
│   ├── types.ts              # TypeScript types
│   ├── utils.ts              # Utilities
│   └── constants.ts          # Constants
├── tests/                     # Test files
│   ├── unit/                 # Unit tests
│   ├── integration/          # Integration tests
│   ├── e2e/                  # End-to-end tests
│   └── fixtures/             # Test fixtures
├── views/                     # React views/pages
├── .env.example              # Environment variables template
├── .eslintrc.js              # ESLint configuration
├── .prettierrc.js            # Prettier configuration
├── tailwind.config.js        # Tailwind CSS configuration
├── tsconfig.json             # TypeScript configuration
├── vite.config.ts            # Vite build configuration
├── drizzle.config.ts         # Drizzle configuration
├── package.json              # Project dependencies
├── README.md                 # Project documentation
└── .gitignore                # Git ignore patterns
```

### File Naming Conventions

#### 1. General Rules
- **Files**: kebab-case (e.g., `customer-service.ts`)
- **Components**: PascalCase (e.g., `CustomerForm.tsx`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_ATTEMPTS`)
- **Variables**: camelCase (e.g., `customerData`)
- **Classes**: PascalCase (e.g., `CustomerService`)
- **Interfaces**: PascalCase with descriptive names (e.g., `ICustomerService`)

#### 2. Specific Conventions
```typescript
// Services: [feature].service.ts
customer.service.ts
payment.service.ts
stripe.service.ts

// Controllers: [feature].controller.ts
customer.controller.ts
payment.controller.ts

// Types: [feature].types.ts
payment.types.ts
ach.types.ts

// Constants: [feature].constants.ts
stripe.constants.ts
validation.constants.ts

// Utils: [feature].utils.ts
string.utils.ts
validation.utils.ts

// Tests: [feature].test.ts
customer.service.test.ts
payment.controller.test.ts
```

### Code Organization Principles

#### 1. Separation of Concerns
- **Controllers**: Handle HTTP requests/responses
- **Services**: Implement business logic
- **Repositories**: Handle data access
- **Models**: Define data structures
- **Utils**: Provide utility functions

#### 2. Layer Architecture
```
┌──────────────┐
│  Controllers │  ← HTTP layer
└──────┬───────┘
       │
┌──────▼───────┐
│   Services   │  ← Business logic
└──────┬───────┘
       │
┌──────▼───────┐
│  Repositories│  ← Data access
└──────┬───────┘
       │
┌──────▼───────┐
│   Database   │  ← Persistence
└──────────────┘
```

---

## Code Organization

### Backend Architecture

#### 1. Express Application Structure
```typescript
// server/api.ts - Main application
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/error-handler';
import { authMiddleware } from './middleware/auth';
import { auditMiddleware } from './middleware/audit';

import customerRoutes from './routes/customer.routes';
import paymentRoutes from './routes/payment.routes';
import achRoutes from './routes/ach.routes';
import webhookRoutes from './routes/webhook.routes';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// Routes
app.use('/api/customers', authMiddleware, customerRoutes);
app.use('/api/payments', authMiddleware, paymentRoutes);
app.use('/api/ach', authMiddleware, achRoutes);
app.use('/api/webhooks', webhookRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

export default app;
```

#### 2. Route Organization
```typescript
// server/routes/customer.routes.ts
import { Router } from 'express';
import { CustomerController } from '../controllers/customer.controller';
import { CustomerService } from '../services/customer.service';
import { CustomerRepository } from '../repositories/customer.repository';
import { auditMiddleware } from '../middleware/audit';
import { validateRequest } from '../middleware/validation';

const router = Router();

// Dependencies injection
const customerService = new CustomerService(
  new CustomerRepository(),
  // ... other dependencies
);
const customerController = new CustomerController(customerService);

// Routes
router.post('/',
  auditMiddleware('create_customer'),
  validateRequest(customerValidationSchema.create),
  customerController.createCustomer
);

router.get('/',
  customerController.listCustomers
);

router.get('/:id',
  auditMiddleware('view_customer'),
  customerController.getCustomer
);

router.put('/:id',
  auditMiddleware('update_customer'),
  validateRequest(customerValidationSchema.update),
  customerController.updateCustomer
);

router.delete('/:id',
  auditMiddleware('delete_customer'),
  customerController.deleteCustomer
);

export default router;
```

#### 3. Controller Implementation
```typescript
// server/controllers/customer.controller.ts
import { Request, Response } from 'express';
import { CustomerService } from '../services/customer.service';
import { CreateCustomerRequest, UpdateCustomerRequest } from '../types/customer.types';

export class CustomerController {
  constructor(private customerService: CustomerService) {}
  
  async createCustomer(req: Request, res: Response): Promise<void> {
    try {
      const customerData: CreateCustomerRequest = req.body;
      const customer = await this.customerService.createCustomer(customerData);
      
      res.status(201).json({
        success: true,
        data: customer,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error creating customer:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'CUSTOMER_CREATION_ERROR',
          message: 'Failed to create customer'
        }
      });
    }
  }
  
  async listCustomers(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 50, search, status } = req.query;
      
      const result = await this.customerService.listCustomers({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        search: search as string,
        status: status as string
      });
      
      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error listing customers:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'CUSTOMER_LIST_ERROR',
          message: 'Failed to list customers'
        }
      });
    }
  }
  
  // ... other methods
}
```

### Frontend Architecture

#### 1. Component Structure
```typescript
// components/customers/CustomerList.tsx
import React, { useState, useEffect } from 'react';
import { CustomerService } from '../../services/customer.service';
import { Customer, CustomerListProps } from '../../types/customer.types';

export const CustomerList: React.FC<CustomerListProps> = ({
  onCustomerSelect,
  refreshTrigger
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    loadCustomers();
  }, [refreshTrigger]);
  
  const loadCustomers = async () => {
    try {
      setLoading(true);
      const customerService = new CustomerService();
      const result = await customerService.listCustomers();
      setCustomers(result.data);
      setError(null);
    } catch (err) {
      setError('Failed to load customers');
      console.error('Customer list error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return <CustomerListSkeleton />;
  }
  
  if (error) {
    return <ErrorMessage message={error} onRetry={loadCustomers} />;
  }
  
  return (
    <div className="customer-list">
      {customers.map(customer => (
        <CustomerCard
          key={customer.id}
          customer={customer}
          onSelect={() => onCustomerSelect(customer)}
        />
      ))}
    </div>
  );
};
```

#### 2. Custom Hooks
```typescript
// hooks/useCustomers.ts
import { useState, useEffect } from 'react';
import { CustomerService } from '../services/customer.service';
import { Customer, CustomerFilters } from '../types/customer.types';

export function useCustomers(filters?: CustomerFilters) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const customerService = new CustomerService();
  
  const loadCustomers = async () => {
    try {
      setLoading(true);
      const result = await customerService.listCustomers(filters);
      setCustomers(result.data);
      setError(null);
    } catch (err) {
      setError('Failed to load customers');
      console.error('Customer list error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadCustomers();
  }, [JSON.stringify(filters)]);
  
  return {
    customers,
    loading,
    error,
    refresh: loadCustomers
  };
}
```

### Shared Code Organization

#### 1. Type Definitions
```typescript
// shared/types/customer.types.ts
export interface Customer {
  id: string;
  stripeCustomerId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  billingAddress?: Address;
  shippingAddress?: Address;
  customerId?: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  active: boolean;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface CreateCustomerRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  billingAddress?: Address;
  shippingAddress?: Address;
  customerId?: number;
  metadata?: Record<string, any>;
}

export interface CustomerListFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive' | 'all';
}
```

#### 2. Database Schema
```typescript
// shared/schema.ts
import { pgTable, varchar, uuid, timestamp, boolean, jsonb, integer } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }).notNull().unique(),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phone: varchar('phone', { length: 50 }),
  stripeDefaultPaymentMethodId: varchar('stripe_default_payment_method_id', { length: 255 }),
  billingAddress: jsonb('billing_address'),
  shippingAddress: jsonb('shipping_address'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  stripeCreatedAt: timestamp('stripe_created_at'),
  stripeUpdatedAt: timestamp('stripe_updated_at'),
  active: boolean('active').default(true),
  customerId: integer('customer_id'),
  stripeMetadata: jsonb('stripe_metadata'),
  deletedAt: timestamp('deleted_at')
});

// Schema validation
export const insertCustomerSchema = createInsertSchema(customers);
export const selectCustomerSchema = createSelectSchema(customers);
```

---

## Development Workflow

### Git Workflow

#### 1. Branch Strategy
```
main (production)
├── develop (integration)
    ├── feature/customer-management
    ├── feature/ach-payments
    ├── feature/direct-deposit
    ├── fix/payment-validation
    ├── refactor/api-structure
    └── chore/update-dependencies
```

#### 2. Branch Naming Convention
- **feature/**: New features (`feature/customer-portal`)
- **fix/**: Bug fixes (`fix/payment-timeout`)
- **refactor/**: Code refactoring (`refactor/customer-service`)
- **chore/**: Maintenance tasks (`chore/update-node-version`)
- **docs/**: Documentation updates (`docs/api-endpoints`)

#### 3. Commit Message Format
```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `docs`: Documentation
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `style`: Code style changes

**Examples:**
```bash
feat(customer): add customer search functionality

- Implement fuzzy search for customer names
- Add email search capability
- Include pagination for large result sets

Closes #123

fix(ach): resolve payment validation timeout

- Increase timeout for ACH validation
- Add retry logic for failed validations
- Update error messages for better clarity

Refs #456

docs(api): update webhook documentation

- Add new webhook events
- Include signature verification examples
- Fix formatting issues

Closes #789
```

### Development Process

#### 1. Feature Development
```bash
# 1. Create feature branch
git checkout -b feature/feature-name

# 2. Develop and commit changes
git add .
git commit -m "feat: add new feature"

# 3. Push branch
git push origin feature/feature-name

# 4. Create pull request
# (Use GitHub/GitLab UI)
```

#### 2. Code Quality Checks
```bash
# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Type checking
npm run type-check

# Unit tests
npm run test

# Integration tests
npm run test:integration

# End-to-end tests
npm run test:e2e

# Build check
npm run build
```

#### 3. Pre-commit Checklist
- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] Documentation updated
- [ ] No console.log statements
- [ ] Environment variables documented
- [ ] Breaking changes noted

---

## Testing Standards

### Testing Pyramid

```
           /\
          /  \
         /E2E \    ← Few, expensive, comprehensive
        /______\
       /        \
      /Integration\  ← Some, medium cost
     /____________\
    /              \
   /    Unit Tests  \ ← Many, fast, cheap
  /__________________\
```

### Unit Testing

#### 1. Test Structure
```typescript
// tests/unit/services/customer.service.test.ts
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { CustomerService } from '../../../services/customer.service';
import { MockCustomerRepository } from '../../../__mocks__/customer.repository';
import { MockStripeService } from '../../../__mocks__/stripe.service';
import { MockAuditLogger } from '../../../__mocks__/audit.logger';
import { CreateCustomerRequest } from '../../../shared/types/customer.types';

describe('CustomerService', () => {
  let customerService: CustomerService;
  let mockRepository: MockCustomerRepository;
  let mockStripeService: MockStripeService;
  let mockAuditLogger: MockAuditLogger;
  
  beforeEach(() => {
    mockRepository = new MockCustomerRepository();
    mockStripeService = new MockStripeService();
    mockAuditLogger = new MockAuditLogger();
    
    customerService = new CustomerService(
      mockRepository,
      mockStripeService,
      mockAuditLogger
    );
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('createCustomer', () => {
    it('should create customer successfully', async () => {
      // Arrange
      const customerData: CreateCustomerRequest = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com'
      };
      
      const expectedResult = {
        id: '123',
        ...customerData,
        stripeCustomerId: 'cus_123',
        createdAt: new Date(),
        active: true
      };
      
      mockRepository.create.mockResolvedValue(expectedResult);
      mockStripeService.createCustomer.mockResolvedValue({ id: 'cus_123' });
      
      // Act
      const result = await customerService.createCustomer(customerData);
      
      // Assert
      expect(result).toEqual(expectedResult);
      expect(mockRepository.create).toHaveBeenCalledWith(customerData);
      expect(mockStripeService.createCustomer).toHaveBeenCalledWith(customerData);
      expect(mockAuditLogger.log).toHaveBeenCalledWith({
        action: 'create_customer',
        userId: undefined,
        resourceId: '123'
      });
    });
    
    it('should throw error for invalid email', async () => {
      // Arrange
      const invalidData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email'
      };
      
      // Act & Assert
      await expect(
        customerService.createCustomer(invalidData)
      ).rejects.toThrow('Invalid email format');
    });
    
    it('should handle Stripe API errors', async () => {
      // Arrange
      const customerData: CreateCustomerRequest = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com'
      };
      
      mockStripeService.createCustomer.mockRejectedValue(
        new Error('Stripe API error: card_declined')
      );
      
      // Act & Assert
      await expect(
        customerService.createCustomer(customerData)
      ).rejects.toThrow('Failed to create customer in Stripe');
    });
  });
});
```

#### 2. Test Coverage Requirements
- **Minimum coverage**: 80%
- **Critical functions**: 95%
- **New features**: 100%
- **Calculate coverage**:
```bash
npm run test:coverage
```

### Integration Testing

#### 1. API Endpoint Testing
```typescript
// tests/integration/customer.api.test.ts
import request from 'supertest';
import { setupTestApp } from '../helpers/test-app';
import { createTestCustomer } from '../fixtures/customer.fixture';

describe('Customer API', () => {
  const app = setupTestApp();
  
  describe('POST /api/customers', () => {
    it('should create customer successfully', async () => {
      // Arrange
      const customerData = createTestCustomer();
      
      // Act
      const response = await request(app)
        .post('/api/customers')
        .send(customerData)
        .expect(201);
      
      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.email).toBe(customerData.email);
    });
    
    it('should return validation error for invalid data', async () => {
      // Arrange
      const invalidData = {
        firstName: 'John',
        // Missing required fields
      };
      
      // Act
      const response = await request(app)
        .post('/api/customers')
        .send(invalidData)
        .expect(422);
      
      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
  
  describe('GET /api/customers', () => {
    it('should return paginated customers', async () => {
      // Act
      const response = await request(app)
        .get('/api/customers?page=1&limit=10')
        .expect(200);
      
      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.customers).toBeInstanceOf(Array);
      expect(response.body.data.pagination).toEqual({
        page: 1,
        limit: 10,
        total: expect.any(Number),
        totalPages: expect.any(Number)
      });
    });
  });
});
```

#### 2. Database Integration Testing
```typescript
// tests/integration/database.test.ts
import { setupTestDatabase, cleanupTestDatabase } from '../helpers/test-database';
import { CustomerRepository } from '../../src/repositories/customer.repository';
import { CreateCustomerRequest } from '../../src/shared/types/customer.types';

describe('Customer Repository Integration', () => {
  let repository: CustomerRepository;
  
  beforeAll(async () => {
    await setupTestDatabase();
    repository = new CustomerRepository();
  });
  
  afterAll(async () => {
    await cleanupTestDatabase();
  });
  
  beforeEach(async () => {
    // Clean database before each test
    await repository.clear();
  });
  
  describe('create', () => {
    it('should persist customer to database', async () => {
      // Arrange
      const customerData: CreateCustomerRequest = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com'
      };
      
      // Act
      const customer = await repository.create(customerData);
      
      // Assert
      expect(customer.id).toBeDefined();
      expect(customer.firstName).toBe('John');
      expect(customer.email).toBe('john@example.com');
      
      // Verify persistence
      const retrieved = await repository.findById(customer.id);
      expect(retrieved).toEqual(customer);
    });
    
    it('should enforce unique email constraint', async () => {
      // Arrange
      const customerData: CreateCustomerRequest = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com'
      };
      
      await repository.create(customerData);
      
      // Act & Assert
      await expect(
        repository.create(customerData)
      ).rejects.toThrow('duplicate key value');
    });
  });
});
```

### End-to-End Testing

#### 1. User Journey Testing
```typescript
// tests/e2e/customer-journey.test.ts
import { test, expect } from '@playwright/test';

test.describe('Customer Management Journey', () => {
  test('complete customer creation and payment flow', async ({ page }) => {
    // Navigate to application
    await page.goto('http://localhost:5000');
    
    // Create customer
    await page.click('[data-testid="create-customer"]');
    await page.fill('[data-testid="first-name"]', 'John');
    await page.fill('[data-testid="last-name"]', 'Doe');
    await page.fill('[data-testid="email"]', 'john@example.com');
    await page.click('[data-testid="save-customer"]');
    
    // Verify customer created
    await expect(page.locator('[data-testid="customer-list"]')).toContainText('John Doe');
    
    // Process payment
    await page.click('[data-testid="process-payment"]');
    await page.fill('[data-testid="amount"]', '100.00');
    await page.click('[data-testid="confirm-payment"]');
    
    // Verify payment success
    await expect(page.locator('[data-testid="payment-success"]')).toBeVisible();
  });
});
```

### Test Utilities

#### 1. Database Test Helpers
```typescript
// tests/helpers/test-database.ts
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

let testPool: Pool;

export async function setupTestDatabase() {
  testPool = new Pool({
    connectionString: process.env.TEST_DATABASE_URL,
  });
  
  // Run migrations
  // Apply test database schema
  await runMigrations('test');
}

export async function cleanupTestDatabase() {
  // Clean all tables
  await testPool.query('TRUNCATE TABLE customers, payment_methods, ach_payments RESTART IDENTITY CASCADE;');
  await testPool.end();
}

export function getTestDb() {
  return drizzle(testPool);
}
```

#### 2. API Test Helpers
```typescript
// tests/helpers/test-app.ts
import express from 'express';
import { applyRoutes } from '../../src/server/api';

export function setupTestApp() {
  const app = express();
  app.use(express.json());
  
  // Apply routes with test configuration
  applyRoutes(app);
  
  // Add test-specific middleware
  app.use((req, res, next) => {
    req.user = { id: 'test-user', role: 'admin' };
    next();
  });
  
  return app;
}
```

---

## Code Review Process

### Review Checklist

#### 1. Functionality Review
- [ ] Code implements the required functionality
- [ ] Edge cases are handled properly
- [ ] Error handling is comprehensive
- [ ] API contracts are followed
- [ ] Database operations are optimized

#### 2. Code Quality Review
- [ ] Code is readable and well-documented
- [ ] Naming conventions are followed
- [ ] Code is DRY (Don't Repeat Yourself)
- [ ] SOLID principles are applied
- [ ] No obvious performance issues

#### 3. Security Review
- [ ] Input validation is implemented
- [ ] SQL injection prevention
- [ ] Authentication and authorization
- [ ] Sensitive data handling
- [ ] API security measures

#### 4. Testing Review
- [ ] Unit tests are included
- [ ] Integration tests are provided
- [ ] Test coverage meets requirements
- [ ] Test cases are comprehensive
- [ ] Edge cases are tested

#### 5. Documentation Review
- [ ] Code comments are clear
- [ ] API documentation is updated
- [ ] README is current
- [ ] Changelog is maintained

### Review Process

#### 1. Pull Request Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)
- [ ] Breaking change (fix or feature)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Code is commented, especially in complex areas
- [ ] Documentation is updated
- [ ] No console.log statements
- [ ] Environment variables documented

## Screenshots (if applicable)
Include screenshots for UI changes

## Additional Notes
Any additional information for reviewers
```

#### 2. Review Workflow
```
1. Developer creates PR
   ↓
2. Automated checks run (CI/CD)
   ↓
3. Peer review (1-2 reviewers)
   ↓
4. Address feedback
   ↓
5. Approval
   ↓
6. Merge to develop
   ↓
7. Automated deployment to staging
   ↓
8. QA validation
   ↓
9. Merge to main (release)
```

#### 3. Review Comments Guidelines

**Constructive Feedback:**
```markdown
Good:
"The database query could be optimized by adding an index on the email column for faster lookups."

Instead of:
"This is slow."
```

**Specific Suggestions:**
```markdown
Good:
"Consider using Drizzle's select with specific columns to reduce data transfer:
```typescript
const customers = await db
  .select({
    id: customers.id,
    email: customers.email,
    firstName: customers.firstName,
    lastName: customers.lastName
  })
  .from(customers);
```

Instead of:
"Select only needed columns."
```

---

## Contribution Guidelines

### Getting Started

#### 1. Fork and Clone
```bash
# Fork the repository on GitHub, then clone
git clone https://github.com/your-username/oracle-ledger.git
cd oracle-ledger

# Add upstream remote
git remote add upstream https://github.com/original-org/oracle-ledger.git

# Create feature branch
git checkout -b feature/your-feature-name
```

#### 2. Development Setup
```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Set up database
npm run db:setup

# Run tests to ensure everything works
npm run test

# Start development servers
npm run dev:full
```

### Coding Standards

#### 1. TypeScript Guidelines
```typescript
// Use explicit types
interface Customer {
  readonly id: string;
  firstName: string;
  lastName: string;
  email: string;
}

// Prefer interfaces over type for objects
interface CustomerData {
  firstName: string;
  lastName: string;
  email: string;
}

// Use const assertions for literal types
const PaymentStatus = {
  PENDING: 'pending' as const,
  PROCESSING: 'processing' as const,
  SUCCEEDED: 'succeeded' as const,
  FAILED: 'failed' as const,
} as const;

type PaymentStatus = typeof PaymentStatus[keyof typeof PaymentStatus];
```

#### 2. Error Handling
```typescript
// Create custom error classes
export class CustomerNotFoundError extends Error {
  constructor(customerId: string) {
    super(`Customer not found: ${customerId}`);
    this.name = 'CustomerNotFoundError';
  }
}

export class StripeApiError extends Error {
  constructor(
    message: string,
    public stripeErrorCode?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'StripeApiError';
  }
}

// Use typed error handling
async function createCustomer(data: CreateCustomerRequest): Promise<Customer> {
  try {
    // Implementation
  } catch (error) {
    if (error instanceof StripeApiError) {
      throw new CustomerCreationError('Failed to create customer in Stripe', error);
    }
    throw new CustomerCreationError('Unknown error occurred');
  }
}
```

#### 3. Async/Await Patterns
```typescript
// Good: Proper async error handling
async function processPayment(paymentData: PaymentData): Promise<PaymentResult> {
  try {
    const payment = await stripe.paymentIntents.create(paymentData);
    
    // Process in parallel when possible
    const [customer, receipt] = await Promise.all([
      getCustomer(payment.customer),
      generateReceipt(payment)
    ]);
    
    return { payment, customer, receipt };
  } catch (error) {
    logger.error('Payment processing failed', { error, paymentData });
    throw new PaymentProcessingError('Failed to process payment', error);
  }
}

// Bad: Not handling errors
async function processPayment(paymentData: PaymentData) {
  const payment = await stripe.paymentIntents.create(paymentData); // No try/catch
  return payment;
}
```

### Code Style

#### 1. Formatting (Prettier Configuration)
```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

#### 2. Linting (ESLint Configuration)
```javascript
// .eslintrc.js
module.exports = {
  extends: [
    '@typescript-eslint/recommended',
    'prettier'
  ],
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    'prefer-const': 'error',
    'no-console': 'warn'
  }
};
```

#### 3. Import Organization
```typescript
// 1. Node modules
import React from 'react';
import express from 'express';

// 2. External packages
import Stripe from 'stripe';
import { v4 as uuidv4 } from 'uuid';

// 3. Relative imports - modules
import { CustomerService } from '../services/customer.service';
import { CustomerRepository } from '../repositories/customer.repository';

// 4. Relative imports - files
import { Customer } from '../types/customer.types';
import { ValidationError } from '../utils/errors';

// 5. Relative imports - parent directories
import { db } from '../../db';
import { logger } from '../../utils/logger';
```

---

## Extension Points

### Plugin Architecture

#### 1. Payment Processor Plugin
```typescript
// Plugin interface
interface PaymentProcessorPlugin {
  name: string;
  version: string;
  initialize(config: PluginConfig): Promise<void>;
  processPayment(data: PaymentData): Promise<PaymentResult>;
  refundPayment(paymentId: string): Promise<RefundResult>;
  validatePaymentMethod(method: PaymentMethod): boolean;
}

// Plugin registry
class PluginRegistry {
  private plugins = new Map<string, PaymentProcessorPlugin>();
  
  register(plugin: PaymentProcessorPlugin): void {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin ${plugin.name} is already registered`);
    }
    
    this.plugins.set(plugin.name, plugin);
  }
  
  getPlugin(name: string): PaymentProcessorPlugin | undefined {
    return this.plugins.get(name);
  }
  
  getAllPlugins(): PaymentProcessorPlugin[] {
    return Array.from(this.plugins.values());
  }
}

// Usage
const pluginRegistry = new PluginRegistry();

// Register Stripe plugin
pluginRegistry.register(new StripePaymentProcessor({
  apiKey: process.env.STRIPE_SECRET_KEY
}));

// Register PayPal plugin (future)
pluginRegistry.register(new PayPalPaymentProcessor({
  clientId: process.env.PAYPAL_CLIENT_ID,
  clientSecret: process.env.PAYPAL_CLIENT_SECRET
}));

// Use plugins
async function processPayment(paymentData: PaymentData) {
  const processor = pluginRegistry.getPlugin(paymentData.processor);
  if (!processor) {
    throw new Error(`Processor ${paymentData.processor} not found`);
  }
  
  return await processor.processPayment(paymentData);
}
```

#### 2. Event System
```typescript
// Event system
interface EventListener<T = any> {
  event: string;
  handler: (data: T) => Promise<void> | void;
}

class EventBus {
  private listeners = new Map<string, EventListener[]>();
  
  on<T>(event: string, handler: (data: T) => Promise<void> | void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    
    this.listeners.get(event)!.push({ event, handler });
  }
  
  async emit<T>(event: string, data: T): Promise<void> {
    const eventListeners = this.listeners.get(event) || [];
    
    await Promise.all(
      eventListeners.map(async (listener) => {
        try {
          await listener.handler(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      })
    );
  }
}

// Usage
const eventBus = new EventBus();

// Register event listeners
eventBus.on('customer.created', async (customer) => {
  await sendWelcomeEmail(customer.email);
  await createDefaultPaymentMethod(customer.id);
  await updateCustomerStatistics();
});

eventBus.on('payment.succeeded', async (payment) => {
  await updateInvoiceStatus(payment.invoiceId);
  await sendPaymentConfirmation(payment.customerId);
  await triggerWebhook('payment.completed', payment);
});

// Emit events
async function createCustomer(data: CreateCustomerRequest) {
  const customer = await customerService.createCustomer(data);
  
  // Emit event
  await eventBus.emit('customer.created', customer);
  
  return customer;
}
```

#### 3. Custom Field Support
```typescript
// Extensible customer schema
interface CustomerFields {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  // Custom fields can be added
  customFields?: Record<string, any>;
}

class CustomerService {
  private customFieldValidators = new Map<string, FieldValidator>();
  
  registerFieldValidator(fieldName: string, validator: FieldValidator): void {
    this.customFieldValidators.set(fieldName, validator);
  }
  
  async createCustomer(data: CreateCustomerRequest): Promise<Customer> {
    // Validate custom fields
    for (const [fieldName, value] of Object.entries(data.customFields || {})) {
      const validator = this.customFieldValidators.get(fieldName);
      if (validator && !validator.isValid(value)) {
        throw new ValidationError(`Invalid value for field ${fieldName}`);
      }
    }
    
    // Standard customer creation
    const customer = await this.repository.create(data);
    
    // Store custom fields
    await this.customFieldService.storeFields(customer.id, data.customFields || {});
    
    return customer;
  }
}

// Custom field validator
const taxIdValidator: FieldValidator = {
  isValid: (value: string) => {
    // Validate tax ID format
    return /^\d{2}-\d{7}$/.test(value);
  },
  errorMessage: 'Tax ID must be in format XX-XXXXXXX'
};

// Register custom field
customerService.registerFieldValidator('taxId', taxIdValidator);
```

### API Extensions

#### 1. Custom API Endpoints
```typescript
// Custom API extension
interface ApiExtension {
  name: string;
  routes: RouteDefinition[];
  middleware?: Middleware[];
}

class ApiExtensionManager {
  private extensions = new Map<string, ApiExtension>();
  
  registerExtension(extension: ApiExtension): void {
    // Validate extension
    this.validateExtension(extension);
    
    // Register routes
    extension.routes.forEach(route => {
      this.registerRoute(extension.name, route);
    });
  }
  
  private registerRoute(extensionName: string, route: RouteDefinition): void {
    const fullPath = `/api/extensions/${extensionName}${route.path}`;
    
    switch (route.method) {
      case 'GET':
        this.app.get(fullPath, route.handler);
        break;
      case 'POST':
        this.app.post(fullPath, route.handler);
        break;
      // ... other methods
    }
  }
}

// Extension example
const reportingExtension: ApiExtension = {
  name: 'reporting',
  routes: [
    {
      method: 'GET',
      path: '/revenue',
      handler: async (req, res) => {
        const report = await reportingService.generateRevenueReport(req.query);
        res.json(report);
      }
    },
    {
      method: 'GET',
      path: '/customers',
      handler: async (req, res) => {
        const report = await reportingService.generateCustomerReport(req.query);
        res.json(report);
      }
    }
  ]
};

apiExtensionManager.registerExtension(reportingExtension);
```

#### 2. Webhook Extensions
```typescript
// Webhook event handlers
interface WebhookHandler {
  eventType: string;
  handler: (event: Stripe.Event) => Promise<void>;
}

class WebhookHandlerManager {
  private handlers = new Map<string, WebhookHandler>();
  
  registerHandler(handler: WebhookHandler): void {
    this.handlers.set(handler.eventType, handler);
  }
  
  async processWebhook(event: Stripe.Event): Promise<void> {
    const handler = this.handlers.get(event.type);
    if (!handler) {
      console.log(`No handler registered for event type: ${event.type}`);
      return;
    }
    
    try {
      await handler.handler(event);
    } catch (error) {
      console.error(`Error processing webhook ${event.type}:`, error);
      throw error;
    }
  }
}

// Custom webhook handler
const customWebhookHandler: WebhookHandler = {
  eventType: 'payment_intent.succeeded',
  handler: async (event) => {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    
    // Custom logic
    await updateExternalSystem(paymentIntent.id);
    await triggerBusinessProcess(paymentIntent);
    await sendCustomNotification(paymentIntent);
  }
};

webhookHandlerManager.registerHandler(customWebhookHandler);
```

---

## Customization

### UI Customization

#### 1. Theme Customization
```typescript
// tailwind.config.js - Custom theme
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        },
        secondary: {
          50: '#f0fdf4',
          500: '#22c55e',
          900: '#14532d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
};
```

#### 2. Component Customization
```typescript
// Custom button component
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger' | 'success';
  size: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  children,
  onClick,
  ...props
}) => {
  const baseClasses = 'font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        (disabled || loading) && 'opacity-50 cursor-not-allowed'
      )}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};

// Custom layout component
interface LayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children, sidebar, header }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {header && (
        <header className="bg-white shadow-sm border-b border-gray-200">
          {header}
        </header>
      )}
      
      <div className="flex">
        {sidebar && (
          <aside className="w-64 bg-white shadow-sm min-h-screen">
            {sidebar}
          </aside>
        )}
        
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
```

#### 3. Dashboard Customization
```typescript
// Custom dashboard widgets
interface DashboardWidget {
  id: string;
  title: string;
  component: React.ComponentType<WidgetProps>;
  size: 'small' | 'medium' | 'large';
  position: { x: number; y: number };
}

interface DashboardConfig {
  widgets: DashboardWidget[];
  layout: 'grid' | 'list';
}

const CustomDashboard: React.FC = () => {
  const [config, setConfig] = useState<DashboardConfig>({
    widgets: [
      {
        id: 'revenue-chart',
        title: 'Revenue Chart',
        component: RevenueChartWidget,
        size: 'large',
        position: { x: 0, y: 0 },
      },
      {
        id: 'recent-payments',
        title: 'Recent Payments',
        component: RecentPaymentsWidget,
        size: 'medium',
        position: { x: 1, y: 0 },
      },
      {
        id: 'payment-metrics',
        title: 'Payment Metrics',
        component: PaymentMetricsWidget,
        size: 'small',
        position: { x: 2, y: 0 },
      },
    ],
    layout: 'grid',
  });
  
  return (
    <div className="dashboard">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Overview of your payment operations</p>
      </div>
      
      <div className={`grid gap-6 ${
        config.layout === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : ''
      }`}>
        {config.widgets.map((widget) => (
          <WidgetContainer key={widget.id} widget={widget} />
        ))}
      </div>
    </div>
  );
};
```

### Business Logic Customization

#### 1. Custom Payment Rules
```typescript
// Custom payment validation rules
interface PaymentValidationRule {
  name: string;
  validate(payment: PaymentData): ValidationResult;
}

class PaymentValidationEngine {
  private rules = new Map<string, PaymentValidationRule>();
  
  addRule(rule: PaymentValidationRule): void {
    this.rules.set(rule.name, rule);
  }
  
  async validatePayment(payment: PaymentData): Promise<ValidationResult> {
    const results: ValidationResult[] = [];
    
    for (const rule of this.rules.values()) {
      const result = await rule.validate(payment);
      results.push(result);
    }
    
    return {
      isValid: results.every(r => r.isValid),
      errors: results.flatMap(r => r.errors),
      warnings: results.flatMap(r => r.warnings),
    };
  }
}

// Example rule: Maximum payment amount
const maxAmountRule: PaymentValidationRule = {
  name: 'max-amount',
  validate: (payment: PaymentData) => {
    const maxAmount = 100000; // $1,000.00
    if (payment.amount > maxAmount) {
      return {
        isValid: false,
        errors: [`Payment amount exceeds maximum of $${maxAmount / 100}`],
        warnings: [],
      };
    }
    
    return { isValid: true, errors: [], warnings: [] };
  }
};

// Example rule: Business hours check
const businessHoursRule: PaymentValidationRule = {
  name: 'business-hours',
  validate: (payment: PaymentData) => {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    
    // Business hours: Monday-Friday, 9 AM - 5 PM
    if (day === 0 || day === 6 || hour < 9 || hour > 17) {
      return {
        isValid: false,
        errors: [],
        warnings: ['Payment processed outside business hours'],
      };
    }
    
    return { isValid: true, errors: [], warnings: [] };
  }
};

// Usage
const validator = new PaymentValidationEngine();
validator.addRule(maxAmountRule);
validator.addRule(businessHoursRule);

const result = await validator.validatePayment(paymentData);
if (!result.isValid) {
  throw new PaymentValidationError(result.errors);
}
```

#### 2. Custom Notification System
```typescript
// Notification channels
interface NotificationChannel {
  name: string;
  send(notification: Notification): Promise<void>;
}

class NotificationManager {
  private channels = new Map<string, NotificationChannel>();
  
  registerChannel(channel: NotificationChannel): void {
    this.channels.set(channel.name, channel);
  }
  
  async send(notification: Notification, channels: string[]): Promise<void> {
    const promises = channels.map(channelName => {
      const channel = this.channels.get(channelName);
      if (!channel) {
        throw new Error(`Notification channel ${channelName} not found`);
      }
      return channel.send(notification);
    });
    
    await Promise.allSettled(promises);
  }
}

// Email notification channel
class EmailNotificationChannel implements NotificationChannel {
  name = 'email';
  
  constructor(private emailService: EmailService) {}
  
  async send(notification: Notification): Promise<void> {
    await this.emailService.send({
      to: notification.recipient,
      subject: notification.subject,
      body: notification.message,
      template: notification.template,
      data: notification.data,
    });
  }
}

// SMS notification channel
class SMSNotificationChannel implements NotificationChannel {
  name = 'sms';
  
  constructor(private smsService: SMSService) {}
  
  async send(notification: Notification): Promise<void> {
    await this.smsService.send({
      to: notification.recipient,
      message: notification.message,
    });
  }
}

// Usage
const notificationManager = new NotificationManager();
notificationManager.registerChannel(new EmailNotificationChannel(emailService));
notificationManager.registerChannel(new SMSNotificationChannel(smsService));

// Send payment confirmation
await notificationManager.send({
  type: 'payment_confirmation',
  recipient: customer.email,
  subject: 'Payment Confirmed',
  message: `Your payment of $${amount / 100} has been processed successfully.`,
  data: { paymentId, amount, date: new Date() },
}, ['email']);
```

---

## Performance Guidelines

### Backend Performance

#### 1. Database Optimization
```typescript
// Efficient query patterns
class CustomerRepository {
  async findCustomersWithPayments(filters: CustomerFilters): Promise<Customer[]> {
    // Use selective queries with specific columns
    const customers = await db
      .select({
        id: customers.id,
        firstName: customers.firstName,
        lastName: customers.lastName,
        email: customers.email,
        // Avoid selecting large JSON fields unless needed
      })
      .from(customers)
      .where(and(
        eq(customers.active, true),
        filters.search ? or(
          ilike(customers.firstName, `%${filters.search}%`),
          ilike(customers.lastName, `%${filters.search}%`),
          ilike(customers.email, `%${filters.search}%`)
        ) : undefined
      ))
      .orderBy(desc(customers.createdAt))
      .limit(filters.limit || 50)
      .offset((filters.page || 1 - 1) * (filters.limit || 50));
    
    // Fetch related data separately if needed
    if (filters.includePayments) {
      const payments = await db
        .select()
        .from(payments)
        .where(inArray(payments.customerId, customers.map(c => c.id)));
      
      // Combine data in application layer
      return customers.map(customer => ({
        ...customer,
        payments: payments.filter(p => p.customerId === customer.id)
      }));
    }
    
    return customers;
  }
  
  // Use pagination for large datasets
  async getCustomersPaginated(cursor?: string, limit = 50): Promise<PaginatedResult<Customer>> {
    const query = db
      .select()
      .from(customers)
      .where(cursor ? lt(customers.createdAt, cursor) : undefined)
      .orderBy(desc(customers.createdAt))
      .limit(limit + 1); // Fetch one extra to determine if there's a next page
    
    const results = await query;
    const hasNextPage = results.length > limit;
    const items = hasNextPage ? results.slice(0, -1) : results;
    
    return {
      items,
      nextCursor: hasNextPage ? items[items.length - 1].createdAt : null,
      hasNextPage,
    };
  }
}
```

#### 2. Caching Strategy
```typescript
// Redis caching implementation
class CustomerCacheService {
  constructor(private redis: Redis) {}
  
  private getCacheKey(customerId: string): string {
    return `customer:${customerId}`;
  }
  
  async getCustomer(customerId: string): Promise<Customer | null> {
    const cached = await this.redis.get(this.getCacheKey(customerId));
    if (cached) {
      return JSON.parse(cached);
    }
    
    return null;
  }
  
  async setCustomer(customer: Customer, ttl = 300): Promise<void> {
    await this.redis.setex(
      this.getCacheKey(customer.id),
      ttl,
      JSON.stringify(customer)
    );
  }
  
  async invalidateCustomer(customerId: string): Promise<void> {
    await this.redis.del(this.getCacheKey(customerId));
  }
  
  // Cache-aside pattern
  async getOrFetchCustomer(customerId: string, fetchFn: () => Promise<Customer>): Promise<Customer> {
    // Try cache first
    const cached = await this.getCustomer(customerId);
    if (cached) {
      return cached;
    }
    
    // Fetch from database
    const customer = await fetchFn();
    
    // Store in cache
    await this.setCustomer(customer);
    
    return customer;
  }
}

// Usage in service
class CustomerService {
  constructor(
    private repository: CustomerRepository,
    private cache: CustomerCacheService
  ) {}
  
  async getCustomer(id: string): Promise<Customer> {
    return this.cache.getOrFetchCustomer(
      id,
      () => this.repository.findById(id)
    );
  }
}
```

#### 3. Background Processing
```typescript
// Bull queue for background jobs
import Queue from 'bull';

const emailQueue = new Queue('email processing', {
  redis: process.env.REDIS_URL,
});

const reportingQueue = new Queue('report generation', {
  redis: process.env.REDIS_URL,
});

// Process email queue
emailQueue.process('send-payment-confirmation', async (job) => {
  const { customerEmail, paymentDetails } = job.data;
  
  // Send email (can take several seconds)
  await emailService.sendPaymentConfirmation(customerEmail, paymentDetails);
  
  return { sent: true };
});

// Add job to queue
await emailQueue.add('send-payment-confirmation', {
  customerEmail: 'customer@example.com',
  paymentDetails: {
    amount: 10000,
    date: new Date(),
    id: 'pi_123'
  }
}, {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000,
  },
  removeOnComplete: 10,
  removeOnFail: 50,
});

// Scheduled jobs
reportingQueue.add('generate-daily-report', {}, {
  repeat: { cron: '0 2 * * *' }, // Daily at 2 AM
});
```

### Frontend Performance

#### 1. Code Splitting
```typescript
// Lazy loading routes
const CustomerList = lazy(() => import('../views/CustomerList'));
const CustomerDetails = lazy(() => import('../views/CustomerDetails'));
const PaymentHistory = lazy(() => import('../views/PaymentHistory'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/customers" element={<CustomerList />} />
          <Route path="/customers/:id" element={<CustomerDetails />} />
          <Route path="/customers/:id/payments" element={<PaymentHistory />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

// Dynamic imports for components
const useLazyComponent = (importFn: () => Promise<any>) => {
  const [component, setComponent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const loadComponent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const loadedComponent = await importFn();
      setComponent(loadedComponent.default);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [importFn]);
  
  return { component, loading, error, loadComponent };
};
```

#### 2. React Performance Optimization
```typescript
// Memoization for expensive components
const CustomerList: React.FC<CustomerListProps> = React.memo(({ customers, onSelect }) => {
  return (
    <div className="customer-list">
      {customers.map(customer => (
        <CustomerCard
          key={customer.id}
          customer={customer}
          onSelect={() => onSelect(customer)}
        />
      ))}
    </div>
  );
});

// useMemo for expensive calculations
const CustomerAnalytics: React.FC<{ customers: Customer[] }> = ({ customers }) => {
  const analytics = useMemo(() => {
    return {
      totalCustomers: customers.length,
      activeCustomers: customers.filter(c => c.active).length,
      averageAge: customers.reduce((sum, c) => sum + getAge(c.dateOfBirth), 0) / customers.length,
      revenue: customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0),
    };
  }, [customers]);
  
  return (
    <div className="analytics">
      <div>Total Customers: {analytics.totalCustomers}</div>
      <div>Active Customers: {analytics.activeCustomers}</div>
      <div>Average Age: {Math.round(analytics.averageAge)}</div>
      <div>Total Revenue: ${analytics.revenue / 100}</div>
    </div>
  );
};

// useCallback for event handlers
const CustomerListContainer: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  const handleSelect = useCallback((customer: Customer) => {
    // Handle customer selection
    navigate(`/customers/${customer.id}`);
  }, [navigate]);
  
  return (
    <CustomerList 
      customers={customers} 
      onSelect={handleSelect}
    />
  );
};
```

#### 3. Virtual Scrolling for Large Lists
```typescript
// Virtual scrolling for large customer lists
import { FixedSizeList as List } from 'react-window';

interface VirtualizedCustomerListProps {
  customers: Customer[];
  onSelect: (customer: Customer) => void;
  height: number;
  itemHeight: number;
}

export const VirtualizedCustomerList: React.FC<VirtualizedCustomerListProps> = ({
  customers,
  onSelect,
  height,
  itemHeight,
}) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <CustomerRow
        customer={customers[index]}
        onSelect={onSelect}
      />
    </div>
  );
  
  return (
    <List
      height={height}
      itemCount={customers.length}
      itemSize={itemHeight}
      width="100%"
    >
      {Row}
    </List>
  );
};
```

---

## Security Best Practices

### Input Validation

#### 1. Server-side Validation
```typescript
import Joi from 'joi';

// Comprehensive validation schemas
const customerSchema = Joi.object({
  firstName: Joi.string().min(1).max(100).pattern(/^[a-zA-Z\s-']+$/).required()
    .messages({
      'string.pattern.base': 'First name can only contain letters, spaces, hyphens, and apostrophes',
      'string.min': 'First name is required',
      'string.max': 'First name cannot exceed 100 characters'
    }),
  
  lastName: Joi.string().min(1).max(100).pattern(/^[a-zA-Z\s-']+$/).required()
    .messages({
      'string.pattern.base': 'Last name can only contain letters, spaces, hyphens, and apostrophes',
    }),
  
  email: Joi.string().email().max(255).required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.max': 'Email address cannot exceed 255 characters'
    }),
  
  phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).min(10).max(20).optional()
    .messages({
      'string.pattern.base': 'Phone number can only contain digits, spaces, hyphens, and parentheses',
      'string.min': 'Phone number must be at least 10 digits',
      'string.max': 'Phone number cannot exceed 20 characters'
    }),
  
  billingAddress: Joi.object({
    line1: Joi.string().min(1).max(200).required(),
    line2: Joi.string().max(200).allow(''),
    city: Joi.string().min(1).max(100).required(),
    state: Joi.string().length(2).pattern(/^[A-Z]{2}$/).required(),
    postalCode: Joi.string().pattern(/^\d{5}(-\d{4})?$/).required(),
    country: Joi.string().length(2).pattern(/^[A-Z]{2}$/).required()
  }).required(),
  
  customFields: Joi.object().pattern(
    Joi.string().alphanum().max(50),
    Joi.alternatives().try(
      Joi.string().max(255),
      Joi.number(),
      Joi.boolean()
    )
  ).max(20).optional()
});

// Validation middleware
const validateCustomerData = (req: Request, res: Response, next: NextFunction) => {
  const { error, value } = customerSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });
  
  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      value: detail.context?.value
    }));
    
    return res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: errors
      }
    });
  }
  
  req.body = value;
  next();
};
```

#### 2. SQL Injection Prevention
```typescript
// Always use parameterized queries with Drizzle ORM
// BAD: Never do this
async function findCustomer(name: string) {
  const query = `SELECT * FROM customers WHERE name = '${name}'`; // VULNERABLE!
  return await db.query(query);
}

// GOOD: Use parameterized queries
async function findCustomerByName(name: string) {
  return await db
    .select()
    .from(customers)
    .where(ilike(customers.name, name)) // Automatically parameterized
    .limit(10);
}

// GOOD: Dynamic queries with proper parameterization
async function searchCustomers(filters: SearchFilters) {
  const conditions = [];
  const params: any[] = [];
  
  if (filters.name) {
    conditions.push(sql`${customers.name} ILIKE ${'%' + filters.name + '%'}`);
  }
  
  if (filters.email) {
    conditions.push(sql`${customers.email} ILIKE ${'%' + filters.email + '%'}`);
  }
  
  if (filters.active !== undefined) {
    conditions.push(sql`${customers.active} = ${filters.active}`);
  }
  
  let query = db.select().from(customers);
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }
  
  return await query.limit(filters.limit || 50);
}
```

#### 3. XSS Prevention
```typescript
// Sanitize user input for display
import DOMPurify from 'dompurify';

// React automatically escapes content, but sanitize for external use
const sanitizeHtml = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: []
  });
};

// Use dangerouslySetInnerHTML only with sanitized content
const Comment: React.FC<{ content: string }> = ({ content }) => {
  const sanitizedContent = sanitizeHtml(content);
  
  return (
    <div 
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
};

// For rich text editors, use controlled input
const RichTextEditor: React.FC = () => {
  const [content, setContent] = useState('');
  
  const handleChange = (value: string) => {
    // Validate and sanitize on change
    const sanitized = sanitizeHtml(value);
    setContent(sanitized);
  };
  
  return (
    <textarea
      value={content}
      onChange={(e) => handleChange(e.target.value)}
      className="w-full h-32 border rounded p-2"
    />
  );
};
```

### Authentication Security

#### 1. JWT Token Security
```typescript
// Secure JWT configuration
const jwtConfig = {
  algorithm: 'HS256',
  secret: process.env.JWT_SECRET, // Must be at least 32 characters
  expiresIn: '1h', // Shorter expiration for better security
  issuer: 'oracle-ledger',
  audience: 'oracle-ledger-api',
  jwtid: crypto.randomUUID(), // Unique token ID
};

// Token generation with claims
function generateAccessToken(user: User): string {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour
      iss: 'oracle-ledger',
      aud: 'oracle-ledger-api',
      jti: crypto.randomUUID(),
    },
    process.env.JWT_SECRET!,
    {
      algorithm: 'HS256',
      expiresIn: '1h',
    }
  );
}

// Token validation middleware
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      error: 'Access token required'
    });
  }
  
  jwt.verify(token, process.env.JWT_SECRET!, (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Token expired'
        });
      }
      
      if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
          error: 'Invalid token'
        });
      }
      
      return res.status(401).json({
        error: 'Token validation failed'
      });
    }
    
    req.user = decoded;
    next();
  });
};
```

#### 2. Password Security
```typescript
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Secure password hashing
const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12; // Use high salt rounds
  return await bcrypt.hash(password, saltRounds);
};

// Password validation
const validatePassword = (password: string): PasswordValidationResult => {
  const errors: string[] = [];
  
  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  // Check against common passwords
  if (isCommonPassword(password)) {
    errors.push('Password is too common');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    score: calculatePasswordScore(password)
  };
};

// Password comparison
const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

// Generate secure reset token
function generateResetToken(): { token: string; hash: string; expiresAt: Date } {
  const token = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 3600000); // 1 hour
  
  return { token, hash, expiresAt };
}
```

#### 3. Rate Limiting
```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

// Multiple rate limit strategies
const createRateLimit = (options: RateLimitOptions) => {
  return rateLimit({
    store: new RedisStore({
      client: redisClient,
      prefix: options.prefix,
    }),
    windowMs: options.windowMs,
    max: options.max,
    keyGenerator: options.keyGenerator,
    skip: options.skip,
    handler: (req, res) => {
      res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.round(options.windowMs / 1000)
      });
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Different rate limits for different endpoints
export const authLimiter = createRateLimit({
  prefix: 'auth:',
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per 15 minutes
  keyGenerator: (req) => req.ip,
  skip: (req) => req.method !== 'POST',
});

export const apiLimiter = createRateLimit({
  prefix: 'api:',
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per 15 minutes
  keyGenerator: (req) => req.ip,
});

export const paymentLimiter = createRateLimit({
  prefix: 'payment:',
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 payment requests per minute
  keyGenerator: (req) => `${req.ip}:${req.user?.id || 'anonymous'}`,
});

// Apply rate limits
app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);
app.use('/api/payments', paymentLimiter);
app.use('/api/ach-payments', paymentLimiter);
```

---

## Version Control

### Git Configuration

#### 1. Gitignore
```gitignore
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build outputs
dist/
build/
coverage/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Database
*.sqlite
*.db

# Cache
.cache/
.parcel-cache/

# Temporary files
tmp/
temp/
*.tmp

# Test artifacts
test-results/
playwright-report/
screenshots/
videos/

# Security
private-key.pem
*.pem
*.key
```

#### 2. Git Hooks
```bash
#!/bin/sh
# .husky/pre-commit

# Run linting
npm run lint

# Run type checking
npm run type-check

# Run tests
npm run test

# Check for secrets
npm run detect-secrets scan --exclude-files 'package-lock.json'

# If any check fails, prevent commit
if [ $? -ne 0 ]; then
  echo "Pre-commit checks failed. Please fix the issues before committing."
  exit 1
fi
```

```bash
#!/bin/sh
# .husky/commit-msg

commit_regex='^(feat|fix|docs|style|refactor|test|chore)(\(.+\))?: .{1,50}'

if ! grep -qE "$commit_regex" "$1"; then
    echo "Invalid commit message format."
    echo "Format: type(scope): subject"
    echo "Types: feat, fix, docs, style, refactor, test, chore"
    echo "Example: feat(customer): add customer search functionality"
    exit 1
fi
```

### Branch Strategy

#### 1. Branch Protection Rules
```yaml
# GitHub branch protection configuration
branch_protection:
  main:
    required_status_checks:
      strict: true
      contexts:
        - "CI"
        - "Lint"
        - "Type Check"
        - "Test"
        - "Security Scan"
    
    enforce_admins: true
    required_pull_request_reviews:
      required_approving_review_count: 2
      dismiss_stale_reviews: true
      require_code_owner_reviews: true
    
    restrictions:
      push:
        - admins
      merge:
        - admins

  develop:
    required_status_checks:
      strict: true
      contexts:
        - "CI"
        - "Test"
    
    required_pull_request_reviews:
      required_approving_review_count: 1
```

#### 2. Release Branch Workflow
```
main (production)
├── develop (integration)
    ├── release/v1.2.0
    ├── feature/payment-analytics
    ├── hotfix/critical-bug
    └── chore/dependencies
```

---

## Release Procedures

### Version Management

#### 1. Semantic Versioning
```
MAJOR.MINOR.PATCH

MAJOR: Breaking changes (e.g., API changes, database schema changes)
MINOR: New features (backward compatible)
PATCH: Bug fixes (backward compatible)

Examples:
- v1.0.0: Initial release
- v1.1.0: Add ACH payments feature
- v1.1.1: Fix ACH payment bug
- v2.0.0: Major API redesign
```

#### 2. Release Process
```bash
#!/bin/bash
# release.sh

VERSION=$1

if [ -z "$VERSION" ]; then
  echo "Usage: ./release.sh <version>"
  exit 1
fi

# Validate version format
if ! [[ $VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Version must be in format X.Y.Z"
  exit 1
fi

echo "Releasing version $VERSION..."

# 1. Update version in package.json
npm version $VERSION --no-git-tag-version

# 2. Update changelog
npm run changelog

# 3. Run tests
npm run test:ci

# 4. Build application
npm run build

# 5. Create release commit
git add -A
git commit -m "release: v$VERSION"
git tag "v$VERSION"

# 6. Push changes
git push origin main --follow-tags

# 7. Create GitHub release
npm run release:github

# 8. Deploy to staging
npm run deploy:staging

# 9. Wait for staging verification
echo "Staging deployment complete. Please verify before production deployment."
echo "Press enter to continue with production deployment..."
read

# 10. Deploy to production
npm run deploy:production

echo "Release v$VERSION completed successfully!"
```

### Automated Deployments

#### 1. CI/CD Pipeline
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run type checking
      run: npm run type-check
    
    - name: Run tests
      run: npm run test:ci
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info

  build:
    needs: test
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20.x'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build application
      run: npm run build
    
    - name: Upload build artifacts
      uses: actions/upload-artifact@v3
      with:
        name: build-files
        path: dist/

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Download build artifacts
      uses: actions/download-artifact@v3
      with:
        name: build-files
        path: dist/
    
    - name: Deploy to staging
      run: npm run deploy:staging
      env:
        AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
        AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}

  deploy-production:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Download build artifacts
      uses: actions/download-artifact@v3
      with:
        name: build-files
        path: dist/
    
    - name: Deploy to production
      run: npm run deploy:production
      env:
        AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
        AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

#### 2. Docker Deployment
```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/shared ./shared

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Set permissions
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3001

CMD ["node", "server/api.js"]
```

#### 3. Kubernetes Deployment
```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: oracle-ledger-api
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: oracle-ledger-api
  template:
    metadata:
      labels:
        app: oracle-ledger-api
    spec:
      containers:
      - name: api
        image: oracle-ledger:latest
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-secret
              key: url
        - name: STRIPE_SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: stripe-secret
              key: secret-key
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: oracle-ledger-api-service
  namespace: production
spec:
  selector:
    app: oracle-ledger-api
  ports:
  - port: 80
    targetPort: 3001
  type: ClusterIP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: oracle-ledger-api-ingress
  namespace: production
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
spec:
  tls:
  - hosts:
    - api.yourdomain.com
    secretName: oracle-ledger-tls
  rules:
  - host: api.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: oracle-ledger-api-service
            port:
              number: 80
```

---

## Development Tools

### Recommended Tools

#### 1. API Development
- **REST Client**: VS Code extension for API testing
- **Postman**: API development and testing
- **Insomnia**: Alternative API client
- **Stripe CLI**: Local webhook testing

#### 2. Database Tools
- **Drizzle Studio**: Database browser and editor
- **pgAdmin**: PostgreSQL administration
- **DataGrip**: Database IDE
- **TablePlus**: Database client

#### 3. Monitoring and Debugging
- **Chrome DevTools**: Frontend debugging
- **React Developer Tools**: React component debugging
- **Node.js Inspector**: Backend debugging
- **Winston**: Logging library

#### 4. Testing Tools
- **Jest**: Unit testing framework
- **Supertest**: API testing
- **Playwright**: End-to-end testing
- **Cypress**: Alternative E2E testing

### Build Scripts

#### 1. Package.json Scripts
```json
{
  "scripts": {
    "dev": "vite",
    "dev:backend": "tsx server/api.ts",
    "dev:full": "concurrently \"npm run dev\" \"npm run dev:backend\"",
    "build": "vite build",
    "build:check": "npm run type-check && npm run lint",
    "preview": "vite preview",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:integration": "jest --testPathPattern=integration",
    "test:e2e": "playwright test",
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "type-check": "tsc --noEmit",
    "db:generate": "drizzle-kit generate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "db:migrate": "drizzle-kit migrate",
    "db:reset": "drizzle-kit push --force",
    "detect-secrets": "detect-secrets scan --all-files",
    "security:audit": "npm audit && snyk test",
    "docker:build": "docker build -t oracle-ledger .",
    "docker:run": "docker run -p 3001:3001 oracle-ledger",
    "release:github": "semantic-release"
  }
}
```

---

*This Developer Guide provides comprehensive documentation for developing and customizing ORACLE-LEDGER Stripe Integration. For additional information, see DEPLOYMENT_GUIDE.md, API_INTEGRATION_GUIDE.md, CONFIGURATION_GUIDE.md, and TROUBLESHOOTING_GUIDE.md.*
