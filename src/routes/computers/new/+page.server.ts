import type { PageServerLoad } from './$types';
import { db, rooms, users } from '$lib/db';
import { asc } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
	return { rooms: db.select().from(rooms).orderBy(asc(rooms.name)).all(), users: db.select().from(users).orderBy(asc(users.name)).all() };
};
