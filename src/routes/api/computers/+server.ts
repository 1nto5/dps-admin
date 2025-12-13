import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, computers, auditLog } from '$lib/db';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request }) => {
	const data = await request.json();

	if (!data.name?.trim()) {
		return json({ error: 'Name is required' }, { status: 400 });
	}

	const trimmedName = data.name.trim();
	const trimmedInv = data.inventoryNumber?.trim() || null;
	const trimmedSerial = data.serialNumber?.trim() || null;

	const dupName = db.select().from(computers).where(eq(computers.name, trimmedName)).get();
	if (dupName) return json({ error: `Computer '${trimmedName}' already exists` }, { status: 400 });

	if (trimmedInv) {
		const dupInv = db.select().from(computers).where(eq(computers.inventoryNumber, trimmedInv)).get();
		if (dupInv) return json({ error: `Inventory number '${trimmedInv}' already exists` }, { status: 400 });
	}

	if (trimmedSerial) {
		const dupSerial = db.select().from(computers).where(eq(computers.serialNumber, trimmedSerial)).get();
		if (dupSerial) return json({ error: `Serial number '${trimmedSerial}' already exists` }, { status: 400 });
	}

	const result = db
		.insert(computers)
		.values({
			name: trimmedName,
			type: data.type || 'PC',
			status: data.status || 'preparing',
			inventoryNumber: trimmedInv,
			manufacturer: data.manufacturer?.trim() || null,
			model: data.model?.trim() || null,
			serialNumber: trimmedSerial,
			cpu: data.cpu?.trim() || null,
			ram: data.ram?.trim() || null,
			storage: data.storage?.trim() || null,
			windows: data.windows?.trim() || null,
			office: data.office?.trim() || null,
			notes: data.notes?.trim() || null,
			purchaseDate: data.purchaseDate || null,
			roomId: data.roomId || null
		})
		.returning()
		.get();

	db.insert(auditLog).values({
		entityType: 'computer',
		entityId: result.id,
		action: 'create',
		changes: JSON.stringify(result)
	}).run();

	return json(result, { status: 201 });
};
