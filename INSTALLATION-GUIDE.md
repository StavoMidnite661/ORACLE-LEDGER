# SOVRCVLT Oracle-Ledger - Complete Installation Guide

## 📋 Prerequisites Installation

### Step 1: Install Node.js
1. **Download Node.js 20 or higher**
   - Visit: https://nodejs.org/
   - Download the LTS version (20.x or higher)
   - Run the installer (Windows: `.msi`, Mac: `.pkg`)
   - Verify installation:
     ```bash
     node --version  # Should show v20.x.x or higher
     npm --version   # Should show 10.x.x or higher
     ```

### Step 2: Install Git
1. **Download Git**
   - Visit: https://git-scm.com/downloads
   - Download for your OS
   - Run installer with default settings
   - Verify installation:
     ```bash
     git --version  # Should show git version 2.x.x
     ```

### Step 3: Install PostgreSQL Database

#### Option A: Local PostgreSQL (Recommended for Development)
1. **Download PostgreSQL 16**
   - Visit: https://www.postgresql.org/download/
   - Download installer for your OS
   - Run installer and remember:
     - Port: 5432 (default)
     - Username: postgres (default)
     - Password: [YOUR_PASSWORD]

2. **Create Database**
   ```bash
   # Windows: Open SQL Shell (psql) from Start Menu
   # Enter password when prompted
   
   CREATE DATABASE sovr_ledger;
   ```

3. **Your DATABASE_URL will be:**
   ```
   postgresql://postgres:YOUR_PASSWORD@localhost:5432/sovr_ledger
   ```

#### Option B: Cloud PostgreSQL (Free Tier)
1. **Neon Database** (Recommended)
   - Visit: https://neon.tech
   - Sign up for free account
   - Create new project: "sovr-ledger"
   - Copy the connection string (starts with `postgresql://`)

2. **Supabase** (Alternative)
   - Visit: https://supabase.com
   - Create free account
   - Create new project
   - Go to Settings → Database
   - Copy connection string

## 🚀 Project Installation

### Step 4: Clone/Download the Project
```bash
# If using Git (clone from repository)
git clone [YOUR_REPO_URL]
cd sovrcvlt-oracle-ledger

# OR download ZIP and extract, then:
cd sovrcvlt-oracle-ledger
```

### Step 5: Install All Dependencies
```bash
npm install
```

**This installs all required packages:**
- **Frontend Dependencies:**
  - `react` (v19) - UI framework
  - `react-dom` - React rendering
  - `recharts` - Financial charts
  - `vite` (v6) - Frontend build tool
  - `ethers` - Blockchain integration
  - `web3` - Ethereum connectivity

- **Backend Dependencies:**
  - `express` - API server framework
  - `cors` - Cross-origin requests
  - `@neondatabase/serverless` - PostgreSQL client
  - `drizzle-orm` - Database ORM
  - `drizzle-kit` - Database migrations
  - `@google/genai` - AI integration
  - `ws` - WebSocket support

- **Development Tools:**
  - `typescript` - Type safety
  - `tsx` - TypeScript execution
  - `ts-node` - Node TypeScript runner
  - `concurrently` - Run multiple servers

## ⚙️ Environment Configuration

### Step 6: Create Environment File
Create a `.env` file in the project root:

```bash
# Windows Command Prompt:
type nul > .env

# Windows PowerShell:
New-Item .env -ItemType File

# Mac/Linux:
touch .env
```

### Step 7: Configure Environment Variables
Open `.env` in a text editor and add:

```env
# Database Connection (REQUIRED)
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/sovr_ledger

# API Server Port (Optional - defaults to 3001)
API_PORT=3001

# Frontend Server Port (Optional - defaults to 5000)
PORT=5000

# Google Gemini AI (Optional - for AI features)
GEMINI_API_KEY=your_gemini_api_key_here

# Blockchain Configuration (Optional - for Consul Credits)
CONSUL_CREDITS_CONTRACT=0x742d35Cc6Bf4E79c3e5f6d4e3d0A8dd6B6E6a5A4
ETHEREUM_RPC_URL=https://rpc.sepolia.org
ORACLE_INTEGRATOR_ADDRESS=0x1234567890AbcdEF1234567890aBcdef12345678
```

**Important Notes:**
- Replace `YOUR_PASSWORD` with your actual PostgreSQL password
- If using cloud database, replace entire `DATABASE_URL` with connection string from Neon/Supabase
- `GEMINI_API_KEY` is optional (only needed for AI-powered financial analysis)
- Blockchain variables are optional (only for Consul Credits feature)

## 🗄️ Database Setup

### Step 8: Initialize Database Schema
```bash
npm run db:push
```

**This command:**
- Connects to your PostgreSQL database
- Creates all 14 tables
- Sets up ENUM types
- Creates indexes and relationships
- No manual SQL execution needed!

**If you see warnings about data loss:**
```bash
npm run db:push --force
```

### Step 9: Verify Database (Optional)
```bash
# Connect to database
psql postgresql://postgres:YOUR_PASSWORD@localhost:5432/sovr_ledger

# List all tables
\dt

# You should see:
# - accounts
# - journal_entries
# - journal_lines
# - employees
# - vendors
# - company_cards
# - card_transactions
# - purchase_orders
# - purchase_order_items
# - invoices
# - consul_credits_transactions
# - card_reveal_audit

# Exit psql
\q
```

## 🎯 Server Entry Points & Connection Architecture

### Entry Point 1: Backend API Server
**File:** `server/api.ts`  
**Port:** 3001 (configurable via `API_PORT`)  
**Purpose:** Handles all database operations and business logic

**Start Command:**
```bash
npm run dev:backend
```

**Endpoints:**
- `http://localhost:3001/api/health` - Health check
- `http://localhost:3001/api/employees` - Employee management
- `http://localhost:3001/api/journal-entries` - Double-entry bookkeeping
- `http://localhost:3001/api/vendors` - Vendor management
- `http://localhost:3001/api/company-cards` - Card management
- `http://localhost:3001/api/card-transactions` - Transaction tracking
- `http://localhost:3001/api/purchase-orders` - PO management
- `http://localhost:3001/api/invoices` - AR/AP invoices
- `http://localhost:3001/api/consul-credits-transactions` - Blockchain

**Database Connection:**
```
server/api.ts → server/db.ts → PostgreSQL Database
```

### Entry Point 2: Frontend Server
**File:** `vite.config.ts` + `src/main.tsx`  
**Port:** 5000 (configurable via `PORT`)  
**Purpose:** React UI served by Vite development server

**Start Command:**
```bash
npm run dev
```

**Access:** `http://localhost:5000`

**API Communication:**
```
Frontend (port 5000) → API Service → Backend (port 3001) → Database
```

### Entry Point 3: Full-Stack Development (Recommended)
**Command:** Runs both servers concurrently
```bash
npm run dev:full
```

**This starts:**
1. Backend API on port 3001
2. Frontend UI on port 5000
3. Both servers with auto-reload on changes

## 🔌 Connection Points Map

```
┌─────────────────────────────────────────────────┐
│           SOVR Oracle Ledger Architecture        │
└─────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Frontend   │────────▶│  Backend API │────────▶│  PostgreSQL  │
│              │         │              │         │   Database   │
│  React/Vite  │  HTTP   │   Express    │  SQL    │              │
│  Port: 5000  │ Requests│  Port: 3001  │ Queries │ Port: 5432   │
└──────────────┘         └──────────────┘         └──────────────┘
       │                        │                          │
       │                        │                          │
       ▼                        ▼                          ▼
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Browser    │         │  API Routes  │         │   14 Tables  │
│  User Access │         │  28 Endpoints│         │   9 ENUMs    │
│              │         │              │         │   Relations  │
└──────────────┘         └──────────────┘         └──────────────┘

External Integrations (Optional):
┌──────────────┐         ┌──────────────┐
│  Google AI   │         │  Ethereum    │
│  Gemini API  │         │  Blockchain  │
│  (Optional)  │         │  (Optional)  │
└──────────────┘         └──────────────┘
```

## 🏃 Running the Application

### Quick Start (Development)
```bash
# 1. Install dependencies (one time)
npm install

# 2. Setup database (one time)
npm run db:push

# 3. Start everything
npm run dev:full
```

**You should see:**
```
[0] VITE v6.3.6  ready in XXX ms
[0] ➜  Local:   http://localhost:5000/
[1] API server running on port 3001
```

### Access Points
- **Application UI:** http://localhost:5000
- **API Health Check:** http://localhost:3001/api/health
- **API Documentation:** See API-SPECIFICATION.md

### Individual Server Commands

**Backend Only:**
```bash
npm run dev:backend
# API available at http://localhost:3001
```

**Frontend Only:**
```bash
npm run dev
# UI available at http://localhost:5000
```

**Both Servers (Recommended):**
```bash
npm run dev:full
# Backend: http://localhost:3001
# Frontend: http://localhost:5000
```

## 🔍 Testing the Installation

### Test 1: Backend API
```bash
# Test health endpoint
curl http://localhost:3001/api/health

# Expected response:
# {"status":"OK","timestamp":"2025-10-01T..."}
```

### Test 2: Frontend Access
1. Open browser: http://localhost:5000
2. You should see the Oracle-Ledger dashboard
3. Check browser console (F12) for no errors

### Test 3: Database Connection
```bash
# Test database query
curl http://localhost:3001/api/employees

# Expected response:
# [] (empty array if no data, or list of employees)
```

## 📁 Project Structure & Key Files

```
sovrcvlt-oracle-ledger/
├── server/
│   ├── api.ts              # ENTRY POINT: Backend API server
│   ├── db.ts               # Database connection
│   └── storage.ts          # Database operations (unused in API mode)
│
├── src/
│   ├── main.tsx            # ENTRY POINT: Frontend React app
│   ├── App.tsx             # Main application component
│   └── services/
│       └── apiService.ts   # API client (connects to backend)
│
├── shared/
│   └── schema.ts           # Database schema (Drizzle ORM)
│
├── drizzle.config.ts       # Database configuration
├── vite.config.ts          # Frontend build configuration
├── package.json            # Dependencies & scripts
├── .env                    # Environment variables (YOU CREATE THIS)
│
├── database-schema.sql     # SQL schema (for reference)
├── API-SPECIFICATION.md    # API documentation
└── INSTALLATION-GUIDE.md   # This file
```

## 🛠️ Troubleshooting

### Issue: "Cannot connect to database"
**Solution:**
1. Check PostgreSQL is running
2. Verify DATABASE_URL in `.env`
3. Test connection:
   ```bash
   psql postgresql://postgres:password@localhost:5432/sovr_ledger
   ```

### Issue: "Port 3001 already in use"
**Solution:**
```bash
# Change API_PORT in .env
API_PORT=3002

# Or kill the process using port 3001
# Windows:
netstat -ano | findstr :3001
taskkill /PID [PID_NUMBER] /F

# Mac/Linux:
lsof -ti:3001 | xargs kill
```

### Issue: "Port 5000 already in use"
**Solution:**
```bash
# Change PORT in .env
PORT=5001

# Or kill the process
# (same as above, but use :5000)
```

### Issue: "Module not found" errors
**Solution:**
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: Database schema changes not applying
**Solution:**
```bash
# Force push schema changes
npm run db:push --force
```

## 🚀 Production Deployment (Optional)

### Build for Production
```bash
# Build frontend
npm run build

# Preview production build
npm run preview
```

### Production Environment Variables
Add to `.env.production`:
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@production-db:5432/dbname
API_PORT=3001
PORT=5000
```

## 📞 Support & Documentation

- **Database Schema:** `database-schema.sql`
- **API Documentation:** `API-SPECIFICATION.md`
- **Windows Setup:** `SETUP.md`
- **Environment Variables:** `.env` (create from examples above)

## ✅ Installation Checklist

- [ ] Node.js 20+ installed
- [ ] PostgreSQL 16+ installed (local or cloud)
- [ ] Project downloaded/cloned
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file created with DATABASE_URL
- [ ] Database schema pushed (`npm run db:push`)
- [ ] Backend running (`npm run dev:backend`)
- [ ] Frontend running (`npm run dev`)
- [ ] Application accessible at http://localhost:5000
- [ ] API responding at http://localhost:3001/api/health

---

**You're all set! The Oracle-Ledger is now running locally on your machine.** 🎉

No more Replit hosting costs - you have complete control over your financial management system.
