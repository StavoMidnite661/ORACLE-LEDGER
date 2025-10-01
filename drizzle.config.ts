import { defineConfig } from 'drizzle-kit';

// Use SQLite for local development, PostgreSQL for Replit
const isLocal = !process.env.DATABASE_URL;

export default defineConfig({
  dialect: isLocal ? 'sqlite' : 'postgresql',
  schema: './shared/schema.ts',
  out: './drizzle',
  dbCredentials: isLocal
    ? { url: './local.db' }
    : { url: process.env.DATABASE_URL! },
});
