import type { PageServerLoad } from './$types';
import { db, rooms } from '$lib/db';
import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const room = db.select().from(rooms).where(eq(rooms.id, +params.id)).get();

	if (!room) {
		throw error(404, 'Room not found');
	}

	return {
		room
	};
};
