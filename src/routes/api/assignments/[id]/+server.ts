import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, assignments, auditLog } from '$lib/db';
import { eq } from 'drizzle-orm';

export const DELETE: RequestHandler = async ({ params }) => {
	const id = +params.id;
	const existing = db.select().from(assignments).where(eq(assignments.id, id)).get();
	if (!existing) throw error(404, 'Not found');

	db.insert(auditLog)
		.values({
			entityType: 'assignment',
			entityId: id,
			action: 'delete',
			changes: JSON.stringify(existing)
		})
		.run();

	db.delete(assignments).where(eq(assignments.id, id)).run();
	return json({ success: true });
};
