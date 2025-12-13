import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, departments, auditLog } from '$lib/db';
import { eq, and, ne } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params }) => {
	const department = db.select().from(departments).where(eq(departments.id, +params.id)).get();

	if (!department) {
		throw error(404, 'Department not found');
	}

	return json(department);
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const { name } = await request.json();
	const id = +params.id;

	const existing = db.select().from(departments).where(eq(departments.id, id)).get();
	if (!existing) {
		throw error(404, 'Department not found');
	}

	if (!name?.trim()) {
		return json({ error: 'Name is required' }, { status: 400 });
	}

	const trimmedName = name.trim();
	const duplicate = db.select().from(departments).where(and(eq(departments.name, trimmedName), ne(departments.id, id))).get();
	if (duplicate) {
		return json({ error: `Department '${trimmedName}' already exists` }, { status: 400 });
	}

	const now = new Date().toISOString();
	const result = db
		.update(departments)
		.set({
			name: trimmedName,
			updatedAt: now
		})
		.where(eq(departments.id, id))
		.returning()
		.get();

	// Audit log
	db.insert(auditLog)
		.values({
			entityType: 'department',
			entityId: id,
			action: 'update',
			changes: JSON.stringify({
				before: existing,
				after: result
			})
		})
		.run();

	return json(result);
};

export const DELETE: RequestHandler = async ({ params }) => {
	const id = +params.id;

	const existing = db.select().from(departments).where(eq(departments.id, id)).get();
	if (!existing) {
		throw error(404, 'Department not found');
	}

	// Audit log before deletion
	db.insert(auditLog)
		.values({
			entityType: 'department',
			entityId: id,
			action: 'delete',
			changes: JSON.stringify(existing)
		})
		.run();

	db.delete(departments).where(eq(departments.id, id)).run();

	return json({ success: true });
};
