# SOVRCVLT ORACLE-LEDGER

## Overview
A sophisticated financial console for managing a double-entry general ledger for GM Family Trust and SOVR Development Holdings LLC. Enterprise-grade full-stack application with React frontend, Express backend API, PostgreSQL database, and AI-powered financial analysis using Google's Gemini API.

## Project Architecture
- **Frontend**: React 19 with TypeScript, Vite 6
- **Backend**: Express.js API server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS (via CDN for production)
- **Charts**: Recharts for financial visualizations
- **AI Integration**: Google Gemini API for financial analysis
- **Blockchain**: Consul Credits integration with Ethereum Sepolia
- **Deployment**: Configured for autoscale deployment

## Full-Stack Architecture (September 12, 2025)
- ✅ **PRODUCTION DEPLOYMENT COMPLETED**
- ✅ **CRITICAL SECURITY FIX**: Eliminated database credential exposure to browsers
- ✅ **Full client-server separation** with proper backend API
- ✅ **PostgreSQL database integration** with comprehensive schema
- ✅ **Express backend API** running on port 3001
- ✅ **React frontend** running on port 5000
- ✅ **Concurrently managed** full-stack development workflow

## Database Schema & Integration
- ✅ **Comprehensive PostgreSQL schema** with Drizzle ORM
- ✅ **Employee management** with secure payment method storage
- ✅ **Journal entries** with double-entry bookkeeping
- ✅ **Vendor management** with payment terms and contact tracking
- ✅ **Company cards** with transaction monitoring and spending controls
- ✅ **Purchase orders** and invoice tracking
- ✅ **Consul Credits** blockchain transaction logging
- ✅ **Type-safe database operations** with proper numeric handling

## Security Architecture
- ✅ **Backend API server** securely handles all database operations
- ✅ **DATABASE_URL protection** - never exposed to browser
- ✅ **CORS configuration** for secure cross-origin requests
- ✅ **Environment secrets** properly managed server-side
- ✅ **API service layer** with fetch-based client communication

## Environment Configuration
- **DATABASE_URL**: PostgreSQL connection (server-side only)
- **GEMINI_API_KEY**: Required for AI financial analysis features
- **Frontend Server**: Vite on port 5000 (host: 0.0.0.0)
- **Backend Server**: Express API on port 3001
- **Production Build**: Full-stack deployment with autoscale

## Core Business Features
- **Financial Dashboard** with real-time KPIs and AI-powered analysis
- **Double-entry bookkeeping** with comprehensive journal entry management
- **Chart of accounts** tracking with automated categorization
- **Purchase order workflows** with approval processes
- **Accounts receivable/payable** management with aging reports
- **Vendor management** with comprehensive contact and payment term tracking
- **Employee payroll** with multiple payment methods (Bank, ACH, Wire, Crypto)

## Advanced Features
- **Company Card & Virtual Treasury Management**
  - Multi-type card support (Virtual, Physical, Fleet, Gas)
  - Real-time transaction monitoring with posting date analytics
  - Spending controls with daily/monthly/transaction limits
  - Card assignment tracking and comprehensive utilization reports
  - Secure card number reveal system with audit trails

- **Consul Credits Blockchain Integration**
  - Smart contract wrapper for ERC-20 token deposits/withdrawals
  - Automatic journal entry creation from blockchain events
  - Oracle integrator functionality for off-chain mint/burn operations
  - Real-time transaction monitoring and contract reserves tracking
  - Ethereum Sepolia testnet integration with 3-confirmation security

## Technical Stack Details
- **Frontend**: React 19, TypeScript, Vite 6, Tailwind CSS
- **Backend**: Express.js, TypeScript, CORS-enabled API
- **Database**: PostgreSQL with Drizzle ORM, comprehensive schema
- **Blockchain**: Ethers.js, Web3 integration, smart contract interaction
- **AI**: Google Gemini API for financial insights and analysis
- **Development**: Concurrently managed full-stack workflow
- **Production**: Autoscale deployment with proper credential protection

## Production Status ✅
- **Security**: Enterprise-grade with proper backend API separation
- **Database**: Full PostgreSQL integration with persistent data storage
- **Scalability**: Configured for autoscale production deployment
- **Performance**: Optimized with type-safe operations and efficient queries
- **Blockchain**: Consul Credits integration enabled for production use

## Current System State
- **Frontend Server**: Running on port 5000 (Vite development server)
- **Backend API**: Running on port 3001 (Express with database connectivity)
- **Database**: PostgreSQL with comprehensive business entity schema
- **Deployment**: Ready for production autoscale deployment
- **Security**: All credentials properly secured server-side

## Development Workflow
- **Full-Stack Development**: `npm run dev:full` (runs both frontend and backend)
- **Frontend Only**: `npm run dev` (Vite development server)
- **Backend Only**: `npm run dev:backend` (Express API server)
- **Database Operations**: Drizzle ORM with `npm run db:push` for schema updates
- **Production Build**: `npm run build` followed by `npm run preview`

## User Preferences
- Enterprise-focused financial management interface
- Real-time data updates with database persistence
- Comprehensive audit trails for all financial transactions
- Secure blockchain integration for advanced treasury operations