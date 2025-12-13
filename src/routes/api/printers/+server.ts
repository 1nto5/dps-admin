import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, printers, auditLog } from '$lib/db';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request }) => {
	const data = await request.json();
	if (!data.name?.trim()) return json({ error: 'Name required' }, { status: 400 });

	const trimmedName = data.name.trim();
	const trimmedInv = data.inventoryNumber?.trim() || null;
	const trimmedSerial = data.serialNumber?.trim() || null;
	const trimmedIp = data.ipAddress?.trim() || null;

	const dupName = db.select().from(printers).where(eq(printers.name, trimmedName)).get();
	if (dupName) return json({ error: `Printer '${trimmedName}' already exists` }, { status: 400 });

	if (trimmedInv) {
		const dupInv = db.select().from(printers).where(eq(printers.inventoryNumber, trimmedInv)).get();
		if (dupInv) return json({ error: `Inventory number '${trimmedInv}' already exists` }, { status: 400 });
	}

	if (trimmedSerial) {
		const dupSerial = db.select().from(printers).where(eq(printers.serialNumber, trimmedSerial)).get();
		if (dupSerial) return json({ error: `Serial number '${trimmedSerial}' already exists` }, { status: 400 });
	}

	if (trimmedIp) {
		const dupIp = db.select().from(printers).where(eq(printers.ipAddress, trimmedIp)).get();
		if (dupIp) return json({ error: `IP address '${trimmedIp}' already exists` }, { status: 400 });
	}

	const result = db.insert(printers).values({
		name: trimmedName, status: data.status || 'preparing',
		inventoryNumber: trimmedInv,
		manufacturer: data.manufacturer?.trim() || null,
		model: data.model?.trim() || null,
		serialNumber: trimmedSerial,
		ipAddress: trimmedIp, isNetwork: data.isNetwork || 0,
		notes: data.notes?.trim() || null, purchaseDate: data.purchaseDate || null,
		roomId: data.roomId || null
	}).returning().get();
	db.insert(auditLog).values({ entityType: 'printer', entityId: result.id, action: 'create', changes: JSON.stringify(result) }).run();
	return json(result, { status: 201 });
};
