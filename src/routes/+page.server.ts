import type { PageServerLoad } from './$types';
import { db, departments, rooms, users, computers, notebooks, monitors, printers, assignments } from '$lib/db';
import { count } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
	const [departmentsCount] = db.select({ count: count() }).from(departments).all();
	const [roomsCount] = db.select({ count: count() }).from(rooms).all();
	const [usersCount] = db.select({ count: count() }).from(users).all();
	const [computersCount] = db.select({ count: count() }).from(computers).all();
	const [notebooksCount] = db.select({ count: count() }).from(notebooks).all();
	const [monitorsCount] = db.select({ count: count() }).from(monitors).all();
	const [printersCount] = db.select({ count: count() }).from(printers).all();
	const [assignmentsCount] = db.select({ count: count() }).from(assignments).all();

	return {
		counts: {
			departments: departmentsCount?.count ?? 0,
			rooms: roomsCount?.count ?? 0,
			users: usersCount?.count ?? 0,
			computers: computersCount?.count ?? 0,
			notebooks: notebooksCount?.count ?? 0,
			monitors: monitorsCount?.count ?? 0,
			printers: printersCount?.count ?? 0,
			assignments: assignmentsCount?.count ?? 0
		}
	};
};
