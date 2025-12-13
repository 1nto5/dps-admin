import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, printers, auditLog } from '$lib/db';
import { eq, and, ne } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params }) => {
	const item = db.select().from(printers).where(eq(printers.id, +params.id)).get();
	if (!item) throw error(404, 'Not found');
	return json(item);
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const id = +params.id;
	const data = await request.json();
	const existing = db.select().from(printers).where(eq(printers.id, id)).get();
	if (!existing) throw error(404, 'Not found');
	if (!data.name?.trim()) return json({ error: 'Name required' }, { status: 400 });

	const trimmedName = data.name.trim();
	const trimmedInv = data.inventoryNumber?.trim() || null;
	const trimmedSerial = data.serialNumber?.trim() || null;
	const trimmedIp = data.ipAddress?.trim() || null;

	const dupName = db.select().from(printers).where(and(eq(printers.name, trimmedName), ne(printers.id, id))).get();
	if (dupName) return json({ error: `Printer '${trimmedName}' already exists` }, { status: 400 });

	if (trimmedInv) {
		const dupInv = db.select().from(printers).where(and(eq(printers.inventoryNumber, trimmedInv), ne(printers.id, id))).get();
		if (dupInv) return json({ error: `Inventory number '${trimmedInv}' already exists` }, { status: 400 });
	}

	if (trimmedSerial) {
		const dupSerial = db.select().from(printers).where(and(eq(printers.serialNumber, trimmedSerial), ne(printers.id, id))).get();
		if (dupSerial) return json({ error: `Serial number '${trimmedSerial}' already exists` }, { status: 400 });
	}

	if (trimmedIp) {
		const dupIp = db.select().from(printers).where(and(eq(printers.ipAddress, trimmedIp), ne(printers.id, id))).get();
		if (dupIp) return json({ error: `IP address '${trimmedIp}' already exists` }, { status: 400 });
	}

	const result = db.update(printers).set({
		name: trimmedName, status: data.status,
		inventoryNumber: trimmedInv,
		manufacturer: data.manufacturer?.trim() || null,
		model: data.model?.trim() || null,
		serialNumber: trimmedSerial,
		ipAddress: trimmedIp, isNetwork: data.isNetwork || 0,
		notes: data.notes?.trim() || null, purchaseDate: data.purchaseDate || null,
		roomId: data.roomId || null, updatedAt: new Date().toISOString()
	}).where(eq(printers.id, id)).returning().get();
	db.insert(auditLog).values({ entityType: 'printer', entityId: id, action: 'update', changes: JSON.stringify({ before: existing, after: result }) }).run();
	return json(result);
};

export const DELETE: RequestHandler = async ({ params }) => {
	const id = +params.id;
	const existing = db.select().from(printers).where(eq(printers.id, id)).get();
	if (!existing) throw error(404, 'Not found');
	db.insert(auditLog).values({ entityType: 'printer', entityId: id, action: 'delete', changes: JSON.stringify(existing) }).run();
	db.delete(printers).where(eq(printers.id, id)).run();
	return json({ success: true });
};
