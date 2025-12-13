import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, departments, auditLog } from '$lib/db';
import { desc, eq } from 'drizzle-orm';

export const GET: RequestHandler = async () => {
	const allDepartments = db.select().from(departments).orderBy(desc(departments.createdAt)).all();
	return json(allDepartments);
};

export const POST: RequestHandler = async ({ request }) => {
	const { name } = await request.json();

	if (!name?.trim()) {
		return json({ error: 'Name is required' }, { status: 400 });
	}

	const trimmedName = name.trim();
	const existing = db.select().from(departments).where(eq(departments.name, trimmedName)).get();
	if (existing) {
		return json({ error: `Department '${trimmedName}' already exists` }, { status: 400 });
	}

	const result = db
		.insert(departments)
		.values({
			name: trimmedName
		})
		.returning()
		.get();

	// Audit log
	db.insert(auditLog)
		.values({
			entityType: 'department',
			entityId: result.id,
			action: 'create',
			changes: JSON.stringify(result)
		})
		.run();

	return json(result, { status: 201 });
};
