import type { PageServerLoad } from './$types';
import { db, rooms } from '$lib/db';
import { asc } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
	const allRooms = db.select().from(rooms).orderBy(asc(rooms.name)).all();

	return {
		rooms: allRooms
	};
};
