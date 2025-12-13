import type { PageServerLoad } from './$types';
import { db, printers, rooms, computers, notebooks } from '$lib/db';
import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const item = db.select().from(printers).where(eq(printers.id, +params.id)).get();
	if (!item) throw error(404, 'Not found');
	return {
		printer: item,
		rooms: db.select().from(rooms).all(),
		computers: db.select().from(computers).all(),
		notebooks: db.select().from(notebooks).all()
	};
};
