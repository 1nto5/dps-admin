import type { PageServerLoad } from './$types';
import { db, auditLog, users, rooms, departments, computers, notebooks } from '$lib/db';
import { desc } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
	const logs = db
		.select()
		.from(auditLog)
		.orderBy(desc(auditLog.performedAt))
		.limit(100)
		.all();

	const buildMap = (rows: { id: number; name: string }[]) =>
		Object.fromEntries(rows.map((r) => [r.id, r.name]));

	return {
		logs,
		lookups: {
			users: buildMap(db.select({ id: users.id, name: users.name }).from(users).all()),
			rooms: buildMap(db.select({ id: rooms.id, name: rooms.name }).from(rooms).all()),
			departments: buildMap(db.select({ id: departments.id, name: departments.name }).from(departments).all()),
			computers: buildMap(db.select({ id: computers.id, name: computers.name }).from(computers).all()),
			notebooks: buildMap(db.select({ id: notebooks.id, name: notebooks.name }).from(notebooks).all())
		}
	};
};
