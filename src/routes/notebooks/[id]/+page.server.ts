import type { PageServerLoad } from './$types';
import { db, notebooks, rooms, users } from '$lib/db';
import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const item = db.select().from(notebooks).where(eq(notebooks.id, +params.id)).get();
	if (!item) throw error(404, 'Not found');
	return { notebook: item, rooms: db.select().from(rooms).all(), users: db.select().from(users).all() };
};
