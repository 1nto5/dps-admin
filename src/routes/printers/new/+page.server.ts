import type { PageServerLoad } from './$types';
import { db, rooms, computers, notebooks } from '$lib/db';
import { asc } from 'drizzle-orm';
export const load: PageServerLoad = async () => ({
	rooms: db.select().from(rooms).orderBy(asc(rooms.name)).all(),
	computers: db.select().from(computers).orderBy(asc(computers.name)).all(),
	notebooks: db.select().from(notebooks).orderBy(asc(notebooks.name)).all()
});
