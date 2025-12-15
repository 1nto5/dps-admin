import { drizzle } from 'drizzle-orm/bun-sqlite';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import { Database } from 'bun:sqlite';
import { building } from '$app/environment';
import * as schema from './schema';

const dbPath = './data/inventory.db';
const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });

// Run migrations only at runtime (skip during build)
if (!building) {
	migrate(db, { migrationsFolder: './drizzle/migrations' });
}

// Re-export schema
export * from './schema';
