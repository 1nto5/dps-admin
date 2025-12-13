import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, rooms, auditLog } from '$lib/db';
import { eq, and, ne } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params }) => {
	const room = db.select().from(rooms).where(eq(rooms.id, +params.id)).get();

	if (!room) {
		throw error(404, 'Room not found');
	}

	return json(room);
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const { name } = await request.json();
	const id = +params.id;

	const existing = db.select().from(rooms).where(eq(rooms.id, id)).get();
	if (!existing) {
		throw error(404, 'Room not found');
	}

	if (!name?.trim()) {
		return json({ error: 'Name is required' }, { status: 400 });
	}

	const trimmedName = name.trim();
	const duplicate = db.select().from(rooms).where(and(eq(rooms.name, trimmedName), ne(rooms.id, id))).get();
	if (duplicate) {
		return json({ error: `Room '${trimmedName}' already exists` }, { status: 400 });
	}

	const now = new Date().toISOString();
	const result = db
		.update(rooms)
		.set({
			name: trimmedName,
			updatedAt: now
		})
		.where(eq(rooms.id, id))
		.returning()
		.get();

	// Audit log
	db.insert(auditLog)
		.values({
			entityType: 'room',
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

	const existing = db.select().from(rooms).where(eq(rooms.id, id)).get();
	if (!existing) {
		throw error(404, 'Room not found');
	}

	// Audit log before deletion
	db.insert(auditLog)
		.values({
			entityType: 'room',
			entityId: id,
			action: 'delete',
			changes: JSON.stringify(existing)
		})
		.run();

	db.delete(rooms).where(eq(rooms.id, id)).run();

	return json({ success: true });
};
