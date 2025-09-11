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