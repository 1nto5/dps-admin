import type { PageServerLoad } from './$types';
import { db, rooms, users } from '$lib/db';

export const load: PageServerLoad = async () => {
	return { rooms: db.select().from(rooms).all(), users: db.select().from(users).all() };
};
