import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, assignments, auditLog } from '$lib/db';

export const POST: RequestHandler = async ({ request }) => {
	const { userId, computerId, notebookId, printerId } = await request.json();

	if (!userId) {
		return json({ error: 'User is required' }, { status: 400 });
	}

	if (!computerId && !notebookId && !printerId) {
		return json({ error: 'Select at least one equipment' }, { status: 400 });
	}

	const result = db
		.insert(assignments)
		.values({
			userId,
			computerId: computerId || null,
			notebookId: notebookId || null,
			printerId: printerId || null
		})
		.returning()
		.get();

	db.insert(auditLog)
		.values({
			entityType: 'assignment',
			entityId: result.id,
			action: 'create',
			changes: JSON.stringify(result)
		})
		.run();

	return json(result, { status: 201 });
};
