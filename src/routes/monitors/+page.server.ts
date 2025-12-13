import type { PageServerLoad } from './$types';
import { db, monitors, computers } from '$lib/db';
import { asc, eq } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
	const all = db.select({
		id: monitors.id, name: monitors.name, status: monitors.status,
		inventoryNumber: monitors.inventoryNumber, manufacturer: monitors.manufacturer,
		model: monitors.model, computerId: monitors.computerId, computerName: computers.name
	}).from(monitors).leftJoin(computers, eq(monitors.computerId, computers.id))
	.orderBy(asc(monitors.name)).all();
	return { monitors: all };
};
