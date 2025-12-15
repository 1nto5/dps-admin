import type { PageServerLoad } from './$types';
import { db, workEntries } from '$lib/db';
import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const entry = db.select().from(workEntries).where(eq(workEntries.id, +params.id)).get();
	if (!entry) throw error(404, 'Entry not found');
	return { entry };
};
