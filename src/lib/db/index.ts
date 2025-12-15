import { drizzle, type BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import { Database } from 'bun:sqlite';
import { building } from '$app/environment';
import * as schema from './schema';

const dbPath = './data/inventory.db';

// Skip database initialization during build
let _db: BunSQLiteDatabase<typeof schema> | null = null;

function getDb() {
	if (building) {
		throw new Error('Database not available during build');
	}
	if (!_db) {
		const sqlite = new Database(dbPath);
		_db = drizzle(sqlite, { schema });
		migrate(_db, { migrationsFolder: './drizzle/migrations' });
	}
	return _db;
}

export const db = new Proxy({} as BunSQLiteDatabase<typeof schema>, {
	get(_, prop) {
		return (getDb() as any)[prop];
	}
});

// Re-export schema
export * from './schema';
