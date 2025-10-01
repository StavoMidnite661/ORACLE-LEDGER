import * as schema from "../shared/schema";

// Use SQLite for local development, PostgreSQL for Replit
const isLocal = !process.env.DATABASE_URL;

let db: any;

if (isLocal) {
  // Local development with SQLite
  const Database = require('better-sqlite3');
  const { drizzle } = require('drizzle-orm/better-sqlite3');
  
  const sqlite = new Database('./local.db');
  db = drizzle(sqlite, { schema });
  
  console.log('🗄️  Using SQLite database (local.db) for local development');
} else {
  // Replit/Production with PostgreSQL
  const { Pool, neonConfig } = require('@neondatabase/serverless');
  const { drizzle } = require('drizzle-orm/neon-serverless');
  const WebSocket = require('ws');
  
  // Configure Neon for WebSocket connections in Node.js
  neonConfig.webSocketConstructor = WebSocket;
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle({ client: pool, schema });
  
  console.log('🗄️  Using PostgreSQL database (Replit)');
}

export { db };
