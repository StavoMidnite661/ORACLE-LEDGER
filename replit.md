# SOVRCVLT ORACLE-LEDGER

## Overview
A sophisticated financial console for managing a double-entry general ledger for GM Family Trust and SOVR Development Holdings LLC. Built with React, TypeScript, and Vite, featuring AI-powered financial analysis using Google's Gemini API.

## Project Architecture
- **Frontend**: React 19 with TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS (via CDN)
- **Charts**: Recharts for financial visualizations
- **AI Integration**: Google Gemini API for financial analysis
- **Deployment**: Configured for autoscale deployment

## Recent Changes (September 11, 2025)
- ✅ Configured Vite for Replit environment (host: 0.0.0.0, port: 5000)
- ✅ Added HMR configuration for HTTPS proxy support
- ✅ Set up GEMINI_API_KEY environment variable
- ✅ Configured frontend workflow on port 5000
- ✅ Set up autoscale deployment configuration
- ✅ Built comprehensive vendor management system with advanced search and CRUD operations
- ✅ **Completed comprehensive company card and virtual treasury management system**
  - Digital spend cards, fleet/gas cards, and virtual card management
  - Transaction tracking with posting date analytics
  - Spending controls and utilization monitoring
  - Card lifecycle management (create, suspend, activate)
  - Enterprise-ready with proper data integrity and React patterns

## Environment Configuration
- **GEMINI_API_KEY**: Required for AI financial analysis features
- **Development Server**: Runs on port 5000 with host 0.0.0.0
- **Production Build**: Uses Vite build with preview server

## Key Features
- Dashboard with financial KPIs and AI analysis
- Journal entry management
- Chart of accounts tracking
- Purchase order workflows
- Accounts receivable/payable management
- Vendor management with comprehensive contact and payment term tracking
- **Company card and virtual treasury management**
  - Multi-type card support (Virtual, Physical, Fleet, Gas)
  - Real-time transaction monitoring and analytics
  - Spending controls with daily/monthly/transaction limits
  - Card assignment tracking and utilization reports
- Payroll processing
- Vendor payment tracking

## Security Notes
- Gemini API key is exposed to browser (intentional for client-side AI calls)
- Consider restricting API key to Replit domain in Google AI Studio
- Application uses secure HTTPS in production environment

## User Preferences
- No specific user preferences documented yet

## Next Steps
- Consider adding server-side API proxy for Gemini calls if enhanced security is needed
- Monitor API usage and implement rate limiting if necessary