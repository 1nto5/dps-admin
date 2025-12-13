import type { PageServerLoad } from './$types';
import { db, auditLog } from '$lib/db';
import { desc } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
	const logs = db
		.select()
		.from(auditLog)
		.orderBy(desc(auditLog.performedAt))
		.limit(100)
		.all();

	return { logs };
};
