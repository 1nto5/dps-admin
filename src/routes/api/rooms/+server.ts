import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, rooms, auditLog } from '$lib/db';
import { desc, eq } from 'drizzle-orm';

export const GET: RequestHandler = async () => {
	const allRooms = db.select().from(rooms).orderBy(desc(rooms.createdAt)).all();
	return json(allRooms);
};

export const POST: RequestHandler = async ({ request }) => {
	const { name } = await request.json();

	if (!name?.trim()) {
		return json({ error: 'Name is required' }, { status: 400 });
	}

	const trimmedName = name.trim();
	const existing = db.select().from(rooms).where(eq(rooms.name, trimmedName)).get();
	if (existing) {
		return json({ error: `Room '${trimmedName}' already exists` }, { status: 400 });
	}

	const result = db
		.insert(rooms)
		.values({
			name: trimmedName
		})
		.returning()
		.get();

	// Audit log
	db.insert(auditLog)
		.values({
			entityType: 'room',
			entityId: result.id,
			action: 'create',
			changes: JSON.stringify(result)
		})
		.run();

	return json(result, { status: 201 });
};
