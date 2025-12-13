import type { PageServerLoad } from './$types';
import { db, computers, rooms, monitors, users } from '$lib/db';
import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const item = db.select().from(computers).where(eq(computers.id, +params.id)).get();
	if (!item) throw error(404, 'Not found');
	const assignedMonitors = db.select().from(monitors).where(eq(monitors.computerId, +params.id)).all();
	return { computer: item, rooms: db.select().from(rooms).all(), users: db.select().from(users).all(), monitors: assignedMonitors };
};
