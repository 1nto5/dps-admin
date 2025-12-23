import type { PageServerLoad } from './$types';
import { db, notebooks, rooms, users } from '$lib/db';
import { asc, eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ depends }) => {
	depends('data:notebooks');
	const all = db
		.select({
			id: notebooks.id,
			name: notebooks.name,
			status: notebooks.status,
			inventoryNumber: notebooks.inventoryNumber,
			manufacturer: notebooks.manufacturer,
			model: notebooks.model,
			cpu: notebooks.cpu,
			ram: notebooks.ram,
			storage: notebooks.storage,
			roomId: notebooks.roomId,
			roomName: rooms.name,
			userId: notebooks.userId,
			userName: users.name
		})
		.from(notebooks)
		.leftJoin(rooms, eq(notebooks.roomId, rooms.id))
		.leftJoin(users, eq(notebooks.userId, users.id))
		.orderBy(asc(notebooks.name))
		.all();

	return { notebooks: all };
};
