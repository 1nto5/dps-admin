import type { PageServerLoad } from './$types';
import { db, monitors, computers } from '$lib/db';
import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const item = db.select().from(monitors).where(eq(monitors.id, +params.id)).get();
	if (!item) throw error(404, 'Not found');
	return { monitor: item, computers: db.select().from(computers).all() };
};
