import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, monitors, auditLog } from '$lib/db';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request }) => {
	const data = await request.json();
	if (!data.name?.trim()) return json({ error: 'Name required' }, { status: 400 });

	const trimmedName = data.name.trim();
	const trimmedInv = data.inventoryNumber?.trim() || null;
	const trimmedSerial = data.serialNumber?.trim() || null;

	if (trimmedInv) {
		const dupInv = db.select().from(monitors).where(eq(monitors.inventoryNumber, trimmedInv)).get();
		if (dupInv) return json({ error: `Inventory number '${trimmedInv}' already exists` }, { status: 400 });
	}

	if (trimmedSerial) {
		const dupSerial = db.select().from(monitors).where(eq(monitors.serialNumber, trimmedSerial)).get();
		if (dupSerial) return json({ error: `Serial number '${trimmedSerial}' already exists` }, { status: 400 });
	}

	const result = db.insert(monitors).values({
		name: trimmedName, status: data.status || 'preparing',
		inventoryNumber: trimmedInv,
		manufacturer: data.manufacturer?.trim() || null,
		model: data.model?.trim() || null,
		serialNumber: trimmedSerial,
		notes: data.notes?.trim() || null, purchaseDate: data.purchaseDate || null,
		computerId: data.computerId || null
	}).returning().get();
	db.insert(auditLog).values({ entityType: 'monitor', entityId: result.id, action: 'create', changes: JSON.stringify(result) }).run();
	return json(result, { status: 201 });
};
