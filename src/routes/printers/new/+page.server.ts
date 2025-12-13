import type { PageServerLoad } from './$types';
import { db, rooms, computers, notebooks } from '$lib/db';
export const load: PageServerLoad = async () => ({
	rooms: db.select().from(rooms).all(),
	computers: db.select().from(computers).all(),
	notebooks: db.select().from(notebooks).all()
});
