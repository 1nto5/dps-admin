import type { PageServerLoad } from './$types';
import { db, printers, rooms, computers, notebooks } from '$lib/db';
import { asc, eq, sql } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
	const all = db.select({
		id: printers.id, name: printers.name, status: printers.status,
		inventoryNumber: printers.inventoryNumber, manufacturer: printers.manufacturer,
		model: printers.model, ipAddress: printers.ipAddress, isNetwork: printers.isNetwork,
		roomId: printers.roomId, roomName: rooms.name,
		computerId: printers.computerId, computerName: computers.name,
		notebookId: printers.notebookId, notebookName: notebooks.name
	}).from(printers)
	.leftJoin(rooms, eq(printers.roomId, rooms.id))
	.leftJoin(computers, eq(printers.computerId, computers.id))
	.leftJoin(notebooks, eq(printers.notebookId, notebooks.id))
	.orderBy(asc(printers.name)).all();
	return { printers: all };
};
