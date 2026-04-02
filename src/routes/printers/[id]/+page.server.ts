import type { PageServerLoad } from './$types';
import { db, printers, rooms, computers, notebooks } from '$lib/db';
import { eq, asc } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const item = db.select().from(printers).where(eq(printers.id, +params.id)).get();
	if (!item) throw error(404, 'Not found');
	return {
		printer: item,
		rooms: db.select().from(rooms).orderBy(asc(rooms.name)).all(),
		computers: db.select().from(computers).orderBy(asc(computers.name)).all(),
		notebooks: db.select().from(notebooks).orderBy(asc(notebooks.name)).all()
	};
};
