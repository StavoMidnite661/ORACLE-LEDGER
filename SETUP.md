# Running SOVR Oracle Ledger Locally on Windows

This guide will help you download and run this app on your Windows desktop.

## Prerequisites

1. **Install Node.js** (v18 or higher)
   - Download from: https://nodejs.org/
   - Choose the LTS (Long Term Support) version
   - During installation, check "Add to PATH"

2. **Verify Installation**
   - Open Command Prompt (cmd) or PowerShell
   - Run: `node --version`
   - Run: `npm --version`

## Database Options

This app uses PostgreSQL. Choose ONE of these options:

### Option 1: Use Free Cloud PostgreSQL (Easiest)

1. **Create a free Neon database** (recommended):
   - Go to: https://neon.tech
   - Sign up for free
   - Create a new project
   - Copy your connection string (starts with `postgresql://`)

2. **Or use Supabase** (alternative):
   - Go to: https://supabase.com
   - Sign up for free
   - Create a new project
   - Go to Settings > Database
   - Copy your connection string

### Option 2: Install PostgreSQL Locally

1. **Download PostgreSQL**:
   - Go to: https://www.postgresql.org/download/windows/
   - Download and install PostgreSQL 15 or higher
   - Remember the password you set for the `postgres` user

2. **Create Database**:
   - Open pgAdmin (installed with PostgreSQL)
   - Create a new database called `sovr_ledger`
   - Your connection string will be: `postgresql://postgres:YOUR_PASSWORD@localhost:5432/sovr_ledger`

## Setup Steps

1. **Download the Project**
   - Download all project files to a folder on your computer
   - Example: `C:\Projects\sovr-ledger`

2. **Open Command Prompt in Project Folder**
   - Navigate to your project folder
   - Or right-click in the folder and select "Open in Terminal"

3. **Create Environment File**
   - Create a file named `.env` in the project root
   - Add your database connection string:
   ```
   DATABASE_URL=postgresql://your_connection_string_here
   ```

4. **Install Dependencies**
   ```cmd
   npm install
   ```

5. **Set Up Database Tables**
   ```cmd
   npm run db:push
   ```

6. **Start the Application**
   ```cmd
   npm run dev:full
   ```

7. **Access the App**
   - Frontend: Open your browser to `http://localhost:5000`
   - Backend API: Running on `http://localhost:3001`

## Quick Start

After downloading and setting up your DATABASE_URL:

```cmd
npm install
npm run db:push
npm run dev:full
```

## Troubleshooting

### "npm is not recognized"
- Node.js is not installed or not in PATH
- Reinstall Node.js and check "Add to PATH"
- Restart Command Prompt after installation

### Database Connection Errors
- Verify your DATABASE_URL is correct
- Make sure your database is running (if local)
- Check your internet connection (if using cloud database)

### Port Already in Use
- If port 5000 or 3001 is already in use, close other applications using those ports

## Development Scripts

- **Start Development**: `npm run dev:full`
- **Backend Only**: `npm run dev:backend`
- **Frontend Only**: `npm run dev`
- **View Database**: `npm run db:studio` (opens Drizzle Studio)
- **Update Database Schema**: `npm run db:push`

## File Structure

- `.env` - Your database connection string (create this file)
- `server/` - Backend API code
- `src/` - Frontend React code
- `shared/` - Shared database schema

## Notes

- Your data is stored in the PostgreSQL database you connected
- The app works the same locally as it does on Replit
- Keep your `.env` file private - never share your DATABASE_URL
- For production deployment, see Replit's publish feature

## Alternative: Keep Using Replit's Database

If you want to keep using this Replit's database even when running locally:

1. In Replit, go to the "Secrets" tab
2. Copy your `DATABASE_URL` value
3. Create a `.env` file locally with that DATABASE_URL
4. Run `npm install` and `npm run dev:full`

This way you can develop locally but still use the Replit-hosted database.
