import { db, settings } from './db';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function verifyPassword(password: string): Promise<boolean> {
	const result = db.select().from(settings).where(eq(settings.key, 'password_hash')).get();
	if (!result) return false;
	return bcrypt.compare(password, result.value);
}

export async function setPassword(password: string): Promise<void> {
	const hash = await bcrypt.hash(password, 10);
	const existing = db.select().from(settings).where(eq(settings.key, 'password_hash')).get();

	if (existing) {
		db.update(settings).set({ value: hash }).where(eq(settings.key, 'password_hash')).run();
	} else {
		db.insert(settings).values({ key: 'password_hash', value: hash }).run();
	}
}

export function hasPassword(): boolean {
	const result = db.select().from(settings).where(eq(settings.key, 'password_hash')).get();
	return !!result;
}

export function createSessionToken(): string {
	return crypto.randomUUID();
}

export function getSessionExpiry(): Date {
	return new Date(Date.now() + SESSION_DURATION);
}
