import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, users, auditLog } from '$lib/db';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request }) => {
	const { name, jobTitle, email, departmentId } = await request.json();

	if (!name?.trim()) {
		return json({ error: 'Name is required' }, { status: 400 });
	}

	const trimmedEmail = email?.trim() || null;
	if (trimmedEmail) {
		const existingEmail = db.select().from(users).where(eq(users.email, trimmedEmail)).get();
		if (existingEmail) {
			return json({ error: `Email '${trimmedEmail}' already exists` }, { status: 400 });
		}
	}

	const result = db
		.insert(users)
		.values({
			name: name.trim(),
			jobTitle: jobTitle?.trim() || null,
			email: trimmedEmail,
			departmentId: departmentId || null
		})
		.returning()
		.get();

	db.insert(auditLog)
		.values({
			entityType: 'user',
			entityId: result.id,
			action: 'create',
			changes: JSON.stringify(result)
		})
		.run();

	return json(result, { status: 201 });
};
