import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, users, auditLog } from '$lib/db';
import { eq, and, ne } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params }) => {
	const user = db.select().from(users).where(eq(users.id, +params.id)).get();
	if (!user) throw error(404, 'User not found');
	return json(user);
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const { name, jobTitle, email, departmentId } = await request.json();
	const id = +params.id;

	const existing = db.select().from(users).where(eq(users.id, id)).get();
	if (!existing) throw error(404, 'User not found');

	if (!name?.trim()) {
		return json({ error: 'Name is required' }, { status: 400 });
	}

	const trimmedEmail = email?.trim() || null;
	if (trimmedEmail) {
		const duplicateEmail = db.select().from(users).where(and(eq(users.email, trimmedEmail), ne(users.id, id))).get();
		if (duplicateEmail) {
			return json({ error: `Email '${trimmedEmail}' already exists` }, { status: 400 });
		}
	}

	const result = db
		.update(users)
		.set({
			name: name.trim(),
			jobTitle: jobTitle?.trim() || null,
			email: trimmedEmail,
			departmentId: departmentId || null,
			updatedAt: new Date().toISOString()
		})
		.where(eq(users.id, id))
		.returning()
		.get();

	db.insert(auditLog)
		.values({
			entityType: 'user',
			entityId: id,
			action: 'update',
			changes: JSON.stringify({ before: existing, after: result })
		})
		.run();

	return json(result);
};

export const DELETE: RequestHandler = async ({ params }) => {
	const id = +params.id;
	const existing = db.select().from(users).where(eq(users.id, id)).get();
	if (!existing) throw error(404, 'User not found');

	db.insert(auditLog)
		.values({
			entityType: 'user',
			entityId: id,
			action: 'delete',
			changes: JSON.stringify(existing)
		})
		.run();

	db.delete(users).where(eq(users.id, id)).run();
	return json({ success: true });
};
