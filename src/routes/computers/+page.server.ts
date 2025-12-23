import type { PageServerLoad } from './$types';
import { db, computers, rooms, users } from '$lib/db';
import { asc, eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ depends }) => {
	depends('data:computers');
	const all = db
		.select({
			id: computers.id,
			name: computers.name,
			type: computers.type,
			status: computers.status,
			inventoryNumber: computers.inventoryNumber,
			manufacturer: computers.manufacturer,
			model: computers.model,
			cpu: computers.cpu,
			ram: computers.ram,
			storage: computers.storage,
			roomId: computers.roomId,
			roomName: rooms.name,
			userId: computers.userId,
			userName: users.name
		})
		.from(computers)
		.leftJoin(rooms, eq(computers.roomId, rooms.id))
		.leftJoin(users, eq(computers.userId, users.id))
		.orderBy(asc(computers.name))
		.all();

	return { computers: all };
};
