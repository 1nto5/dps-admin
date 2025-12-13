import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, monitors, auditLog } from '$lib/db';
import { eq, and, ne } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params }) => {
	const item = db.select().from(monitors).where(eq(monitors.id, +params.id)).get();
	if (!item) throw error(404, 'Not found');
	return json(item);
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const id = +params.id;
	const data = await request.json();
	const existing = db.select().from(monitors).where(eq(monitors.id, id)).get();
	if (!existing) throw error(404, 'Not found');
	if (!data.name?.trim()) return json({ error: 'Name required' }, { status: 400 });

	const trimmedName = data.name.trim();
	const trimmedInv = data.inventoryNumber?.trim() || null;
	const trimmedSerial = data.serialNumber?.trim() || null;

	if (trimmedInv) {
		const dupInv = db.select().from(monitors).where(and(eq(monitors.inventoryNumber, trimmedInv), ne(monitors.id, id))).get();
		if (dupInv) return json({ error: `Inventory number '${trimmedInv}' already exists` }, { status: 400 });
	}

	if (trimmedSerial) {
		const dupSerial = db.select().from(monitors).where(and(eq(monitors.serialNumber, trimmedSerial), ne(monitors.id, id))).get();
		if (dupSerial) return json({ error: `Serial number '${trimmedSerial}' already exists` }, { status: 400 });
	}

	const result = db.update(monitors).set({
		name: trimmedName, status: data.status,
		inventoryNumber: trimmedInv,
		manufacturer: data.manufacturer?.trim() || null,
		model: data.model?.trim() || null,
		serialNumber: trimmedSerial,
		notes: data.notes?.trim() || null, purchaseDate: data.purchaseDate || null,
		computerId: data.computerId || null, updatedAt: new Date().toISOString()
	}).where(eq(monitors.id, id)).returning().get();
	db.insert(auditLog).values({ entityType: 'monitor', entityId: id, action: 'update', changes: JSON.stringify({ before: existing, after: result }) }).run();
	return json(result);
};

export const DELETE: RequestHandler = async ({ params }) => {
	const id = +params.id;
	const existing = db.select().from(monitors).where(eq(monitors.id, id)).get();
	if (!existing) throw error(404, 'Not found');
	db.insert(auditLog).values({ entityType: 'monitor', entityId: id, action: 'delete', changes: JSON.stringify(existing) }).run();
	db.delete(monitors).where(eq(monitors.id, id)).run();
	return json({ success: true });
};
